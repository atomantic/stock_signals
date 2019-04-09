const sync = require('../lib/sync')
module.exports = {
    method: 'GET',
    path: '/sync',
    handler: function(req, h){
      // clean the results list to only contain the tickers present in the ticker list
      return h.response(sync())
    }
  }