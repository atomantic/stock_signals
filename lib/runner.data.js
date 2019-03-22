
const config = require('../config')
const results = require('../data/latest')
module.exports = {
	i: config.tickers.indexOf(results.last),
	period: 0
}