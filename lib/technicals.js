// NOTE: this file is ingested by phantomjs, NOT Node.js itself!
// ** Phantom doesn't understand es6 code features
// runs with casperjs
// phantom system module: http://phantomjs.org/api/system/
const envVars = require('system').env
const config = require('../config')
const snapshot = require('./snapshot')
const logData = require('../utils/log.data')
const logRemote = require('../utils/log.remote')
// const x = require('casper').selectXPath;

casper.userAgent(config.userAgent);
casper.options.waitTimeout = (envVars.ABORT_SECONDS || 10)*1000
casper.options.viewportSize = {width: 1024, height: 768}
// phantom.page.viewportSize = casper.options.viewportSize
const ticker = envVars.TICKER
console.log('getting ticker:', ticker, ' with ABORT_SECONDS:', casper.options.waitTimeout)

phantom.clearCookies();
casper.test.begin('getting '+ticker, function (test) {
	// console.log('url: ', url)
	// log messages from browser console when running locally for debugging
	logRemote((envVars.LOG_REMOTE) ? true : false)
	var url = 'https://www.tradingview.com/symbols/'+ticker+'/technicals/'
	casper.start(url, function () {
		// casper.viewport(6400, 768);

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
			casper.waitForText('Strong Buy')
		}
	})
	casper.then(function(){
		casper.wait(5000, function() {});
	})
	var getSignalValues = function () {
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
	}
	casper.then(function () {
		snapshot()
		// find the values of the 3 segments
		var technicals = casper.evaluate(getSignalValues)
		logData('technicals_1day', technicals)
	})
	// document.querySelectorAll('[class^="technicalsTab-"] [class^="itemsWrap-"] [class^="item-"]:nth-last-child(2)')
	casper.thenClick('[class^="dropdownIcon-"]')
	casper.then(function(){
		var weekLinkText = casper.evaluate(function(){
			return document.querySelector('[class^="list-"] [class^="item-"]:nth-child(7)').innerHTML
		})
		logData('weekLink', weekLinkText)
		casper.test.assertEquals(weekLinkText, '1 week')
	})
	casper.thenClick('[class^="list-"] [class^="item-"]:nth-child(7)')
	casper.then(function(){
		casper.wait(1000, function() {});
	})
	casper.then(function () {
		// get the Week view
		// find the values of the 3 segments
		var technicals = casper.evaluate(getSignalValues)
		logData('technicals_1week', technicals)
	})
	casper.thenClick('[class^="dropdownIcon-"]')
	casper.then(function(){
		var weekLinkText = casper.evaluate(function(){
			return document.querySelector('[class^="list-"] [class^="item-"]:nth-child(5)').innerHTML
		})
		logData('weekLink', weekLinkText)
		casper.test.assertEquals(weekLinkText, '4 hours')
	})
	casper.thenClick('[class^="list-"] [class^="item-"]:nth-child(5)')
	casper.then(function(){
		casper.wait(1000, function() {});
	})
	casper.then(function () {
		var technicals = casper.evaluate(getSignalValues)
		logData('technicals_4hours', technicals)
	})
	// finish
	casper.run(function () {
		snapshot()
		test.done()
	})
})