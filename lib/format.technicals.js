const config = require('../config')
const {	isNull, isUndefined } = require('lodash')
const push_signals = require('./push_signals')
module.exports = function(l, index, tickerResults, previousLog){
    const technicals = {}
    try{
        technicals = JSON.parse(l.split(': ')[1])
    }catch(e){
        return console.error('json parse error', e.message)
    }
    if(!technicals){
        return console.error('no technicals', l.split(': ')[1])
    }
    for(var i=0;i<technicals.titles.length;i++){
        // for now, we are only concerned with Summary,
        // we are scraping and saving the Oscillators and Moving Averages
        // (in case we want to use the underlying reasons for the Summary later)
        if(technicals.titles[i]==='Summary') {
            let newValue = config.maps.numeric[technicals.values[i]]
            let prevValue = previousLog.sum[index]
            let prevPrev = previousLog.prev[index] // the forwarded previous value
            if( isUndefined(newValue) || isNull(newValue)) {
                console.error('error getting technical signal', ticker, technicals)
                // don't accept it
                newValue = prevValue
            }
            tickerResults.sum[index] = newValue
            tickerResults.prev[index] = newValue===prevValue ? prevPrev : prevValue
        }
    }
    // oscillators
    push_signals(technicals.osc, tickerResults.osc[index])
    // moving averages
    push_signals(technicals.ma, tickerResults.ma[index])
    // console.log('edited',tickerResults.ma)
}