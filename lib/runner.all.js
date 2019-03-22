
const {	cloneDeep, isEqual, mean, merge, now } = require('lodash')
const config = require('../config')
const getSignals = require('./get.signals')
const results = require('../data/latest')
const runnerData = require('./runner.data')
const save = require('./save')
const numeric = config.maps.numeric

const runner = {
	data: runnerData,
    run: getNextPeriod,
    start: now(),
	pause: 60*60*1000 // 1 hour
}

module.exports = runner

function getNextPeriod() {
    runnerData.period++
    runner.start = now()
	if (runnerData.period === config.periods.length) {
		runnerData.period = 0
	}
    getSignals(config.periods[runnerData.period], (data)=>{
        // data is formatted as an array of tickers with data:
        // e.g. [{s:'NASDAQ:AAPL',d:{RSI: "..."}}]
        const timestamp = now()
        data.forEach(t=>{
            const tickerSplit = t.s.replace('crypto:', '').replace('swap:', '').split('-')
            const ticker = tickerSplit[0]+'-'+tickerSplit[1]
            const tickerName = tickerSplit[1]
            const previousLog = merge(cloneDeep(config.tickerSchema), cloneDeep(results.tickers[ticker])) 
		    results.tickers[ticker] = cloneDeep(previousLog)
		    // short var ref
            const tickerResults = results.tickers[ticker]

            // Summary Signal
            let newValue = numeric[t.d['Recommend.All']]
            let prevValue = previousLog.sum[runnerData.period]
            let prevPrev = previousLog.prev[runnerData.period] // the forwarded previous value
            if( isUndefined(newValue) || isNull(newValue)) {
                console.error('error getting technical signal', ticker, t.d)
                // don't accept it
                newValue = prevValue
            }
            tickerResults.sum[runnerData.period] = newValue
            tickerResults.prev[runnerData.period] = newValue===prevValue ? prevPrev : prevValue
            
            // create aggregate signal for hourly/daily/weekly/monthly
            tickerResults.meta = Math.round(mean(tickerResults.sum))
            tickerResults.from = Math.round(mean(tickerResults.prev))

            // oscillators
            push_signals([
                t.d['RSI'],                     // RSI
                t.d['Stoch.RSI.K'],             // Stochastic RSI Fast (3, 3, 14, 14)
                t.d['Stoch.K'],                 // Stochastic %K (14, 3, 3)
                t.d['UO'],                      // Ultimate Oscillator (7, 14, 28)
                numeric[t.d['MACD.signal']],    // MACD Level (12, 27) (numeric signal: -2,-1,0,1,2)
                t.d['CCI20']                    // Commodity Channel Index (20)
                
            ], tickerResults.osc[runnerData.period])
            // moving averages
            push_signals([
                config.maps.numeric(t.d['Rec.HullMA9'])     // Hull MA (9)
            ], tickerResults.ma[runnerData.period])


            tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', '60min')
            tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', 'daily')
            tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', 'weekly')
            tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', 'monthly')

            if(!isEqual(tickerResults, previousLog)){
                tickerResults.time = timestamp
            }
        })
        // save all tickers
        save(results, function(){
            console.log('updated all ticker signals', now() - runner.start)
            setTimeout(runner.run, runner.pause)
        })
    }) // getSignals
} // module

