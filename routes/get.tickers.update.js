
const config = require('../config')
const reloadTickers = require('../lib/reload.tickers')
module.exports = {
    method: 'GET',
    path: '/tickers/update',
    handler: function(req, h){
        reloadTickers(function(){
            console.log('tickers reloaded', config.tickers.length)
        })
        return h.response(config.tickers.length)
    }
}