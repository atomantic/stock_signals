const { isNull } = require('lodash')

module.exports = function push_signals(signal_array, state_array){
    for(var i=0; i < signal_array.length; i++){
        // current length
        var size = state_array[i].length
        // previous item value
        var val_last = state_array[i][size-1] 
        // new value being pushed
        // note: for newer tickers, Monthly (and maybe weekly) may have null values 
        // make them "/", not 0, but also not null
        var val_new = isNull(signal_array[i]) ? '/' : signal_array[i]
        // console.log('val_new',val_new, 'val_last', val_last)

        // if the array holder itself is null, just make it an array with this item value
        // this is a corrective measure
        if(isNull(state_array[i])){
            state_array[i] = [ val_new ]
        }else if(val_last!==val_new){
            state_array[i].push(val_new)
        }
        // only keep 2 most recent values
        if(state_array[i].length > 2){
            state_array[i].shift()
        }
    }
}