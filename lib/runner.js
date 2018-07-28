const config = require('../config')
const {	spawn } = require('child_process')
const {	resolve } = require('path')
const log = require('../utils/log')
const {	random, merge } = require('lodash')
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

function getSignal() {
	const ticker = config.tickers[runner.currentIndex]
	const scraper = spawn(
		'casperjs', 
		[
			'test', 
			'--verbose', 
			'--ignore-ssl-errors=true', 
			'--load-images=false', 
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
		const today = new Date()
		const mappedData = {
			date: today.getTime()
		}
		results.lastRun = now
		results.lastTicker = ticker
		// split into lines
		scraperData.split('\n').forEach(function (l) {
			if (l.includes('uncaughtError:') || l.includes('uncaughtException:')) {
				error = true
				errorLine = l
			}
			if (l.includes('data-technicals_1day:')) {
				try{
					const technicals = JSON.parse(l.split(': ')[1])
					
					for(var i=0;i<technicals.titles.length;i++){
						mappedData[technicals.titles[i]] = technicals.values[i]
					}
					if(!results.results[ticker]){
						results.results[ticker] = {
							day: {},
							week: {}
						}
					}
					results.results[ticker].day = mappedData
					// save the data to disk
					fs.writeFile('./data/results.json', JSON.stringify(results, null, 2), function (err) {
						if (err) return console.log(err)
					})
					// update myjson remote backup cache
					fs.createReadStream('./data/results.json').pipe(request.put(process.env.JSON_CACHE))
				}catch(e){
					console.error('json parse error', e.message)
				}
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
		}else{
			log('✅ ', outputPad(ticker, 20), outputPad(mappedData.Summary, 20), ' ⏱️ ', testTime, 'seconds')
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