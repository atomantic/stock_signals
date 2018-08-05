const {	each, now } = require('lodash')
const results = require('../data/results')
const config = require('../config')
const request = require('request')
const runnerData = require('../lib/runner.data')
const reloadTickers = require('../lib/reload.tickers')
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
    path: '/tickers/update',
    handler: function(req, h){
      reloadTickers(function(){
        return h.response(config.tickers)
      })
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
      // set two back so we will increment into it after the current run finishes
      runnerData.currentIndex = i-2
      return h.response(runnerData.currentIndex)
    }
  },{
    method: 'GET',
    path: '/sync',
    handler: function(req, h){
      // clean the results list to only contain the tickers present in the ticker list
      each(results.results, function(value, key){
        if(config.tickers.indexOf(key)===-1){
          // should not exist
          delete results.results[key]
        }
      })
      // ensure that there is a blank ticker result for any that are missing
      each(config.tickers, function(key){
        if(!results.results[key]){
          results.results[key] = {
            signal: '?',
            day: {},
            hours: {},
            month: {},
            updated: now(),
            week: {}
          }
        }
      })
      return h.response(results)
    }
  }
]
