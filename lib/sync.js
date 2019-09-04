const {	cloneDeep, each } = require('lodash')
const config = require('../config')
const results = require('../data/latest')
module.exports = ()=>{
    delete require.cache[require.resolve('../config/tickers')]
    config.tickers = require('../config/tickers')
    // clean the results list to only contain the tickers present in the ticker list
    each(results.tickers, (value, key) => {
        if(config.tickers.indexOf(key)===-1){
            // should not exist
            delete results.tickers[key]
        }
    })
    // ensure that there is a blank ticker result for any that are missing
    each(config.tickers, function(key){
        if(!results.tickers[key]){
            results.tickers[key] = cloneDeep(key.includes('swap:') ? config.swapSchema : config.tickerSchema)
        }
    })
    return results
}