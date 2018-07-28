// can use this to listen for remote console logs
module.exports = function(message, param) {
  casper.echo('🐞  - ' + message + ': ' + param)
}
