'use strict'
const Hapi = require('hapi')
const path = require('path')
const pjson = require('./package')
const runner = require('./lib/runner')
const log = require('./utils/log')
const routes = require('./routes')
const request = require('request')
const results = require('./data/results')
// Create a server with a host and port
const server = new Hapi.Server({
	port: 8808
})
require('./lib/process')(server)

// check to see if the remote cache has a newer copy than our static results.json
// I may have run this in a shorter wait period, more recently on my machine
// or the remote server may have been killed and restarted
// in which case, we want to start with the more up-to-date cache file
request(process.env.JSON_CACHE, function(req, err, data){
	if(err){
		throw(err)
	}
	if(data.lastRun > results.lastRun){
		log('remote cache is newer, using it')
		results = data
	}
	// Register the plugin with custom config
	server.register([{
		plugin: require('hapi-and-healthy'),
		options: {
			custom: {
				lastFinish: runner.lastFinish,
				abort_seconds: process.env.ABORT_SECONDS,
				pause_seconds: process.env.PAUSE_SECONDS,
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
