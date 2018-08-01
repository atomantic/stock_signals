'use strict'
const config = require('./config')
const Hapi = require('hapi')
const path = require('path')
const log = require('./utils/log')
const pjson = require('./package')
const request = require('request')
const routes = require('./routes')
const runner = require('./lib/runner')
var results = require('./data/results')
// Create a server with a host and port
const server = new Hapi.Server({
	port: 8808
})
require('./lib/process')(server)

// check to see if the remote cache has a newer copy than our static results.json
// I may have run this in a shorter wait period, more recently on my machine
// or the remote server may have been killed and restarted
// in which case, we want to start with the more up-to-date cache file
request(process.env.JSON_CACHE, function(err, response, body){
	if(err){
		throw(err)
	}
	try{
		var remoteCache = JSON.parse(body)
	}catch(e){
		throw e.message
	}
	log('remote lastRun:', remoteCache.lastRun)
	log(' local lastRun:', results.lastRun)
	if(remoteCache.lastRun > results.lastRun){
		log('remote cache is newer, using it')
		results = remoteCache
	}
	// get the latest ticker set from github
	// (we may have updated it and then the now.sh container was killed and restarted)
	request(process.env.TICKER_SOURCE_FILE, function(req, err, body){
		var cleanBody = body.replace('module.exports = ','').replace(/\s/g,'')
		var tickerCount = config.tickers.length
		config.tickers = JSON.parse('{"tickers":'+cleanBody+'}').tickers
		console.log('updated tickers from github:', tickerCount, '=>', config.tickers.length)
		// Register the plugin with custom config
		server.register([{
			plugin: require('hapi-and-healthy'),
			options: {
				usage: false,
				custom: {
					lastFinish: runner.lastFinish,
					abort_seconds: process.env.ABORT_SECONDS,
					pause_seconds: process.env.PAUSE_SECONDS,
					lastTicker: results.lasstTicker,
					lastFinishSeconds: (new Date().getTime() - runner.lastFinish) / 1000
				},
				env: process.env.APP_ENV,
				name: pjson.name,
				version: pjson.version,
				path: '/'
			}
		}])
		.then(() => routes.forEach(route => server.route(route)))
		.then(() => server.start())
		.then(() => log('Server running at:', server.info.uri ))
		.then(() => runner.run() )
		.catch(err => {
			console.error(`Error starting server: ${err}`)
		})
	})
})
