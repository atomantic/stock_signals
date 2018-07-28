const cache = require('../lib/cache')
const config = require('../config')
// const request = require('request')
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
      return h.response(config.tickers);
    }
  }
]
