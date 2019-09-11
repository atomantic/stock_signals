
/**
 * uses the tradingview API to fetch a period of technical indicators for all tickers
 */
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
module.exports = function (period, cb) {
    console.log('fetching all signals for period:', period)
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
        if (err) {
            console.error(err, body)
            return cb(err)
        }
        // console.log(body)
        const data = body.data.map(result => {
            // console.log({result})
            const columnBase = getColumns()
            const resultData = {}
            columnBase.forEach((k, i)=>{
                resultData[k] = result.d[i]
            })
            if(!resultData['Recommend.All']===null){
                console.log(resp.request.req.toCurl());
                console.log(result)
            }
            return {
                s: result.s,
                d: resultData
            }
        })
        cb(err, data)
    })
}