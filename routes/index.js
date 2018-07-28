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
      request('https://raw.githubusercontent.com/atomantic/tradingview_signals/master/config/tickers.js', function(req, err, body){
        var cleanBody = body.replace('module.exports = ','').replace(/\s/g,'')
        config.tickers = JSON.parse('{"tickers":'+cleanBody+'}').tickers
        return h.response(config.tickers);
      })
    }
  }
]
