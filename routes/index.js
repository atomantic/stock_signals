const cache = require('../lib/cache')
const config = require('../config')
const request = require('request')
module.exports = [{
    method: 'GET',
    path: '/data',
    handler: function(req, h){
      return h.response(cache.results);
    }
  },{
    method: 'GET',
    path: '/tickers',
    handler: function(req, h){
      return h.response(config.tickers);
    }
  },{
    method: 'GET',
    path: '/reload',
    handler: function(req, h){
      // TODO: update tickers from github:
      try{
        request('https://raw.githubusercontent.com/atomantic/tradingview_signals/master/config/tickers.js', function(req, err, body){
          var tickers = JSON.parse(body.replace('module.exports = ',''))
          config.tickers = tickers
          return h.response(config.tickers);
        })
      }catch(e){
        console.error(e.message)
      }
    }
  }
]
