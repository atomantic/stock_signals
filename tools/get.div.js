const getDiv = require('../lib/task.get.dividend.next')
const fs = require('fs')
const tickers = fs.readFileSync('./tickers.txt').toString().split('\n')
const parallel = require('async.parallel')
const tasks = tickers.map(t=>{
    return getDiv(t)
})

parallel(tasks, (err, data)=>{
    console.log(data.map(d => d.ex).join('\n'))
    // console.log(data.map(d=>`ex: ${d.ex} | rec: ${d.rec} | amount: ${d.amount}`).join('\n'))
})
