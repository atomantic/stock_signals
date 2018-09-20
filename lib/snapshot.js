var snaps = 0
const envVars = require('system').env
module.exports = function(ticker){
  if(!envVars.SNAPSHOT_ENABLED){
    return; // snapshots disabled
  }
  casper.capture('./snaps/'+ticker+'_'+(++snaps)+'.png')
}
