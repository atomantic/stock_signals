const cheerio = require('cheerio')
const fs = require('fs')
const request = require('request')
module.exports = function(buy, sell){
    return function(cb){
        const url = 'https://min-api.cryptocompare.com/data/price?fsym='+buy+'&tsyms='+sell
        // console.log(url)
        request(url, function(err, resp, body){
            if(err){
                console.error(err)
                return cb(err)
            }
            let price = body[sell]
            if(typeof body === 'string'){
                try{
                    var json = JSON.parse(body)
                    price = json[sell]
                }catch(e){
                    cb(e.message)
                }
            }
            cb(null, price)
        })
    }
}
