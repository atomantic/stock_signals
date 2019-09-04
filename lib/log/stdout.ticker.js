const chalk = require('chalk')
const colorize = require('./colorize')
const config = require('../../config')
const log = require('./index')
const outpad = require('./outpad')

const normalize = (num)=>{
    if(num < 0){
        if(num > -0.5) return '-1'
        return '-2'
    }
    if(num > 0){
        if(num < 0.5) return '1'
        return '2'
    }
    return '0'
}
module.exports = function(ticker, results, changed, milliseconds) {
    if(typeof results.sum[1]==='undefined'){
        return console.error('problem detected: ', ticker, results)
    }
    let movement = Math.round(results.meta - results.from)
    let inBTC = ticker.indexOf('crypto:')!==-1 && ticker.substr(ticker.length-3, ticker.length)==='BTC'
    // log(results.sum, normalize(results.sum[0]), colorize(normalize(results.sum[0])))
    log(
        chalk.blue(outpad(ticker, 15)),
        chalk.cyan(outpad((inBTC ? 'B' : '$')+results.price.toFixed(inBTC?8:2), 15, 'left')),
        outpad(Math.round(milliseconds/1000)+'s', 5),
        outpad('H:'+colorize(normalize(results.sum[0]))+' '+
        'D:'+colorize(normalize(results.sum[1]))+' '+
        'W:'+colorize(normalize(results.sum[2]))+' '+
        'M:'+colorize(normalize(results.sum[3])), 64),
        ' '+config.maps.icons[normalize(results.meta)]+' ',
        outpad(config.maps.reverseValues[normalize(results.meta)], 12),
        config.maps.changeIcons[movement]||movement,
        '\tdivergence:', results.divergence.join(','),
        '\tnextDiv:', results.nextDiv||'-',
        '\tdiv_ex:', results.div_ex||'-',
        '\tdiv_rec:', results.div_rec||'-',
        '\tdiv_pay:', results.div_pay||'-',
        '\tnextEarn:', results.nextEarn||'-',
        changed ? '' : '   [unchanged]'
    )
  }
  