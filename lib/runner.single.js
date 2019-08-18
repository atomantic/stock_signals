/**
 * fetches historical (alphavantage) data, price, dividend, etc
 **/
const config = require('../config')
const {	cloneDeep, isEqual, isUndefined, mean, merge, now } = require('lodash')
const getTimeseriesParams = require('./get.timeseries.params')
const parallel = require('async.parallel')
const results = require('../data/latest')
const rollingLog = require('./log/rolling')
const runnerData = require('./runner.data')
const save = require('./save')
const stdout = require('./log/stdout.ticker')
const taskGetCryptoQuote = require('./task.get.quote.crypto')
// const taskGetDividend = require('./task.get.dividend.next')
const taskGetQuote = require('./task.get.quote.yahoo')
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

	if(ticker.indexOf('crypto:')!==-1){
		// need to split BTC/USD or things like LTCBTC into LTC/BTC
		// (split in config to support arbitrary name sizes)
		tasks.push(taskGetCryptoQuote(tickerSplit[0], tickerSplit[1]))
	}else{
		tasks.push(taskGetQuote(tickerName))
		// tasks.push(taskGetDividend(tickerName))
		if(!runner.timeseriesThrottled && !afterHours){
			const timeseriesParams = getTimeseriesParams(ticker)
			tasks.push(taskGetTimeseries(tickerName, timeseriesParams.method, timeseriesParams.interval))
		}else{
			console.log('skip timeseries', runner.timeseriesThrottled, afterHours)
		}
	}
	parallel(tasks, function(err, data){
		if(err){
			console.error(err, data)
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

		if(typeof data[0] === 'object'){
			tickerResults.price = data[0].price
			if(data[0].nextDiv && data[0].nextDiv!=='N/A') tickerResults.nextDiv = data[0].nextDiv
			if(data[0].nextEarn && data[0].nextEarn!=='N/A' && !data[0].nextEarn.includes('-')){
				tickerResults.nextEarn = data[0].nextEarn
			}
		}else{
			tickerResults.price = data[0]
		}
		// tickerResults.change = !previousLog.price ? 0 : Number((price - previousLog.price) / previousLog.price).toFixed(4)

		// console.log('tickerResults', ticker, tickerResults)
		// console.log(`process closed! exited with code: ${code}`)
		let timestamp = now()

		// update results with this ticker and runtime
		results.time = timestamp
		results.last = ticker
		if(!isEqual(tickerResults, previousLog)){
			tickerResults.time = timestamp
		}
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
				previousLog.divergence.join(',')+','+
				previousLog.nextDiv+','+
				previousLog.nextEarn
			const currentLog = ticker+','+
				tickerResults.price+','+
				tickerResults.time+','+
				tickerResults.meta+','+
				tickerResults.from+','+
				tickerResults.sum.join(',')+','+
				tickerResults.prev.join(',')+','+
				tickerResults.osc.map(x=>x.map(y=>y[y.length-1])).join(',')+','+
				tickerResults.ma.map(x=>x.map(y=>y[y.length-1])).join(',')+','+
				tickerResults.divergence.join(',')+','+
				tickerResults.nextDiv+','+
				tickerResults.nextEarn

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
	})
}