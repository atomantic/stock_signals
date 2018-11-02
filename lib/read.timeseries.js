const fs = require('fs')
module.exports = function(name, signal, interval){
    const data = []
    const file_signal = __dirname+'/../data/timeseries/'+name+'.'+interval+'.'+signal+'.csv'
    if (!fs.existsSync(file_signal)) {
        console.log(name, signal, interval, 'no signal file', file_signal)
        return data
    }
    const signal_content = fs.readFileSync(file_signal, 'utf8').split('\n')
    if(signal_content.length < 3){
        console.log(name, signal, interval, 'not enough data', signal_content.length)
        return data
    }
    // SIGNAL files look like this:
    // time,RSI
    // 2018-09-07,52.7884
    // 2018-09-06,59.1165
    for(let i=1;i<4; i++){ // return just the latest 3 items
        let row = signal_content[i]
        if(!row){
            console.error(name, signal, interval, i, 'no signal data')
            break
        }
        data.push(Number(row.split(',')[1]))
    }
    return data
}