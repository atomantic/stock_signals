
const {	cloneDeep, isEqual, isNull, isUndefined, mean, merge, now } = require('lodash')
const addTimeseries = require('./add.timeseries')
const config = require('../config')
const getSignals = require('./get.signals')
const push_signals = require('./push_signals')
const results = require('../data/latest')
const runnerData = require('./runner.data')
const save = require('./save')

const runner = {
	data: runnerData,
    run: getNextPeriod,
    start: now(),
	pause: 60*30*1000 // 30 minutes
}

module.exports = runner

function getNextPeriod() {
    results.period = runnerData.period // record last period fetched
    runnerData.period++
    runner.start = now()
	if (runnerData.period === config.periods.length) {
		runnerData.period = 0
	}
    getSignals(config.periods[runnerData.period], (err, data)=>{
        if(err) return
        // data is formatted as an array of tickers with data:
        // e.g. [{s:'NASDAQ:AAPL',d:{RSI: "..."}}]
        const timestamp = now()
        // console.log(data, data[0])
        data.forEach(t=>{
            const tickerSplit = t.s.split(':')
            const ticker = tickerSplit[0]+'-'+tickerSplit[1]
            const tickerName = tickerSplit[1]
            const previousLog = merge(cloneDeep(config.tickerSchema), cloneDeep(results.tickers[ticker])) 
		    results.tickers[ticker] = cloneDeep(previousLog)
		    // short var ref
            let tickerResults = results.tickers[ticker]

            // console.log({tickerResults})

            // Summary Signal
            let newValue = t.d['Recommend.All']
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
                t.d['RSI'],         // RSI
                t.d['Stoch.RSI.K'], // Stochastic RSI Fast (3, 3, 14, 14)
                t.d['Stoch.K'],     // Stochastic %K (14, 3, 3)
                t.d['UO'],          // Ultimate Oscillator (7, 14, 28)
                t.d['MACD.signal'], // MACD Level (12, 27) (numeric signal: -2,-1,0,1,2)
                t.d['CCI20']        // Commodity Channel Index (20)
                
            ], tickerResults.osc[runnerData.period])
            // moving averages
            push_signals([
                t.d['Rec.HullMA9']  // Hull MA (9)
            ], tickerResults.ma[runnerData.period])


            tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', '60min')
            tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', 'daily')
            tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', 'weekly')
            tickerResults = addTimeseries(tickerResults, ticker, tickerName, 'RSI', 'monthly')

            if(!isEqual(tickerResults, previousLog)){
                tickerResults.time = timestamp
            }
            // console.log({tickerResults})
        })
        // save all tickers
        save(results, function(){
            console.log('updated all ticker signals', now() - runner.start+'ms')
            setTimeout(runner.run, runner.pause)
        })
    }) // getSignals
} // module

