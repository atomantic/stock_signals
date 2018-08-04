
const config = require('../config')
const {	random } = require('lodash')
module.exports = {
	currentIndex: random(0, config.tickers.length - 1)
}