'use strict'
const config = require('./config')
const Hapi = require('hapi')
const log = require('./utils/log')
const pjson = require('./package')
const request = require('request')
const routes = require('./routes')
const {merge} = require('lodash')
const runner = require('./lib/runner')
var results = require('./data/results')
const reloadTickers = require('./lib/reload.tickers')
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
		var remoteTime = new Date(remoteCache.lastRun).toLocaleString()
		log(`remote cache is newer ${remoteCache.lastTicker} @ ${remoteTime}, using it`)
		var i = config.tickers.indexOf(remoteCache.lastTicker)
		if(i===-1){
			console.log('could not find last run ticker in config; starting random.')
		}else{
			// start here
			runnerData.currentIndex = i
		}
		results = merge(results, remoteCache)
	}
	reloadTickers(function(){
		server.register([{
			plugin: require('hapi-and-healthy'),
			options: {
				usage: false,
				custom: {
					abort_seconds: process.env.ABORT_SECONDS,
					lastRun: results.lastRun,
					lastTicker: results.lastTicker,
					pause_seconds: process.env.PAUSE_SECONDS
				},
				id: pjson.version,
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
