//https://www.google.com/search?tbm=fin&q=NASDAQ%3A+GOOG&oq=GOOG
const cheerio = require('cheerio')
const fs = require('fs')
const request = require('request')
module.exports = function(tickerName){
    return function(cb){
        request('https://finance.yahoo.com/quote/'+tickerName, function(err, resp, body){
            const $ = cheerio.load(body)
            let price = $('#quote-header-info > div:last-child > div:first-child > div > span:first-child').text()
            let ask = $('#quote-summary > div:first-child > table span[data-reactid="56"]').text().split(' ')[0]
            let open = $('#quote-summary > div:first-child > table span[data-reactid="46"]').text()
                    
            // GOOG and AMZN are over 1,000 (so remove commas)
            price = Number(price.replace(',',''))
            if(isNaN(price) || price===0){
                console.log('https://finance.yahoo.com/quote/'+tickerName, price)
                return cb('price NaN||0')
            }
            cb(null, price)
        })
    }
}