
const results = require('../data/latest')
module.exports = {
    method: 'GET',
    path: '/data',
    handler: function(req, h){
      return h.response(results);
    }
  }