// can use this to listen for remote console logs
module.exports = function(bLogMessages) {
  if (bLogMessages) {
    casper.on('remote.message', function(message) {
      this.echo('👻  - message from browser console: ' + message)
    })
  }
}
