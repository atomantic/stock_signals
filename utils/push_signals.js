module.exports = function push_signals(signal_array, state_array){
    for(var i=0; i < signal_array.length; i++){
        var size = state_array[i].length
        var val_last = state_array[i][size-1] 
        var val_new = signal_array[i]
        // console.log('val_new',val_new, 'val_last', val_last)
        if(!state_array[i]){ // it is set to null or some such nonesense
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