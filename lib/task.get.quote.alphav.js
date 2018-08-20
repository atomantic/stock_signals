// https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=MSFT&interval=1min&apikey=demo

const fs = require('fs')
const request = require('request')
module.exports = function(tickerName){
    return function(cb){
        request('https://www.alphavantage.co/query?datatype=csv&function=TIME_SERIES_INTRADAY&symbol='+tickerName+'&interval=1min&apikey='+(process.env.ALPHA_VANTAGE_API_KEY||'demo'), function(err, resp, body){
            // get the price from the latest close
            // Note that this isn't actually a real-time price indicator
            let price = Number(body.split('\n')[1].split(' ')[1].split(',')[4])
            if(isNaN(price) || price===0){
                console.log(tickerName, price)
                return cb('price NaN||0')
            }
            cb(null, price)
        })
    }
}