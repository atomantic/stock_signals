const {isEmpty} = require('lodash')
module.exports = function(tickerResults, timeIndex){
    if(
        !isEmpty(tickerResults.overbought.state[timeIndex][0]) && 
        // price is going down but overbought remains
        tickerResults.overbought.state[timeIndex][0][1] > tickerResults.overbought.state[timeIndex][1][1]
    ){
        tickerResults.divergence[timeIndex] = -1
    }else if(
        !isEmpty(tickerResults.oversold.state[0][0]) && 
        // price is going up but oversold remains
        tickerResults.oversold.state[timeIndex][0][1] < tickerResults.oversold.state[timeIndex][1][1]
    ){
        tickerResults.divergence[timeIndex] = 1
    }else{
        tickerResults.divergence[timeIndex] = 0
    }

    // now correct for cases where current price is not in overbought or oversold 
    // but the price has gone beyond the last recorded value
    if(
        tickerResults.oversold.state[timeIndex][1][1] && 
        tickerResults.price < tickerResults.oversold.state[timeIndex][1][1] &&
        // RSI is not in oversold state
        tickerResults.osc[timeIndex][0][tickerResults.osc[timeIndex][0].length-1] >= 30
    ){
        // console.log('corrected BEARISH')
        // fell below the previous oversold price, but not oversold
        tickerResults.divergence[timeIndex] = -1 
    }
    if(
        tickerResults.overbought.state[timeIndex][1][1] && 
        tickerResults.price > tickerResults.overbought.state[timeIndex][1][1] &&
        // RSI is not in oversold state
        tickerResults.osc[timeIndex][0][tickerResults.osc[timeIndex][0].length-1] <= 70
    ){
        // console.log('corrected BULLISH')
        // rose above the previous overbought price, but not overbought
        tickerResults.divergence[timeIndex] = 1
    }

    return tickerResults
}