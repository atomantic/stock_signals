
const _ = require('lodash')
const request = require('request')
const getColumns = require('./get.signal.columns')
const config = require('../config')
// request.debug = true
require('request-to-curl')

const skip = require('../config/skip')
const tickers = require('../config/tickers')
const activeTickers = _.difference(tickers, skip).map(t=>t.replace('-', ':'))

// const activeTickers = ['NYSE:TLRD']
// console.log('getting activeTickers', activeTickers)
module.exports = function (period=false, cb) {
    console.log('fetching all signals for period:', period||'1D')
    const requestConfig = {
        method: 'POST',
        uri: 'https://scanner.tradingview.com/america/scan',
        headers: {
            'Referer': 'https://www.tradingview.com/',
            'Origin': 'https://www.tradingview.com',
            'User-Agent': config.userAgent,
            'content-type': 'application/x-www-form-urlencoded'
        },
        json: { 
            "symbols":{ 
                "tickers": activeTickers, 
                "query": { 
                    "types": [] 
                } 
            }, 
            "columns": getColumns(period)
        }
    }
    request(requestConfig, function (err, resp, body) {
        console.log(resp.request.req.toCurl());
        if (err) {
            console.error(err, body)
            return cb(err)
        }
        console.log(body)
        const data = body.data.map(result => {
            console.log({result})
            const columnBase = getColumns()
            const resultData = {}
            columnBase.forEach((k, i)=>{
                resultData[k] = result.d[i]
            })
            console.log({resultData})
            return {
                s: result.s,
                d: resultData
            }
        })
        cb(err, data)
    })
}