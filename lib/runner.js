const config = require('../config')
const {	spawn } = require('child_process')
const {	resolve } = require('path')
const log = require('../utils/log')
const {	random, merge, each } = require('lodash')
const outputPad = require('../utils/outputPad')
const fs = require('fs')
const results = require('../data/results')
const request = require('request')
const runner = {
	lastFinish: new Date().getTime(),
	currentIndex: random(0, config.tickers.length - 1),
	run: getNextSignal
}
module.exports = runner

const iconMap = {
	'Buy': '💸',
	'Strong Buy': '🏦',	
	'Neutral': '😐',
	'Sell': '💰',
	'Strong Sell': '🤑',
}
const stateValues = {
	'Strong Buy': 2,
	'Buy': 1,
	'Neutral': 0,
	'Sell': -1,
	'Strong Sell': -2
}
const reverseValueMap = {
	'-2': 'Strong Sell',
	'-1': 'Sell',
	'0': 'Neutral',
	'1': 'Buy',
	'2': 'Strong Buy'
}
console.log('Icon Legend:')
var iconHelp = ''
each(iconMap, (k,v) => iconHelp+=outputPad(k+': '+v, 18))
console.log(iconHelp)

function getSignal() {
	const ticker = config.tickers[runner.currentIndex]
	const scraper = spawn(
		'casperjs', 
		[
			'test', 
			'--verbose', 
			'--ignore-ssl-errors=true', 
			'--load-images=true', 
			resolve(__dirname, './technicals.js')
		],{
		env: merge({}, process.env, {
			TICKER: ticker
		})
	})

	scraper.stdout.setEncoding('utf8')

	scraper.on('error', function (err) {
		console.log(`Failed to spawn child process! ${err}`)
	})

	let scraperData = ''

	scraper.stdout.on('data', function (data) {
		// console.log(`data received: ${data}`)
		scraperData += data
	})

	scraper.stderr.on('data', function (data) {
		console.log(`stderr: ${data}`)
	})

	scraper.on('close', function (code) {
		// console.log(`process closed! exited with code: ${code}`)
		let now = new Date().getTime()
		let testTime = (now - runner.lastFinish) / 1000
		runner.lastFinish = now
		let error = false
		let errorLine = ''
		results.lastRun = now
		results.lastTicker = ticker
		if(!results.results[ticker]){
			results.results[ticker] = {
				day: {},
				hours: {},
				week: {}
			}
		}
		// short var ref
		var tickerResults = results.results[ticker]
		const formatTechnicals = function(l, period){
			try{
				const technicals = JSON.parse(l.split(': ')[1])
				const mappedData = {
				}
				for(var i=0;i<technicals.titles.length;i++){
					mappedData[technicals.titles[i]] = technicals.values[i]
				}
				
				tickerResults.updated = now;
				tickerResults[period] = mappedData
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
			if (l.includes('data-technicals_1day:')) {
				formatTechnicals(l, 'day')
			}
			if (l.includes('data-technicals_1week:')) {
				formatTechnicals(l, 'week')
			}
			if (l.includes('data-technicals_4hours:')) {
				formatTechnicals(l, 'hours')
			}
		})
		if (error) {
			tickerParts = ticker.split('-')
			// learn:
			// try changing it for next run:
			if(tickerParts[0]==='NASDAQ'){
				tickerParts[0] = 'AMEX'
			}else{
				tickerParts[0] = 'NYSE'
			}
			config.tickers[runner.currentIndex] = tickerParts.join('-')
			console.error('☠ ', ticker, testTime, 'seconds')
			log(scraperData)
		}else{
			// create aggregate signal for 4 hour/1 day/1 week
			var totalSummary = (stateValues[tickerResults.hours.Summary] + 
				stateValues[tickerResults.day.Summary] +
				stateValues[tickerResults.week.Summary]) / 3
			// console.log('totalSummary', totalSummary, Math.round(totalSummary))
			tickerResults.signal = reverseValueMap[Math.round(totalSummary)]
			// save the data to disk
			fs.writeFile('./data/results.json', JSON.stringify(results, null, 2), function (err) {
				if (err) return console.log(err)
			})
			// update myjson remote backup cache
			fs.createReadStream('./data/results.json').pipe(request.put(process.env.JSON_CACHE))
			log(
				'4H:'+iconMap[tickerResults.hours.Summary] +
				' D:'+iconMap[tickerResults.day.Summary] +
				' W:'+ iconMap[tickerResults.week.Summary] + ' ', 
				outputPad(ticker, 15), 
				tickerResults.signal
			)
			// log(scraperData)
		}
		setTimeout(function () {
			getNextSignal()
		}, (process.env.PAUSE_SECONDS||120)*1000)
	})
}

function getNextSignal() {
	runner.currentIndex++
	if (runner.currentIndex === config.tickers.length) {
		runner.currentIndex = 0
	}
	getSignal()
}