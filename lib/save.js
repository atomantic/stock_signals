const fs = require('fs')
const request = require('request')
module.exports = function(results, cb){
    // save the data to disk
    fs.writeFile('./data/latest.json', JSON.stringify(results, null, 2), function (err) {
        if (err) return console.log(err)
        // console.log(tickerResults.signal, tickerResults.from)
        // update myjson remote backup cache
        fs.createReadStream('./data/latest.json').pipe(request.put(process.env.JSON_CACHE))
        if(cb){
            cb()
        }
    })
}