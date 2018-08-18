const rollingFile = require('rolling-file')
const dir = __dirname+'/../data'
const config = { 
    fileExtension: 'csv',
    fileName: 'signals', 
    byteLimit: '100 MB' 
}
const f = rollingFile(dir, config)

module.exports = function(data){
    f.write(data)
}