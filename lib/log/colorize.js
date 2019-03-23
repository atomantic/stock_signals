const config = require('../../config')
const chalk = require('chalk')
module.exports = function(value){
	if(!config.maps.colors[value]){
		return value
	}
	return chalk[config.maps.colors[value]](value)
}