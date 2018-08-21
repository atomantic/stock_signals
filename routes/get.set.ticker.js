
const config = require('../config')
const runnerData = require('../lib/runner.data')
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
      runnerData.i = i-1
      return h.response(runnerData.i)
    }
  }