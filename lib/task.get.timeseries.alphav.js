// https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=MSFT&interval=1min&apikey=demo

const fs = require('fs')
const request = require('request')
const systemKey = (process.env.ALPHA_VANTAGE_API_KEY||'demo')
const baseURI = 'https://www.alphavantage.co/query?datatype=csv&symbol='
const methodParams = {
    // https://www.alphavantage.co/documentation/
    MACD: '&series_type=close',
    RSI: '&time_period=10&series_type=close',
    STOCH: '',
    STOCHRSI: '&interval=daily&series_type=close&time_period=10'
}
/**
 * Fetch and Cache timeseries data for technical indicators.
 * @param {String} ticker The stock ticker (e.g. AAPL)
 * @param {String} method The indicator method (e.g. STOCH)
 * @param {String} interval The time interval (e.g. daily, weekly, monthly)
 * @param {String} key The Alpha Vantage API key
 */
module.exports = function(ticker, method, interval, key){
    return function(cb){
        let apiKey = key||systemKey
        let uri = baseURI+ticker+'&interval='+interval+'&function='+method+(methodParams[method]||'')+'&apikey='+apiKey
        request(uri, function(err, resp, body){
            fs.writeFile('./data/timeseries/'+ticker+'.'+method+'.'+interval+'.csv', body, function(err, data){
                if(err) console.error(err)
                cb(err, body)
            })
        })
    }
}