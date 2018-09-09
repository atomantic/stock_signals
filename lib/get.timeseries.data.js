const fs = require('fs')
const {isEmpty} = require('lodash')
const timeseries = require('../data/timeseries.json')
module.exports = function(ticker, name, signal, interval){
    const returnData = {
        overbought: [
            [], // last [rsi,price]
            [] // current [rsi,price]
        ],
        oversold: [
            [], // last [rsi,price]
            [] // current [rsi,price]
        ]
    }
    const file_signal = __dirname+'/../data/timeseries/'+name+'.'+interval+'.'+signal+'.csv'
    const file_price = __dirname+'/../data/timeseries/'+name+'.'+interval+'.price.csv'
    if (!fs.existsSync(file_signal)) {
        console.log(name, signal, interval, 'no signal file', file_signal)
        return returnData
    }
    if (!fs.existsSync(file_price)) {
        console.log(name, signal, interval, 'no price file', file_price)
        return returnData
    }
    const signal_content = fs.readFileSync(file_signal, 'utf8').split('\n')
    // console.log(signal_content)
    if(signal_content.length < 3){
        // console.log(name, signal, interval, 'not enough data', signal_content.length)
        return returnData
    }
   
    const price_content = fs.readFileSync(file_price, 'utf8').split('\n')
    // console.log(price_content)
    if(price_content.length < 3){
        // console.log(name, signal, interval, 'not enough data', price_content.length)
        return returnData
    }
    if(signal_content[0]==='{' || price_content[0]==='{'){ // bad file
        console.log(name, signal, interval, 'bad files, deleting')
        fs.unlinkSync(file_signal)
        fs.unlinkSync(file_price)
        delete timeseries[ticker][signal+'.'+interval]
        return fs.writeFileSync(__dirname+'/../data/timeseries.json', JSON.stringify(timeseries, null, 2))
    }
    // we need to find the last time we were in an oversold
    // and the last time we were in an overbought state
    // and the most recent of each state
    let overbought_continuation = 0
    let oversold_continuation = 0
    // console.log(signal_content.length)
    for(let i=1;i<signal_content.length-1; i++){
        // SIGNAL file looks like this:
        // time,RSI
        // 2018-09-07,52.7884
        // 2018-09-06,59.1165
        if(!signal_content[i]){
            console.log(name, signal, interval, i, 'no signal data')
            return returnData
        }
        let rsi = Number(signal_content[i].split(',')[1])
        // PRICE file looks like this:
        // timestamp,open,high,low,close,volume
        // 2018-09-07,37.5000,37.7200,37.3400,37.3900,328239
        // 2018-09-06,37.7400,37.9000,37.5900,37.7000,434746
        if(!price_content[i]){
            console.log(name, signal, interval, i, 'no price data')
            return returnData
        }
        let price = Number(price_content[i].split(',')[4])
        
        if(rsi > 70){
            // not yet populated most recent OR continuation and haven't started populating previous
            if(isEmpty(returnData.overbought[1]) || (overbought_continuation && isEmpty(returnData.overbought[0]))){
                returnData.overbought[1] = [rsi, price]
                overbought_continuation = 1
            }else if(isEmpty(returnData.overbought[0]) || overbought_continuation){
                returnData.overbought[0] = [rsi, price]
                overbought_continuation = 1
            }
        }else if(rsi < 30){
            if(isEmpty(returnData.oversold[1]) || (oversold_continuation && isEmpty(returnData.oversold[0]))){
                returnData.oversold[1] = [rsi, price]
                oversold_continuation = 1
            }else if(isEmpty(returnData.oversold[0]) || oversold_continuation){
                returnData.oversold[0] = [rsi, price]
                oversold_continuation = 1
            }
        }else if(rsi < 65 && rsi > 35) {
            // reset using buffer
            overbought_continuation = 0
            oversold_continuation = 0
            // NOTE: we want to only track either overbought OR oversold
            // (only one is the appropriate indicator for reversal)
            // so whichever side completes the prev, current pair first is the most active/recent indicator
            // for a hidden divergence (so when either completes the previous, we are good to bail out)
            if(!isEmpty(returnData.overbought[0]) || !isEmpty(returnData.oversold[0])){
                // filled both current/last of each array
                return returnData
            }
        }
    }
    // console.log(returnData)
    return returnData
}