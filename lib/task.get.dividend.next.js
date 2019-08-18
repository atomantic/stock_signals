const cheerio = require('cheerio')
const request = require('request')
const options = {
  url: 'https://www.nasdaq.com/symbol/',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
  }
};
module.exports = function(tickerName) {
  return function(cb) {
    options.url+=tickerName
    console.log(options.url)
    request(options, function(err, resp, body) {
      if (err) {
        console.error(`dividend`, err)
        return cb(err)
      }
      const $ = cheerio.load(body)
      const $ex_div = $('div b:contains(Ex Dividend Date)')
      if(!$ex_div.length){
          console.log(`${ticker} no dividend info`)
          return cb(null, '')
      }
      const div_date = $ex_div.parent().next().text().replace(/\s+/g,'')
      cb(null, div_date)
    })
  }
}