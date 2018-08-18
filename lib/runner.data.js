
const config = require('../config')
const {	random } = require('lodash')
module.exports = {
	i: random(0, config.tickers.length - 1)
}