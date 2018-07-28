var snaps = 0
const envVars = require('system').env
module.exports = function(){
  if(!envVars.SNAPSHOT_ENABLED){
    return; // snapshots disabled
  }
  casper.capture('../snaps/ticker_'+(++snaps)+'.png')
}
