const rollingFile = require('rolling-file')
const dir = '../data'
const config = { 
    fileExtension: 'csv',
    fileName: 'signals', 
    byteLimit: '100 MB' 
}

module.exports = function(data){
    const f = rollingFile(dir, config)
    f.write(data)
    f.end()
}