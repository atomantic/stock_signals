
// TEST SCRIPT for adding new fields

const request = require('request')
const getColumns = require('./get.signal.columns')
const columnBase = getColumns()
const output = {}
const requestConfig = {
    method: 'POST',
    uri: 'https://scanner.tradingview.com/america/scan',
    headers: {
        'Referer': 'https://www.tradingview.com/',
        'Origin': 'https://www.tradingview.com',
        'User-Agent': 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36',
        'content-type': 'application/x-www-form-urlencoded'
    },
    json: { 
        "symbols":{ 
            "tickers": ['NASDAQ:AAPL'], 
            "query": { 
                "types": [] 
            } 
        }, 
        "columns": getColumns()
    }
}
request(requestConfig, function (err, resp, body) {
    // console.log(resp.request.req.toCurl());
    if (err) {
        return console.error(err, body)
    }
    // console.log(body)
    const d = body.data[0].d
    columnBase.forEach((k, i)=>{
        output[k] = d[i]
    })
    console.log(output)
    // osc sum
    // ma sum
    // sum
    // rsi
})