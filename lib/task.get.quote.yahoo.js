const cheerio = require('cheerio')
const fs = require('fs')
const request = require('request')
const google = require('./task.get.quote.google')
module.exports = function(tickerName){
    return function(cb){
        request('https://finance.yahoo.com/quote/'+tickerName, function(err, resp, body){
            if(err){
                console.error(err)
                return cb(err)
            }
            const $ = cheerio.load(body)
            let price = $('#quote-header-info > div:last-child > div:first-child > div > span:first-child').text()
            let ask = $('#quote-summary > div:first-child > table span[data-reactid="56"]').text().split(' ')[0]
            let open = $('#quote-summary > div:first-child > table span[data-reactid="46"]').text()
                    
            // GOOG and AMZN are over 1,000 (so remove commas)
            price = Number(price.replace(',',''))
            if(isNaN(price) || price===0){
                
                fs.writeFile('./data/error-'+tickerName+'.html', body, function(err, data){
                    if(err) console.error(err)
                    // back up strategy:
                    // try google (google requires translation of some markets (e.g. AMEX into NYSEARCA):
                    // so only using it for now as a backup to the simpler yahoo interface
                    google(tickerName)(function(){
                        price = Number(ask.replace(',',''))
                        if(isNaN(price) || price===0){
                            // double back up strategy (open price):
                            price = Number(open.replace(',',''))
                            if(isNaN(price) || price===0){
                                console.log(tickerName, price)
                                return cb('price NaN||0')
                            }
                        }
                        cb(null, price)
                    })
                    
                })
            }else{
                cb(null, price)
            }
        })
    }
}