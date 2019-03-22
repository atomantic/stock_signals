// const addTimeseries = require('./add.timeseries')
const config = require('../config')
const log = require('./log')
const {	cloneDeep, isEqual, isUndefined, mean, merge, now } = require('lodash')
// const divergence = require('./divergence')
const getTimeseriesParams = require('./get.timeseries.params')
// const formatTechnicals = require('./format.technicals')
const parallel = require('async.parallel')
const readPrice = require('./read.price')
const readTimeseries = require('./read.timeseries')
const results = require('../data/latest')
const rollingLog = require('./log/rolling')
const runnerData = require('./runner.data')
const save = require('./save')
const stdout = require('./log/stdout.ticker')
const taskGetCryptoQuote = require('./task.get.quote.crypto')
const taskGetQuote = require('./task.get.quote.yahoo')
// const taskGetQuote = require('./task.get.quote.alphav')
//// NO LONGER USING THIS RUNNER TO SCRAPE SIGNALS
// using ./runner.all to fetch all tickers at once from the API for a given period
// const taskGetSignals = require('./task.get.signals.scrape')
const taskGetTimeseries = require('./task.get.timeseries.alphav')

function getNextSignal() {
	runner.data.i++
	runner.start = now()
	if (runner.data.i === config.tickers.length) {
		runner.data.i = 0
	}
	getSignal()
}

const runner = {
	data: runnerData,
	start: now(),
	// when can we run the next one?
	// this allows us to track when a rate-limited API 
	// has been hit and when it is safe to hit again
	next: now(), 
	run: getNextSignal,
	timeseriesThrottled: false,
	pause: (process.env.PAUSE_SECONDS||120)*1000
}

module.exports = runner

var retries = 0

// This is stupid but TradingView isn't rendering properly in casper/phantomjs, 
// so there is no price rendered.
// Instead, we have to hit the yahoo finance API, but the npm plugin (stock-quote) 
// requires a funky way of specifying the market--so anything on "AMEX-"" (e.g. AMEX-REMX) 
// needs to be specified with a market extension.
// however, I can't find the proper extension for REMX... 
// but I can simply load the yahoo HTML page with "REMX".
// works:
// https://finance.yahoo.com/quote/REMX
// doesn't work:
// https://query1.finance.yahoo.com/v10/finance/quoteSummary/REMX?&modules=financialData
// additionally, for crypto, we have to fetch from something else because 
// google and yahoo don't have crypto prices

