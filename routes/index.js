const results = require('../data/results')
const config = require('../config')
const request = require('request')
const runnerData = require('../lib/runner.data')
module.exports = [{
    method: 'GET',
    path: '/data',
    handler: function(req, h){
      return h.response(results);
    }
  },{
    method: 'GET',
    path: '/tickers',
    handler: function(req, h){
      return h.response(config.tickers);
    }
  },{
    method: 'GET',
    path: '/set/{ticker}',
    handler: function(req, h){
      // change the currentIndex to make it run a particular ticker next
      // e.g. GET /set/NASDAQ-AAPL
      var i = config.tickers.indexOf(req.params.ticker)
      if(i===-1){
        return h.response('not found')
      }
      // set one back so we will increment into it after the current run finishes
      runnerData.currentIndex = i--
      return h.response(runnerData.currentIndex)
    }
  },{
    method: 'GET',
    path: '/reload',
    handler: function(req, h){
      // update the source tickers from github
      console.log('updating source file', process.env.TICKER_SOURCE_FILE)
      request(process.env.TICKER_SOURCE_FILE, function(err, req, body){
          var cleanBody = body.replace('module.exports = ','').replace(/\s/g,'')
          config.tickers = JSON.parse('{"tickers":'+cleanBody+'}').tickers
          console.log('tickers updated')
      })
      return h.response()
    }
  }
]
