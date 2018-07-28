// NOTE: this file is ingested by phantomjs, NOT Node.js itself!
// ** Phantom doesn't understand es6 code features
// runs with casperjs
// phantom system module: http://phantomjs.org/api/system/
const envVars = require('system').env
const cache = require('./cache')
const config = require('../config')
const snapshot = require('./snapshot')
const logData = require('../utils/log.data')
const logRemote = require('../utils/log.remote')

casper.userAgent(config.userAgent);
casper.options.waitTimeout = envVars.WAITTIME || 10000
const ticker = envVars.TICKER
cache.ticker = ticker
console.log('getting ticker:', ticker, ' with WAITTIMEOUT:', casper.options.waitTimeout)

phantom.clearCookies();
casper.test.begin('getting '+ticker, function (test) {
	// console.log('url: ', url)
	// log messages from browser console when running locally for debugging
	logRemote((envVars.LOG_REMOTE) ? true : false)
	var url = 'https://www.tradingview.com/symbols/'+ticker+'/technicals/'
	casper.start(url, function () {
		casper.echo('loaded: '+ url)
		if (!casper.exists('body')) {
			console.warn('No body! Network error? Re-opening url: ' + url)
			casper.thenOpen(url, function () {
				if (casper.status() === 404) {
					logData('404', 'ticker-'+ticker)
					process.exit()
				}
				// the technical visuals have "Strong Sell" + "Strong Buy"
				casper.waitForText('Strong Buy')
			})
		} else {
			casper.viewport(1024, 768);
			casper.waitForText('Strong Buy')
		}
	})
	casper.then(function(){
		casper.wait(5000, function() {});
	})
	casper.then(function () {
		// default assert since we are using a testing framework for the scraping :)
		casper.test.assert(true)
		// find the values of the 3 segments
		var technicals = casper.evaluate(function () {
			// the 3 speedometers
			var dataObj = {
				titles: [],
				values: []
			}
			// get the 3 titles:
			var elements = document.querySelectorAll(
				'[class^="speedometersContainer-"] > [class^="speedometerWrapper-"] [class^="speedometerTitle-"]'
			)
			Array.prototype.forEach.call(elements, function(el, i){
				dataObj.titles.push(el.innerHTML);
			});
			// get the 3 values:
			var elements = document.querySelectorAll(
				'[class^="speedometersContainer-"] > [class^="speedometerWrapper-"] [class^="speedometerSignal-"]'
			)
			Array.prototype.forEach.call(elements, function(el, i){
				dataObj.values.push(el.innerHTML);
			});
			return JSON.stringify(dataObj);
		})
		logData('technicals_1day', technicals)
	})
	// finish
	casper.run(function () {
		snapshot()
		test.done()
	})
})