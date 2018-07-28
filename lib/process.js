process.on('uncaughtException', function (err) {
	console.log('uncaughtException', err, err.stack)
	process.exit(1)
})
process.on('unhandledRejection', function (reason, p) {
	console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason)
})

const signals = {
	'SIGINT': 2,
	'SIGTERM': 15
}

async function shutdown(server, signal, value) {
	console.log(signal + '[' + value + '] received, closing server...')
	try {
		await server.stop()
		console.log('exiting process')
		process.exit(128 + value)
	} catch (err) {
		console.log(`Error stopping server: ${err}`)
	}
}

module.exports = function (server) {
	Object.keys(signals).forEach(function (signal) {
		process.on(signal, function () {
			shutdown(server, signal, signals[signal])
		})
	})
}