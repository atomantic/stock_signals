const {isEqual} = require('lodash')
/**
 * 
- store the daily [RSI, price] as an overbought (red: > 70) tuple
- store the daily [RSI, price] as an oversold (green: < 30) tuple
- if the RSI goes higher than the current last overbought tuple, update it
- if the RSI goes lower than the current last oversold tuple, update it
- once the RSI drops below 70, lock the overbought tuple
- once the RSI drops above 30, lock the oversold tuple
- once locked, store the next occurance in a rolling second tuple ([last, current] where last=[last_RSI, last_price], current=[current_RSI, current_price])
- when an update record shows that the current overbought tuple has a lower price than the last overbought tuple, we have achieved a bearish divergence (SELL)
- when an update record shows that the current oversold tuple has a higher price than the last oversold tuple, we have achieved a bullish divergence (BUY)
 */

module.exports = function(tickerResults){
    // RSI values are stored in tickerResults.osc[i][0]
    // where i is an index of the candle time (4h, 1d, 1w, 1m)
    for(let i=0;i<tickerResults.osc.length; i++){
        let rsi = tickerResults.osc[i][0][tickerResults.osc[i][0].length-1]
        // console.log(rsi)
        if(rsi==='/'){
            continue;
        }
        let tuple = [rsi, tickerResults.price]
        // if we have two records, it's [prev, current]
        // else it's [current]
        // else it's []
        let ob = tickerResults.overbought.state[i] // shortcut
        let os = tickerResults.oversold.state[i] // shortcut
        let prev_overbought = ob.length === 2 ? ob[0] : undefined
        let prev_oversold = os.length === 2 ? os[0] : undefined
        let current_ob_index = ob.length === 2 ? 1 : 0
        let current_os_index = os.length === 2 ? 1 : 0
        // overbought and changed?
        if(rsi > 70 && !isEqual(ob[current_ob_index], tuple)){
            // console.log('overbought', rsi, ob[current_ob_index], tuple)
            // are we continuing an overbought state or starting a new one?
            // is the current RSI higher than the recorded current RSI
            if(tickerResults.overbought.cont[i]===1){
                // continuation
                if(ob[current_ob_index][0] < rsi){
                    // TODO: verify this logic (should we push it in always until it falls?)
                    // should we check it as highest current to highest last?
                    // to a higher RSI
                    // update price in current tuple location
                    ob[current_ob_index] = tuple
                } // otherwise, keep the current record
            }else{ // new instance
                // add new record
                // console.log(tuple)
                ob.push(tuple)
                if(ob.length > 2){
                    ob.shift()// (only retain [last, current])
                }
                // set continuation state
                tickerResults.overbought.cont[i]=1
            }
            // now evaluate for divergence:
            // bullish expects the price to continue upward from the last time we had overbought RSI
            // if the price drops, we have diverged
            if(prev_overbought){ // make sure there even is a previous state to check
                if(ob[current_ob_index][1] < prev_overbought[1]){
                    // bearish divergence!
                    tickerResults.divergence[i] = -1
                // }else{
                    // I think we don't want to nullify the bearish/bullish direction
                    // we are always in one or the other
                //     tickerResults.divergence[i] = 0
                }
            // }else{
                // no previous overbought record
                // nothing to change
            }
            
        }else if(rsi < 30 && !isEqual(os[current_os_index], tuple)){ // oversold and changed?
            if(tickerResults.oversold.cont[i]===1){
                if(os[current_os_index][0] < rsi){
                    os[current_os_index] = tuple
                } 
            }else{ 
                os.push(tuple)
                if(os.length > 2){
                    os.shift()
                }
                tickerResults.oversold.cont[i]=1
            }
            if(prev_oversold){
                if(os[current_os_index][1] > prev_oversold[1]){
                    // bullish divergence!
                    tickerResults.divergence[i] = 1
                // }else{
                //     tickerResults.divergence[i] = 0
                }
            }
        }else{
            // clear continuation
            tickerResults.overbought.cont[i]=0
            tickerResults.oversold.cont[i]=0
        }
    }
    return tickerResults
}