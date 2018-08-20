
const timeseries = require('../lib/task.get.timeseries.alphav')
module.exports = {
    method: 'GET',
    path: '/timeseries/{ticker}/{method}/{interval}/{key?}',
    handler: function(req, h){
        task = timeseries(req.params.ticker, req.params.method, req.params.interval, req.params.key)
        task(function(err, data){
            if(err){
                console.error(err)
            }
        })
        return h.response('ok');
    }
  }