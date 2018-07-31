const results = require('../data/results')
const config = require('../config')
const request = require('request')
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
    path: '/reload',
    handler: function(req, h){
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