function getSignal() {
	const ticker = config.tickers[runner.data.i]
	const tasks = []

	// we don't want to hit AlphaVantage after market hours
	// the rate limit of 500 per day requires no more than 1 hit every 2.8 minutes
	// if we went all day
	// stopping those hits on the main set between 4pm-6am
	// means we only hit it for 9 hours each day
	const hourOfDay = new Date().getHours()
	const afterHours = hourOfDay < 6 && hourOfDay > 15

	if(config.skip.indexOf(ticker)!==-1){
		// skip it (dead ticker)
		results.tickers[ticker] = cloneDeep(config.tickerSchema)
		console.log(ticker, 'skipped')
		return getNextSignal()
	}

	const tickerSplit = ticker.replace('crypto:', '').replace('swap:', '').split('-')
	const tickerName = tickerSplit[1]

	// swaps just use the alphavantage API (no tradingview data)
	if(ticker.includes('swap:')){
		if(afterHours){
			return runner.run()
		}
		// swaps are ETF/ETN tickers that don't have technical indicators on tradingview
		// we also collect different data points on these from alphavantage
		// these are meant to be swapped daily (e.g. SOXS/SOXL)
		const timeseriesParams = getTimeseriesParams(ticker, 'swap')
		const tasks = [
			taskGetQuote(tickerName)
		]
		if(!runner.timeseriesThrottled){
			tasks.push(
				taskGetTimeseries(tickerName, timeseriesParams.method, timeseriesParams.interval)
			)
		}
		parallel(tasks, function(err, data){
			if(err && err.includes('rate limit')){
				console.log('disabling timeseries for now')
				runner.timeseriesThrottled = true
			}
			let tickerResults = results.tickers[ticker]||cloneDeep(config.swapSchema)
			tickerResults.rsi = readTimeseries(tickerName, 'RSI', 'daily')
			tickerResults.cci = readTimeseries(tickerName, 'CCI', 'daily')
			tickerResults.avg = readPrice(tickerName, 'daily', 200)
			results.tickers[ticker] = tickerResults
			save(results, function(){
				log(ticker, '\t', ((now() - runner.start) / 1000) + 's', tickerResults.rsi, tickerResults.cci, tickerResults.avg)
			})
			setTimeout(runner.run, runner.pause)
		})
		return
	}
	if(ticker.indexOf('crypto:')!==-1){
		// need to split BTC/USD or things like CLOAKBTC into CLOAK/BTC
		// (split in config to support arbitrary name sizes)
		tasks.push(taskGetCryptoQuote(tickerSplit[0], tickerSplit[1]))
		// no longer scraping (now using API)
		// tasks.push(taskGetSignals(tickerSplit.join(''))) // trading view tasks crypto like BTCUSD
	}else{
		tasks.push(taskGetQuote(tickerName))
		// no longer scraping (now using API)
		// tasks.push(taskGetSignals(ticker))
		if(!runner.timeseriesThrottled && !afterHours){
			const timeseriesParams = getTimeseriesParams(ticker)
			tasks.push(taskGetTimeseries(tickerName, timeseriesParams.method, timeseriesParams.interval))
		}
	}
	parallel(tasks, function(err, data){
		if(err){
			if(err.includes('rate limit')){
				console.log('disabling timeseries for now')
				runner.timeseriesThrottled = true
			}
			if(retries < 3){
				// try it again
				retries++
				runner.data.i-- // back up one ticker
				console.log('retrying', ticker, err)
			}else{
				retries = 0 // reset (just skip this broken ticker)
				console.error('too many failures', ticker, err)
			}
			setTimeout(runner.run, runner.pause)
			return;
		}
		let price = data[0]
		// NO LONGER USING SCRAPER (tentatively)
		// let scraperData = data[1]

		if(isUndefined(results.tickers[ticker])){
			results.tickers[ticker] = cloneDeep(config.tickerSchema)
		}

		// copy the last run object so we can reference it
		// merge it on top of a copy of the tickerSchema to ensure the base values are present
		let previousLog = merge(cloneDeep(config.tickerSchema), cloneDeep(results.tickers[ticker])) 

		results.tickers[ticker] = cloneDeep(previousLog)
		// short var ref
		let tickerResults = results.tickers[ticker]
		// set the new result time to the previous time so we can deep compare the new data to old
		// later in order to do a quick match and see if nothing changed
		tickerResults.price = price
		// tickerResults.change = !previousLog.price ? 0 : Number((price - previousLog.price) / previousLog.price).toFixed(4)

		// console.log('tickerResults', ticker, tickerResults)
		// log(scraperData)
		// console.log(`process closed! exited with code: ${code}`)
		let timestamp = now()

		// update results with this ticker and runtime
		results.time = timestamp
		results.last = ticker
		if(!isEqual(tickerResults, previousLog)){
			tickerResults.time = timestamp
		}

		/*
		let testTime = (timestamp - results.time) / 1000
		let error = false
		let errorLine = ''
		// split scraper results into lines
		scraperData.split('\n').forEach(function (l) {
			var val = l.split(': ')[1]
			if(!val){
				return
			}
			if (l.includes('uncaughtError:') || l.includes('uncaughtException:')) {
				error = true
				errorLine = l
			}
			if (l.includes('data-technicals_1hour:')) {
				formatTechnicals(l, 0, tickerResults, previousLog)
			}
			if (l.includes('data-technicals_1day:')) {
				formatTechnicals(l, 1, tickerResults, previousLog)
			}
			if (l.includes('data-technicals_1week:')) {
				formatTechnicals(l, 2, tickerResults, previousLog)
			}
			if (l.includes('data-technicals_1month:')) {
				formatTechnicals(l, 3, tickerResults, previousLog)
			}
			// if(l.includes('data-html:')) {
			// 	fs.writeFileSync(__dirname+'/../snaps/'+ticker+'.html', l.split(': ')[1])
			// }
		})

		if (error) {
			log(scraperData)
			console.error('☠ ', ticker, testTime, 'seconds', errorLine)
			runner.run() // no need to pause
		}else{
			// console.log(tickerResults)
			// create aggregate signal for hourly/daily/weekly/monthly
			tickerResults.meta = Math.round(mean(tickerResults.sum))
			tickerResults.from = Math.round(mean(tickerResults.prev))

			if(data.length==3){
				tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', '60min')
				tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', 'daily')
				tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', 'weekly')
				tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', 'monthly')
			}else{
				// use the real-time divergence tracker (no access to historical data)
				// decide if we are either continuing daily bearish/bullish
				// or if we are diverging the other way
				tickerResults = divergence(tickerResults)
			}

			// if the tickerResults is the same as the previousLog,
			// don't save it to the rolling db (nothing new)
			if(!isEqual(tickerResults, previousLog)){
				tickerResults.time = timestamp
			}
			// console.log(JSON.stringify(tickerResults))
			// console.log(JSON.stringify(previousLog))
			// console.log(isEqual(tickerResults, previousLog), changed)
			*/
			save(results, function(){
				// write to the rolling db log file (for python parsing and back-testing)
				const previousLogState = ticker+','+
					previousLog.price+','+
					tickerResults.time+','+
					previousLog.meta+','+
					previousLog.from+','+
					previousLog.sum.join(',')+','+
					previousLog.prev.join(',')+','+
					previousLog.osc.map(x=>x.map(y=>y[y.length-1])).join(',')+','+
					previousLog.ma.map(x=>x.map(y=>y[y.length-1])).join(',')+','+
					previousLog.divergence.join(',')
				const currentLog = ticker+','+
					tickerResults.price+','+
					tickerResults.time+','+
					tickerResults.meta+','+
					tickerResults.from+','+
					tickerResults.sum.join(',')+','+
					tickerResults.prev.join(',')+','+
					tickerResults.osc.map(x=>x.map(y=>y[y.length-1])).join(',')+','+
					tickerResults.ma.map(x=>x.map(y=>y[y.length-1])).join(',')+','+
					tickerResults.divergence.join(',')

				let changed = false
				if(previousLogState!==currentLog){
					changed = true
					// even though we want to save N/A data with "/" in the JSON
					// for the spreadsheet, we want those values to be numeric 0
					// for pulling into the ML log
					rollingLog(currentLog.replace(/\//g,0))
				}
				// log it to the console
				stdout(ticker, tickerResults, changed, now() - runner.start)

				setTimeout(runner.run, runner.pause)
			})
		//}
	})
}