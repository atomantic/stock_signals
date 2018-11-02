const config = require('../config')
const request = require('request')
module.exports = function(cb){
    if(process.env.RELOAD_DISABLED){
        if(cb){
            cb()
        }
        return
    }
    // update the source tickers from github
    console.log('updating source file', process.env.TICKER_SOURCE_FILE)
    request(process.env.TICKER_SOURCE_FILE, function(err, req, body){
        const cleanBody = body.replace('module.exports = ','').replace(/\s/g,'')
        const tickerCount = config.tickers.length
        config.tickers = JSON.parse('{"tickers":'+cleanBody+'}').tickers
        console.log('updated tickers from github:', tickerCount, '=>', config.tickers.length)
        if(cb){
            cb()
        }
    })
}