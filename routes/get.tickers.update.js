
const config = require('../config')
module.exports = {
    method: 'GET',
    path: '/tickers/update',
    handler: function(req, h){
        reloadTickers(function(){
        return h.response(config.tickers)
        })
    }
}