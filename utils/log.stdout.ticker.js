const chalk = require('chalk')
const colorize = require('./colorize')
const config = require('../config')
const log = require('./log')
const outpad = require('./outpad')
module.exports = function(ticker, results, changed) {
    if(typeof results.sum[1]==='undefined'){
        return console.error('problem detected: ', ticker, results)
    }
    let movement = Math.round(results.meta - results.from)
    let inBTC = ticker.indexOf('crypto:')!==-1 && ticker.substr(ticker.length-3, ticker.length)==='BTC'
    log(
        chalk.blue(outpad(ticker, 15)),
        chalk.cyan(outpad((inBTC ? 'B' : '$')+results.price.toFixed(inBTC?8:2), 15, 'left')),
        outpad('4H:'+colorize(results.sum[0])+' '+
        'D:'+colorize(results.sum[1])+' '+
        'W:'+colorize(results.sum[2])+' '+
        'M:'+colorize(results.sum[3]), 42),
        ' '+config.maps.icons[results.meta]+' ',
        outpad(config.maps.reverseValues[results.meta], 12),
        config.maps.changeIcons[movement]||movement,
        changed ? '' : '   [unchanged]'
    )
  }
  