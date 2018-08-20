const cheerio = require('cheerio')
const fs = require('fs')
const request = require('request')
module.exports = function(tickerName){
    return function(cb){
        request('https://finance.yahoo.com/quote/'+tickerName, function(err, resp, body){
            const $ = cheerio.load(body)
            let el = $('#quote-header-info > div:last-child > div:first-child > div > span:first-child')
            // let el = $('span[data-reactid="35"]')
            let price = Number(el.text().replace(',','')) // GOOG and AMZN are over 1,000
            if(isNaN(price) || price===0){
                fs.writeFile('./data/error-'+tickerName+'.html', body, function(err, data){
                    if(err) console.error(err)
                })
                console.log('https://finance.yahoo.com/quote/'+tickerName, price, el.innerHTML)
                return cb('price NaN||0')
            }
            cb(null, price)
        })
    }
}