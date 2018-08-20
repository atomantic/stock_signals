const config = require('../config')
const chalk = require('chalk')
module.exports = function(value){
	if(!config.maps.colors[value]){
		console.log(value, 'not right...')
	}
	return chalk[config.maps.colors[value]](value)
}