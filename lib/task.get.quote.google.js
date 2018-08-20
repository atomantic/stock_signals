const cheerio = require('cheerio')
const fs = require('fs')
const request = require('request')
module.exports = function(tickerName){
    return function(cb){
        // https://www.google.com/search?tbm=fin&q=NASDAQ%3A+GOOG&
        // https://www.google.com/search?tbm=fin&q=NYSEARCA%3A+REMX
        request('https://www.google.com/search?tbm=fin&q='+tickerName, function(err, resp, body){
            if(err){
                console.error(err)
                return cb(err)
            }
            const $ = cheerio.load(body)
            let price = $('#knowledge-finance-wholepage__entity-summary .gsrt > span > span > span:first-child').text()
  
            // GOOG and AMZN are over 1,000 (so remove commas)
            price = Number(price.replace(',',''))
            if(isNaN(price) || price===0){
                console.log('https://www.google.com/search?tbm=fin&q='+tickerName, price)
                return cb('price NaN||0')
            }
            cb(null, price)
        })
    }
}