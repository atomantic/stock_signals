const config = require('../config')
const fs = require('fs')
const log = require('../utils/log')
const rollingLog = require('../utils/log.rolling')
const {	cloneDeep, isEqual, isNull, isUndefined, mean, merge, now } = require('lodash')
const parallel = require('async.parallel')
const push_signals = require('../utils/push_signals')
const request = require('request')
const results = require('../data/latest')
const runnerData = require('./runner.data')
const stdout = require('../utils/log.stdout.ticker')
const taskGetQuote = require('./task.get.quote.yahoo')
// const taskGetTimeseries = require('./task.get.timeseries.alphav')
// const getTimeSeriesParams = require('./get.timeseries.params')
// const taskGetQuote = require('./task.get.quote.alphav')
const taskGetSignals = require('./task.get.signals')

const runner = {
	data: runnerData,
	run: getNextSignal
}
module.exports = runner

var retries = 0

function getSignal() {
	const ticker = config.tickers[runner.data.i]


	if(config.skip.indexOf(ticker)!==-1){
		// skip it (dead ticker)
		results.tickers[ticker] = cloneDeep(config.tickerSchema)
		console.log(ticker, 'skipped')
		return getNextSignal()
	}

	const tickerName = ticker.split('-')[1]

	// const timeseriesParams = getTimeSeriesParams(ticker)
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
	parallel([
		taskGetQuote(tickerName)
		,taskGetSignals(ticker)
		// ,taskGetTimeseries(tickerName, timeseriesParams.method, timeseriesParams.interval)
	], function(err, data){
		if(err){
			if(retries < 3){
				// try it again
				retries++
				runner.data.i-- // back up one ticker
				console.log('retrying', ticker)
			}else{
				retries = 0 // reset (just skip this broken ticker)
				console.error('too many failures', ticker)
			}
			setTimeout(function () {
				getNextSignal()
			}, (process.env.PAUSE_SECONDS||120)*1000)
			return;
		}
		let price = data[0]
		let scraperData = data[1]

		// copy the last run object so we can reference it
		// merge it on top of a copy of the tickerSchema to ensure the base values are present
		let previousLog = merge(cloneDeep(config.tickerSchema), cloneDeep(results.tickers[ticker])) 

		results.tickers[ticker] = cloneDeep(previousLog)
		// short var ref
		let tickerResults = results.tickers[ticker]
		// set the new result time to the previous time so we can deep compare the new data to old
		// later in order to do a quick match and see if nothing changed
		tickerResults.price = price
		tickerResults.change = !previousLog.price ? 0 : Number((price - previousLog.price) / previousLog.price).toFixed(4)

		// console.log('tickerResults', ticker, tickerResults)
		// log(scraperData)
		// console.log(`process closed! exited with code: ${code}`)
		let timestamp = now()
		let testTime = (timestamp - results.time) / 1000
		let error = false
		let errorLine = ''

		// update results with this ticker and runtime
		results.time = timestamp
		results.last = ticker

		const formatTechnicals = function(l, index){
			var technicals = {}
			try{
				technicals = JSON.parse(l.split(': ')[1])
			}catch(e){
				console.error('json parse error', e.message)
			}
			for(var i=0;i<technicals.titles.length;i++){
				// for now, we are only concerned with Summary,
				// we are scraping and saving the Oscillators and Moving Averages
				// (in case we want to use the underlying reasons for the Summary later)
				if(technicals.titles[i]==='Summary') {
					let newValue = config.maps.numeric[technicals.values[i]]
					let prevValue = previousLog.sum[index]
					let prevPrev = previousLog.prev[index] // the forwarded previous value
					if( isUndefined(newValue) || isNull(newValue)) {
						console.error('error getting technical signal', ticker, technicals)
						// don't accept it
						newValue = prevValue
					}
					tickerResults.sum[index] = newValue
					tickerResults.prev[index] = newValue===prevValue ? prevPrev : prevValue
				}
			}
			// oscillators
			push_signals(technicals.osc, tickerResults.osc[index])
			// moving averages
			push_signals(technicals.ma, tickerResults.ma[index])
			// console.log('edited',tickerResults.ma)
		}
		// split into lines
		scraperData.split('\n').forEach(function (l) {
			if (l.includes('uncaughtError:') || l.includes('uncaughtException:')) {
				error = true
				errorLine = l
			}
			if (l.includes('data-technicals_4hours:')) {
				formatTechnicals(l, 0)
			}
			if (l.includes('data-technicals_1day:')) {
				formatTechnicals(l, 1)
			}
			if (l.includes('data-technicals_1week:')) {
				formatTechnicals(l, 2)
			}
			if (l.includes('data-technicals_1month:')) {
				formatTechnicals(l, 3)
			}
		})

		if (error) {
			log(scraperData)
			console.error('☠ ', ticker, testTime, 'seconds', errorLine)
			setTimeout(function () {
				getNextSignal()
			}, (process.env.PAUSE_SECONDS||120)*1000)
		}else{
			// console.log(tickerResults)
			// create aggregate signal for 4 hour/1 day/1 week/1 month
			tickerResults.meta = Math.round(mean(tickerResults.sum))
			tickerResults.from = Math.round(mean(tickerResults.prev))
			// if the tickerResults is the same as the previousLog,
			// don't save it to the rolling db (nothing new)
			var changed = false
			if(!isEqual(tickerResults, previousLog)){
				tickerResults.time = timestamp
				changed = true
			}
			// console.log(JSON.stringify(tickerResults))
			// console.log(JSON.stringify(previousLog))
			// console.log(isEqual(tickerResults, previousLog), changed)
			// save the data to disk
			fs.writeFile('./data/latest.json', JSON.stringify(results, null, 2), function (err) {
				if (err) return console.log(err)
				// console.log(tickerResults.signal, tickerResults.from)
				// update myjson remote backup cache
				fs.createReadStream('./data/latest.json').pipe(request.put(process.env.JSON_CACHE))

				// log it to the console
				stdout(ticker, tickerResults, changed)
				// write to the rolling db log file (for python parsing and back-testing)
				try{
					const previousLogState = ticker+','+
						previousLog.price+','+
						previousLog.change+','+
						tickerResults.time+','+
						previousLog.meta+','+
						previousLog.from+','+
						previousLog.sum.join(',')+','+
						previousLog.prev.join(',')+','+
						previousLog.osc.map(x=>x.map(y=>y[y.length-1])).join(',')+','+
						previousLog.ma.map(x=>x.map(y=>y[y.length-1])).join(',')
					const currentLog = ticker+','+
						tickerResults.price+','+
						tickerResults.change+','+
						tickerResults.time+','+
						tickerResults.meta+','+
						tickerResults.from+','+
						tickerResults.sum.join(',')+','+
						tickerResults.prev.join(',')+','+
						tickerResults.osc.map(x=>x.map(y=>y[y.length-1])).join(',')+','+
						tickerResults.ma.map(x=>x.map(y=>y[y.length-1])).join(',')

					if(previousLogState!==currentLog){
						rollingLog(currentLog)
					}
				}catch(e){
					console.log(e.message);
					console.log(previousLog.osc)
				}
				// log(scraperData)

				// console.log(data)
				setTimeout(function () {
					getNextSignal()
				}, (process.env.PAUSE_SECONDS||120)*1000)
			})
		}
	})
}

function getNextSignal() {
	runner.data.i++
	if (runner.data.i === config.tickers.length) {
		runner.data.i = 0
	}
	getSignal()
}