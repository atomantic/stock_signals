const config = require('../config')
const {	spawn } = require('child_process')
const {	resolve } = require('path')
const log = require('../utils/log')
const {	each, merge, now } = require('lodash')
const outputPad = require('../utils/outputPad')
const fs = require('fs')
const results = require('../data/results')
const request = require('request')
const runnerData = require('./runner.data')
const runner = {
	data: runnerData,
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
	const ticker = config.tickers[runner.data.currentIndex]
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
		// console.log(`data received: ${data}`)
		scraperData += data
	})

	scraper.stderr.on('data', function (data) {
		console.log(`stderr: ${data}`)
	})

	scraper.on('close', function (code) {
		// log(scraperData)
		// console.log(`process closed! exited with code: ${code}`)
		let timestamp = now()
		let testTime = (timestamp - results.lastRun) / 1000
		let error = false
		let errorLine = ''
		results.lastRun = timestamp
		results.lastTicker = ticker
		results.results[ticker] = {
			day: {},
			hours: {},
			month: {},
			updated: timestamp,
			week: {}
		}
		// short var ref
		var tickerResults = results.results[ticker]
		const formatTechnicals = function(l, period){
			try{
				const technicals = JSON.parse(l.split(': ')[1])
				for(var i=0;i<technicals.titles.length;i++){
					tickerResults[period][technicals.titles[i]] = technicals.values[i]
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
				formatTechnicals(l, 'hours')
			}
			if (l.includes('data-technicals_1day:')) {
				formatTechnicals(l, 'day')
			}
			if (l.includes('data-technicals_1week:')) {
				formatTechnicals(l, 'week')
			}
			if (l.includes('data-technicals_1month:')) {
				formatTechnicals(l, 'month')
			}
		})
		if (error) {
			log(scraperData)
			// disabling this for now as it was creating duplicate records
			// which messed up the full array return in google sheets from mapping
			// to my list (e.g. NYSE-RIO + AMEX-RIO)
			//// learn: try changing it for next run:
			// tickerParts = ticker.split('-')
			// if(tickerParts[0]==='NASDAQ'){
			// 	tickerParts[0] = 'AMEX'
			// }else{
			// 	tickerParts[0] = 'NYSE'
			// }
			// config.tickers[runner.data.currentIndex] = tickerParts.join('-')
			console.error('☠ ', ticker, testTime, 'seconds', errorLine)
		}else{
			// console.log(tickerResults)
			// create aggregate signal for 4 hour/1 day/1 week
			var totalSummary = (
				stateValues[tickerResults.hours.Summary] + 
				stateValues[tickerResults.day.Summary] +
				stateValues[tickerResults.week.Summary] +
				stateValues[tickerResults.month.Summary]
			) / 4
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
				' W:'+iconMap[tickerResults.week.Summary] +
				' M:'+ iconMap[tickerResults.month.Summary] + ' ', 
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
	runner.data.currentIndex++
	if (runner.data.currentIndex === config.tickers.length) {
		runner.data.currentIndex = 0
	}
	getSignal()
}