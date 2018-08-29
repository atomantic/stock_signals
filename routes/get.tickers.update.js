
const config = require('../config')
const reloadTickers = require('../lib/reload.tickers')
module.exports = {
    method: 'GET',
    path: '/tickers/update',
    handler: function(req, h){
        reloadTickers(function(){
            return h.response(config.tickers)
        })
    }
}