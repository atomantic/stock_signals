const config = require('../config')
const fs = require('fs')
const mathjs = require('mathjs')

const calcHistorics = (ticker, period)=>{
    const priceFile = __dirname+`/../data/timeseries/${ticker}.${period}.price.csv`
    if(!fs.existsSync(priceFile)){
        console.warn(`no price data for ${ticker} in ${period}, skipping...`)
        return config.tickerSchema.historics[0] // empty template
    }
    const historic = fs.readFileSync(priceFile).toString()
    // capture only the close column
    const closes = historic
        .replace(/\n[^,]+,[^,]+,[^,]+,[^,]+,([^,]+),.+$/gm, '\n$1')
        .split('\n')
        // remove header and trim to desired periods
        .splice(1, config.linreg_periods[period])
        .map(n=>Number(n))

    if(!closes.length){
        console.warn(`no close data for ${ticker}`)
        // file is corrupt--delete it
        fs.unlinkSync(priceFile)
        return {}
    }

    const calc = {
        mad: Number(mathjs.mad(closes).toFixed(2)),
        max: mathjs.max(closes),
        mean: Number(mathjs.mean(closes).toFixed(2)),
        median: Number(mathjs.median(closes).toFixed(2)),
        min: mathjs.min(closes),
        std: Number(mathjs.std(closes).toFixed(2)),
        variance: Number(mathjs.variance(closes).toFixed(2))
    }
    // console.log(calc)
    return calc
}

// calcHistorics('AAPL', '60min')

module.exports = calcHistorics