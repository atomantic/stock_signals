
const config = require('../config')
module.exports = {
    method: 'GET',
    path: '/tickers',
    handler: function(req, h){
      return h.response(config.tickers);
    }
  }