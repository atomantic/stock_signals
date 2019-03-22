const fs = require('fs')
module.exports = function(name, interval, periods){
    periods = periods||20

    const file_signal = __dirname+'/../data/timeseries/'+name+'.'+interval+'.price.csv'
    if (!fs.existsSync(file_signal)) {
        console.log(name, signal, interval, 'no price file', file_signal)
        return data
    }
    const price_content = fs.readFileSync(file_signal, 'utf8').split('\n')

    // Price files look like this:

    // timestamp,open,high,low,close,volume
    // 2018-11-07,32.1000,32.3699,30.0500,31.0000,2041955
    // 2018-11-06,32.6800,33.5600,31.4000,32.9500,1605825
    // 2018-11-05,32.0000,34.7700,31.6001,32.6800,2292040

    price_content.shift() // remove header

    const calc = {
        range: [],
        percent: [],
        percent_from_close: []
    }

    if(price_content.length-1 < periods){ // omit last
        periods = price_content.length-1
    }
    // console.log('periods', periods, 'of', price_content.length)
    price_data = price_content.map( r=>{
        let tmp = r.split(',')
        // [open, high, low, close]
        return [Number(tmp[1]), Number(tmp[2]), Number(tmp[3]), Number(tmp[4])]
    })
    // console.log('price_data', price_data[0])
    price_data = price_data.map( (d, i, arr) => {
        if((i+1)===arr.length) {
            // can't get next on last item
            return d
        }
        let prev_close = arr[i+1][3]
        let range = d[1] - d[2] // high - low
        let prev_close_to_new_high = d[1] - prev_close
        let percent = (d[1] / d[2]) - 1
        let percent_from_close = (d[3] / prev_close) - 1 // this close from last close
        d.push(range, prev_close, prev_close_to_new_high, percent, percent_from_close)
        if(i < periods){
            calc.range.push(range)
            calc.percent.push(percent)
            calc.percent_from_close.push(percent_from_close)
        }
        return d
    })
    // console.log('price_data', price_data[0])
    // console.log('calc', calc)

    total_range = calc.range.reduce((a, b) => a + b)
    total_percent = calc.percent.reduce((a, b) => a + b)
    total_percent_from_close = calc.percent_from_close.reduce((a, b) => a + b)

    // remove final row (no prior period to get change value)
    // price_content.pop()
    // [average_range, average_percent, average_percent_from_close]
    return [
        Number((total_range / calc.range.length).toFixed(4)), 
        Number((total_percent / calc.percent.length).toFixed(4)),  
        Number((total_percent_from_close / calc.percent_from_close.length).toFixed(4)), 
    ]
}