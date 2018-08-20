const fs = require('fs')
const path = require('path')
const routes = []

fs.readdirSync(__dirname)
  .filter(file => file!== path.basename(__filename))
  .forEach(file => {
    let route = require(path.join(__dirname, file))
    if(route instanceof Array){
      routes = routes.concat(route)
    }else{
      routes.push(route)
    }
  })

module.exports = routes
