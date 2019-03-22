// NOTE: this file is ingested by phantomjs, NOT Node.js itself!
// ** Phantom doesn't understand es6 code features
// runs with casperjs
// phantom system module: http://phantomjs.org/api/system/
const envVars = require('system').env
const config = require('../config')
const snapshot = require('./snapshot')
const logData = require('./log/data')
const logRemote = require('./log/remote')
// const x = require('casper').selectXPath;

casper.userAgent(config.userAgent);
casper.options.waitTimeout = (Number(envVars.ABORT_SECONDS||0) || 10)*1000
casper.options.viewportSize = {width: 3200, height: 2048}
casper.options.verbose = true
casper.options.logLevel = "debug"
phantom.page.viewportSize = casper.options.viewportSize
const ticker = envVars.TICKER
const pause = (Number(envVars.PAUSE_SECONDS||0) || 20)*1000
console.log('getting ticker:', ticker, ' with ABORT_SECONDS:', casper.options.waitTimeout/1000)

// phantom.clearCookies();
casper.test.begin('getting '+ticker, function (test) {
	casper.on('error', function(msg,backtrace) {
		this.echo(msg, backtrace)
		snapshot(ticker);
	});
	casper.on("page.error", function(msg, trace) {
		this.echo("Error: " + msg, trace);
	});
	casper.on('resource.received', function(resource) {
		var status = resource.status;
		if(status >= 400) {
			casper.log('Resource ' + resource.url + ' failed to load (' + status + ')', 'error');
	
			resourceErrors.push({
				url: resource.url,
				status: resource.status
			});
		}else{
			this.echo('Resouce load: '+ resource.url);
		}
	});
	casper.on("resource.error", function(resourceError) {
		this.echo("Resource error: " + "Error code: "+resourceError.errorCode+" ErrorString: "+resourceError.errorString+" url: "+resourceError.url+" id: "+resourceError.id, "ERROR");
	});
	// console.log('url: ', url)
	// log messages from browser console when running locally for debugging
	logRemote((envVars.LOG_REMOTE) ? true : false)
	var url = 'https://www.tradingview.com/symbols/'+ticker+'/technicals/'
	casper.start(url, function () {
		// casper.viewport(3200, 2048);
		casper.echo('loaded: '+ url);
	})
	casper.then(function(){
		casper.wait(pause);
		// var js = this.evaluate(function() {
		// 	return document; 
		// });	
		// this.echo(js.all[0].outerHTML); 
		var currentURL = this.getCurrentUrl()
		// casper.echo('testing cached url: ' + cache.url + 'Loaded as: ' + this.getCurrentUrl())
		if (currentURL !== url) {
			logData('redirect', currentURL)
			casper.test.assertEquals(currentURL, url, 'url redirect: '+currentURL+' == '+url)
		}
	})
	casper.then(function(){
		casper.thenClick('a.tv-tabs__tab:nth-child(1)');
		casper.wait(pause);
		// var js = this.evaluate(function() {
		// 	return document; 
		// });	
		// this.echo(js.all[0].outerHTML); 
		var currentURL = this.getCurrentUrl()
		// casper.echo('testing cached url: ' + cache.url + 'Loaded as: ' + this.getCurrentUrl())
		if (currentURL !== url) {
			logData('redirect', currentURL)
			casper.test.assertEquals(currentURL, url, 'url redirect: '+currentURL+' == '+url)
		}

		casper.thenClick('[class^="dropdownIcon-"]')
	})
	casper.then(function(){
		casper.waitFor(function(){
			return this.evaluate(function() {
				return document.querySelectorAll('[class^="speedometerSignal"]').length
			})
		}, function then(){
			casper.echo('page ready')
		}, function onTimeout(){
			snapshot(ticker);
			casper.test.assert(false, "could not find signals")
			snapshot(ticker)
		})
	})
	casper.then(function(){
		casper.waitFor(function(){
			return this.evaluate(function() {
				return document.querySelectorAll(
					'[class^="speedometersContainer-"] > [class^="speedometerWrapper-"] [class^="speedometerTitle-"]'
				).length
			})
		}, function then(){
			casper.echo('speed found')
		}, function onTimeout(){
			casper.test.assert(false, "could not find speedometers")
			snapshot(ticker)
		})
	})
	var getSignalValues = function () {
		// the 3 speedometers
		var dataObj = {
			titles: [],
			values: [],
			ma: [],
			osc: []
		};
		var numeric= {
			'Strong Buy': 2,
			'Buy': 1,
			'Neutral': 0,
			'Sell': -1,
			'Strong Sell': -2
		};
		// get the 3 titles:
		var elements = document.querySelectorAll(
			'[class^="speedometersContainer-"] > [class^="speedometerWrapper-"] [class^="speedometerTitle-"]'
		);
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
		// get the current oscillator values
		var oscIndexes = [
			2, // Relative Strength Index (14)
			9, // Stochastic RSI Fast (3, 3, 14, 14)
			3, // Stochastic %K (14, 3, 3)
			12, // Ultimate Oscillator (7, 14, 28)
			8, // MACD Level (12, 27)
			4 // Commodity Channel Index (20)
		];
		var val;
		for(var i=0;i<oscIndexes.length;i++){
			val = document.querySelector(
				'#technicals-root > div > div > div:nth-child(3) > table:first-child > tbody > tr:nth-child('+oscIndexes[i]+') > td:nth-child('+(oscIndexes[i]===8?3:2)+')'
			).innerHTML
			// for MACD, grab the verbal indicator and make numeric (Buy=1, Sell=-1)
			dataObj.osc.push(oscIndexes[i] === 8 ? numeric[val] : Number(val));
		}
		// get the current Moving Average values
		var maIndexes = [
			16 // Hull Moving Average (9)
		];
		for(var i=0;i<maIndexes.length;i++){
			val = document.querySelector(
				'#technicals-root > div > div > div:nth-child(3) > table:last-child > tbody > tr:nth-child('+maIndexes[i]+') > td:nth-child(3)'
			).innerHTML
			dataObj.ma.push(numeric[val]);
		}
		
		return JSON.stringify(dataObj);
	}
	casper.then(function () {
		// get ticker price
		var tickerPrice = casper.evaluate(function(){
			return document.querySelector('.tv-symbol-header-quote__value').innerText
		})
		logData('tickerPrice', tickerPrice)
	})
	casper.then(function(){
		// find the values of the 3 segments for 1 Day candles
		var technicals = casper.evaluate(getSignalValues)
		logData('technicals_1day', technicals)
	})
	// 1 hour candles
	casper.thenClick('[class^="dropdownIcon-"]')
	casper.then(function(){
		casper.wait(500, function() {});
	})
	casper.then(function(){
		var linkText = casper.evaluate(function(){
			return document.querySelector('[class^="list-"] [class^="item-"]:nth-child(4)').innerHTML
		})
		logData('linkText', linkText)
		casper.test.assertEquals(linkText, '1 hour')
	})
	casper.thenClick('[class^="list-"] [class^="item-"]:nth-child(4)')
	casper.then(function(){
		casper.wait(1000, function() {});
	})
	casper.then(function () {
		var technicals = casper.evaluate(getSignalValues)
		logData('technicals_1hour', technicals)
	})
	// 4 hours
	casper.thenClick('[class^="dropdownIcon-"]')
	casper.then(function(){
		casper.wait(500, function() {});
	})
	casper.then(function(){
		var linkText = casper.evaluate(function(){
			return document.querySelector('[class^="list-"] [class^="item-"]:nth-child(5)').innerHTML
		})
		logData('linkText', linkText)
		casper.test.assertEquals(linkText, '4 hours')
	})
	casper.thenClick('[class^="list-"] [class^="item-"]:nth-child(5)')
	casper.then(function(){
		casper.wait(1000, function() {});
	})
	casper.then(function () {
		var technicals = casper.evaluate(getSignalValues)
		logData('technicals_4hours', technicals)
	})
	// 1 week candles
	casper.thenClick('[class^="dropdownIcon-"]')
	casper.then(function(){
		var linkText = casper.evaluate(function(){
			return document.querySelector('[class^="list-"] [class^="item-"]:nth-child(7)').innerHTML
		})
		logData('linkText', linkText)
		casper.test.assertEquals(linkText, '1 week')
	})
	casper.thenClick('[class^="list-"] [class^="item-"]:nth-child(7)')
	casper.then(function(){
		casper.wait(1000, function() {});
	})
	casper.then(function () {
		var technicals = casper.evaluate(getSignalValues)
		logData('technicals_1week', technicals)
	})
	// 1 month candles
	casper.thenClick('[class^="dropdownIcon-"]')
	casper.then(function(){
		var linkText = casper.evaluate(function(){
			return document.querySelector('[class^="list-"] [class^="item-"]:nth-child(8)').innerHTML
		})
		logData('linkText', linkText)
		casper.test.assertEquals(linkText, '1 month')
	})
	casper.thenClick('[class^="list-"] [class^="item-"]:nth-child(8)')
	casper.then(function(){
		casper.wait(1000, function() {});
	})
	casper.then(function () {
		var technicals = casper.evaluate(getSignalValues)
		logData('technicals_1month', technicals)
	})
	// finish
	casper.run(function () {
		test.done()
	})
})