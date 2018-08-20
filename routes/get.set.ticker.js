
const config = require('../config')
module.exports = {
    method: 'GET',
    path: '/set/{ticker}',
    handler: function(req, h){
      // change the current ticker index to make it run a particular ticker next
      // e.g. GET /set/NASDAQ-AAPL
      var i = config.tickers.indexOf(req.params.ticker)
      if(i===-1){
        return h.response('not found')
      }
      // set two back so we will increment into it after the current run finishes
      runnerData.i = i-1
      return h.response(runnerData.i)
    }
  }