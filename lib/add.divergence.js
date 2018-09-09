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
    return tickerResults
}