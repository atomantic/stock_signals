const cheerio = require('cheerio')
const request = require('request')
const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
  }
};
module.exports = function(tickerName) {
  return function(cb) {
    options.url= 'https://dividata.com/stock/'+tickerName
    request(options, function(err, resp, body) {
      if (err) {
        console.error(`dividend`, err)
        return cb(err)
      }
      const $ = cheerio.load(body)
      let exDiv = $('div.col-md-4:nth-child(1) > ul:nth-child(1) > li:nth-child(3) > span:nth-child(2)').text()
      let amount = $('div.col-md-4:nth-child(1) > ul:nth-child(2) > li:nth-child(3) > span:nth-child(2)').text()
      if(exDiv==='N/A') exDiv = undefined
      if(amount==='N/A') amount = undefined
      if(exDiv) exDiv = new Date(exDiv).toISOString().replace(/T.+/, '')
      cb(null, {
        ex: exDiv,
        amount: amount
      })
    })
  }
}