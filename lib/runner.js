const config = require('../config')
const {	spawn } = require('child_process')
const {	resolve } = require('path')
const log = require('../utils/log')
const rollingLog = require('../utils/log.rolling')
const {	cloneDeep, each, isEqual, mean, merge, now } = require('lodash')
const outputPad = require('../utils/outputPad')
const fs = require('fs')
const results = require('../data/latest')
const request = require('request')
const runnerData = require('./runner.data')
const cheerio = require('cheerio')
const runner = {
	data: runnerData,
	run: getNextSignal
}
module.exports = runner

console.log('Icon Legend:')
var iconHelp = ''
each(config.maps.icons, (k,v) => iconHelp+=outputPad(k+': '+config.maps.reverseValues[v]+' ('+v+')', 18))
console.log(iconHelp)

function getSignal() {
	var changed = true // assume new data (we will do a deep compare later to invalidate this)
	const ticker = config.tickers[runner.data.i]
	const tickerParts = ticker.split('-')
	// const tickerMarket = tickerParts[0]
	const tickerName = tickerParts[1]
	// copy the last run object so we can reference it
	// merge it on top of a copy of the tickerSchema to ensure the base values are present
	let previousLog = merge(cloneDeep(config.tickerSchema), cloneDeep(results.tickers[ticker])) 
	results.tickers[ticker] = cloneDeep(config.tickerSchema)
	// short var ref
	let tickerResults = results.tickers[ticker]
	// set the new result time to the previous time so we can deep compare the new data to old
	// later in order to do a quick match and see if nothing changed
	// we will overwrite this with the current time at the end of the run/check
	tickerResults.time = previousLog.time 
	// This is stupid but TradingView isn't rendering properly in casper/phantomjs, 
	// so there is no price rendered.
	// Instead, we have to hit the yahoo finance API, but the npm plugin (stock-quote) 
	// requires a funky way of specifying the market--so anything on "AMEX-"" (e.g. AMEX-REMX) 
	// needs to be specified with a market extension.
	// however, I can't find the proper extension for REMX... 
	// but I can simply load the yahoo HTML page with "REMX".
	// works:
	// https://finance.yahoo.com/quote/REMX/profile?p=REMX
	// doesn't work
	// https://query1.finance.yahoo.com/v10/finance/quoteSummary/REMXPCX?&modules=financialData
	request('https://finance.yahoo.com/quote/'+tickerName, function(err, resp, body){
		const $ = cheerio.load(body)
		// let el = $('#quote-header-info > div:last-child > div:first-child > div > span:first-child')
		let el = $('span[data-reactid="35"]')
		let price = Number(el.text().replace(',','')) // GOOG and AMZN are over 1,000
		if(isNaN(price) || price===0){
			price = Number(el.innerHTML)
			console.log('https://finance.yahoo.com/quote/'+tickerName, price)
		}
		tickerResults.price = price

		const scraper = spawn(
			'casperjs', 
			[
				'test', 
				'--verbose', 
				'--ignore-ssl-errors=true', 
				'--load-images=false', 
				'--web-security=no',
				resolve(__dirname, './technicals.js')
			],{
			env: merge({}, process.env, {
				ABORT_SECONDS: process.env.ABORT_SECONDS,
				TICKER: ticker
			})
		})

		scraper.stdout.setEncoding('utf8')

		scraper.on('error', function (err) {
			console.log(`Failed to spawn child process! ${err}`)
		})

		let scraperData = ''

		scraper.stdout.on('data', function (data) {
			scraperData += data
		})

		scraper.stderr.on('data', function (data) {
			console.log(`stderr: ${data}`)
		})

		scraper.on('close', function (code) {
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
				try{
					const technicals = JSON.parse(l.split(': ')[1])
					for(var i=0;i<technicals.titles.length;i++){
						// for now, we are only concerned with Summary,
						// we are scraping and saving the Oscillators and Moving Averages
						// (in case we want to use the underlying reasons for the Summary later)
						if(technicals.titles[i]==='Summary'){
							let newValue = config.maps.numeric[technicals.values[i]]
							let prevValue = previousLog.sum[index]
							let prevPrev = previousLog.prev[index] // the forwarded previous value
							tickerResults.sum[index] = newValue
							tickerResults.prev[index] = newValue===prevValue ? prevPrev : prevValue
						}
					}
				}catch(e){
					console.error('json parse error', e.message)
				}
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
			}else{
				// console.log(tickerResults)
				// create aggregate signal for 4 hour/1 day/1 week/1 month
				tickerResults.meta = Math.round(mean(tickerResults.sum))
				tickerResults.from = Math.round(mean(tickerResults.prev))
				// if the tickerResults is the same as the previousLog,
				// don't save it to the rolling db (nothing new)
				if(isEqual(tickerResults, previousLog)){
					changed = false
				}
				// console.log(JSON.stringify(tickerResults))
				// console.log(JSON.stringify(previousLog))
				// console.log(isEqual(tickerResults, previousLog), changed)
				tickerResults.time = timestamp
				// save the data to disk
				fs.writeFile('./data/latest.json', JSON.stringify(results, null, 2), function (err) {
					if (err) return console.log(err)
				})
				// console.log(tickerResults.signal, tickerResults.from)
				// update myjson remote backup cache
				fs.createReadStream('./data/latest.json').pipe(request.put(process.env.JSON_CACHE))
				let movement = Math.round(tickerResults.meta - tickerResults.from)
				log(
					outputPad(ticker, 15),
					tickerResults.price,
					config.maps.changeIcons[movement]||movement,
					'4H:'+config.maps.icons[tickerResults.sum[0]] +
					' D:'+config.maps.icons[tickerResults.sum[1]] +
					' W:'+config.maps.icons[tickerResults.sum[2]] +
					' M:'+ config.maps.icons[tickerResults.sum[3]] + ' ',
					config.maps.reverseValues[tickerResults.meta]
				)
				// write to the rolling db log file (for python parsing and back-testing)
				if(changed){
					rollingLog(
						ticker+','+
						tickerResults.price+','+
						tickerResults.time+','+
						tickerResults.meta+','+
						tickerResults.from+','+
						tickerResults.sum.join(',')+','+
						tickerResults.prev.join(',')
					)
				}
				// log(scraperData)
			}
			setTimeout(function () {
				getNextSignal()
			}, (process.env.PAUSE_SECONDS||120)*1000)
		})
	})
}

function getNextSignal() {
	runner.data.i++
	if (runner.data.i === config.tickers.length) {
		runner.data.i = 0
	}
	getSignal()
}