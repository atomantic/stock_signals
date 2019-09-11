
const {now} = require('lodash')
const config = require('../config')
const fs = require('fs')
const timeseries = require('../data/timeseries.json')
const paramconfig = {
    default: {
        methods: ['RSI', 'CCI'],
        intervals: config.historic_intervals
    },
    swap: {
        methods: ['RSI','CCI'],
        intervals: ['daily']
    }
}

// each time we run this, we find the next method.interval that hasn't been run in the last day
// then default back to 60min.RSI if they have all been run
module.exports = function(ticker, type){
    type=type||'default'
    const methods = paramconfig[type].methods
    const intervals = paramconfig[type].intervals
    const status = timeseries[ticker]||{}
    const timestamp = now()
    const day = timestamp - 86400000

    // always request 60min RSI
    let params = {
        method: methods[0],
        interval: intervals[0]
    }

    // change request to daily, weekly, monthly
    // if it's been more than 24 hours since we've updated it
    stamp:
    for(let i=0; i<methods.length;i++){
        for(let j=0; j<intervals.length;j++){
            let m = methods[i]
            let inter = intervals[j]
            let key = m+'.'+inter
            if(!status[key] || status[key] < day){
                status[key] = timestamp
                params.method = m
                params.interval = inter
                break stamp;
            }
        }
    }

    timeseries[ticker] = status
    fs.writeFile('./data/timeseries.json', JSON.stringify(timeseries, null, 2), function (err) {
        if (err) return console.log(err)
    })
    return params
}