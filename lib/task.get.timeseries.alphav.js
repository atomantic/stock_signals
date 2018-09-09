// https://www.alphavantage.co/query?function=RSI&symbol=MSFT&interval=daily&apikey=demo
// https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=MSFT&apikey=demo

const fs = require('fs')
const request = require('request')
const systemKey = (process.env.ALPHA_VANTAGE_API_KEY||'demo')
const baseURI = 'https://www.alphavantage.co/query?datatype=csv&symbol='
const methodParams = {
    // https://www.alphavantage.co/documentation/
    MACD: '&series_type=close',
    RSI: '&time_period=14&series_type=close',
    STOCH: '',
    STOCHRSI: '&interval=daily&series_type=close&time_period=14'
}
const series = require('async.series')
/**
 * Fetch and Cache timeseries data for technical indicators.
 * @param {String} ticker The stock ticker (e.g. AAPL)
 * @param {String} method The indicator method (e.g. STOCH)
 * @param {String} interval The time interval (e.g. daily, weekly, monthly)
 * @param {String} key The Alpha Vantage API key
 */
module.exports = function(ticker, method, interval, key){
    return function(callback){
        let apiKey = key||systemKey
        let uri = baseURI+ticker+'&apikey='+apiKey+'&function='
        series([
            function(cb){
                request(uri+method+(methodParams[method]||'')+'&interval='+interval, function(err, resp, body){
                    if(err){
                        return cb(err, body)
                    }
                    if(body.information){
                        // fail
                        err = 'API error (rate limited)'
                        console.log(err)
                        return cb(err, body)
                    }
                    body = body.replace(/\r\n/g, '\n')
                    fs.writeFile('./data/timeseries/'+ticker+'.'+interval+'.'+method+'.csv', body, function(err, data){
                        if(err) console.error(err)
                        cb(err, body)
                    })
                })
            },
            function(cb){
                setTimeout(function(){
                    request(uri+'TIME_SERIES_'+interval.toUpperCase()+'&outputsize=full', function(err, resp, body){
                        if(err){
                            return cb(err, body)
                        }
                        if(body.information){
                            // fail
                            err = 'API error (rate limited)'
                            console.log(err)
                            return cb(err, body)
                        }
                        body = body.replace(/\r\n/g, '\n')
                        fs.writeFile('./data/timeseries/'+ticker+'.'+interval+'.price.csv', body, function(err, data){
                            if(err) console.error(err)
                            cb(err, body)
                        })
                    })
                }, 10000)
            }
        ], callback)
        
    }
}