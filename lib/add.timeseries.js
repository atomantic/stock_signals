const fs = require('fs')
const {isEmpty} = require('lodash')
const timeseries = require('../data/timeseries.json')
const intervalIndexMap = {
    '60min': 0,
    'daily': 1,
    'weekly': 2,
    'monthly': 3
} 
const addDivergence = require('./add.divergence')

// Adds the bearish/bullish divergence and overbought/oversold data to the tickerResults object
// this update is by reference
module.exports = function(tickerResults, ticker, name, signal, interval){

    const file_signal = __dirname+'/../data/timeseries/'+name+'.'+interval+'.'+signal+'.csv'
    const file_price = __dirname+'/../data/timeseries/'+name+'.'+interval+'.price.csv'
    if (!fs.existsSync(file_signal)) {
        console.log(name, signal, interval, 'no signal file', file_signal)
        return tickerResults
    }
    if (!fs.existsSync(file_price)) {
        console.log(name, signal, interval, 'no price file', file_price)
        return tickerResults
    }
    const signal_content = fs.readFileSync(file_signal, 'utf8').split('\n')
    // console.log(signal_content)
    if(signal_content.length < 3){
        // console.log(name, signal, interval, 'not enough data', signal_content.length)
        return tickerResults
    }
   
    const price_content = fs.readFileSync(file_price, 'utf8').split('\n')
    // console.log(price_content)
    if(price_content.length < 3){
        // console.log(name, signal, interval, 'not enough data', price_content.length)
        return tickerResults
    }
    if(signal_content[0]==='{' || price_content[0]==='{'){ // bad file
        console.log(name, signal, interval, 'bad files, deleting')
        fs.unlinkSync(file_signal)
        fs.unlinkSync(file_price)
        delete timeseries[ticker][signal+'.'+interval]
        fs.writeFileSync(__dirname+'/../data/timeseries.json', JSON.stringify(timeseries, null, 2))
        return tickerResults
    }

    // we need to find the last time we were in an oversold
    // and the last time we were in an overbought state
    // and the most recent of each state

    // get the time interval index we are using for storage
    const timeIndex = intervalIndexMap[interval]
    // wipe out existing records
    tickerResults.overbought.state[timeIndex] = [
        [], // last [rsi,price]
        [] // current [rsi,price]
    ]
    tickerResults.oversold.state[timeIndex] = [[],[]]
    // reset continuations
    tickerResults.overbought.cont[timeIndex] = 0
    tickerResults.oversold.cont[timeIndex] = 0
    // console.log(signal_content.length)
    for(let i=1;i<signal_content.length-1; i++){
        // SIGNAL file looks like this:
        // time,RSI
        // 2018-09-07,52.7884
        // 2018-09-06,59.1165
        if(!signal_content[i]){
            console.error(name, signal, interval, i, 'no signal data')
            break
        }
        let rsi = Number(signal_content[i].split(',')[1])
        // PRICE file looks like this:
        // timestamp,open,high,low,close,volume
        // 2018-09-07,37.5000,37.7200,37.3400,37.3900,328239
        // 2018-09-06,37.7400,37.9000,37.5900,37.7000,434746
        if(!price_content[i]){
            console.error(name, signal, interval, i, 'no price data')
            break
        }
        let price = Number(price_content[i].split(',')[4])
        
        if(rsi > 70){
            // not yet populated most recent OR continuation and haven't started populating previous
            // (so still working on the current overbought)
            if(
                isEmpty(tickerResults.overbought.state[timeIndex][1]) || 
                (tickerResults.overbought.cont[timeIndex] && isEmpty(tickerResults.overbought.state[timeIndex][0]))
            ){
                tickerResults.overbought.state[timeIndex][1] = [rsi, price]
                tickerResults.overbought.cont[timeIndex] = 1
                // console.log('populate overbought current', timeIndex, tickerResults.overbought.state[timeIndex])
            }else if(isEmpty(tickerResults.overbought.state[timeIndex][0]) || tickerResults.overbought.cont[timeIndex]){
                // previous is empty OR it's a continuation (so continuing previous)
                tickerResults.overbought.state[timeIndex][0] = [rsi, price]
                tickerResults.overbought.cont[timeIndex] = 1
                // console.log('populate overbought prev', timeIndex, tickerResults.overbought.state[timeIndex])
            }
        }else if(rsi < 30){
            if(
                isEmpty(tickerResults.oversold.state[timeIndex][1]) || 
                (tickerResults.oversold.cont[timeIndex] && isEmpty(tickerResults.oversold.state[timeIndex][0]))
            ){
                tickerResults.oversold.state[timeIndex][1] = [rsi, price]
                tickerResults.oversold.cont[timeIndex] = 1
                // console.log('populate oversold current', timeIndex, tickerResults.oversold.state[timeIndex])
            }else if(isEmpty(tickerResults.oversold.state[timeIndex][0]) || tickerResults.oversold.cont[timeIndex]){ 
                tickerResults.oversold.state[timeIndex][0] = [rsi, price]
                tickerResults.oversold.cont[timeIndex] = 1
                // console.log('populate oversold previous', timeIndex, tickerResults.oversold.state[timeIndex])
            }
        }else if( (rsi < 65) && (rsi > 35) ) {
            // reset using buffer
            tickerResults.overbought.cont[timeIndex] = 0
            tickerResults.oversold.cont[timeIndex] = 0
        }
        // NOTE: we want to only track either overbought OR oversold
        // (only one is the appropriate indicator for reversal)
        // so whichever side completes the prev, current pair first is the most active/recent indicator
        // for a hidden divergence (so when either completes the previous, we are good to bail out)
        if(!isEmpty(tickerResults.overbought.state[timeIndex][0]) || !isEmpty(tickerResults.oversold.state[timeIndex][0])){
            // filled both current/last of each array
            // stop the loop
            // see if we found a hidden divergence
            return addDivergence(tickerResults, timeIndex)
        }
    }
    return addDivergence(tickerResults, timeIndex)
}