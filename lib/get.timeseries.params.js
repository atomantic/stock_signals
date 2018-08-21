
const {now} = require('lodash')
const fs = require('fs')
const timeseries = require('../data/timeseries.json')
const methods = ['RSI', 'STOCHRSI']
const intervals = ['daily', 'weekly', 'monthly']

module.exports = function(ticker){
    const status = timeseries[ticker]||{}
    const timestamp = now()
    const yesterday = timestamp - 86400000
    let params = {
        method: methods[0],
        interval: intervals[0]
    }

    stamp:
    for(let i=0; i<methods.length;i++){
        for(let j=0; i<intervals.length;j++){
            let m = methods[i]
            let inter = intervals[j]
            let key = m+'.'+inter
            if(!status[key] || status[key] < yesterday){
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