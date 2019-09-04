const cheerio = require('cheerio')
const request = require('request')
const options = {
  headers: {
    'Cookie': 'PHPSESSID=a9tdtqfdcb4ncleinqs17bnjh3; _ga=GA1.2.1241261800.1567200675; _gid=GA1.2.1763243084.1567200675',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
  }
};
module.exports = function(tickerName) {
  return function(cb) {
    options.url= 'https://www.streetinsider.com/dividend_history.php?q='+tickerName
    request(options, function(err, resp, body) {
      if (err) {
        console.error(`dividend`, err)
        return cb(err)
      }
      // console.log(body)
      const $ = cheerio.load(body)
      const $table = $('.dividends')
      if(!$table.length)  console.error(`no dividend info for ${tickerName} on ${options.url}`)
      // console.log(`table: ${$table.length}`)
      const $row = $table.find('tr:nth-child(2)')
      // console.log($row.text())
      let ex = $row.find('td:nth-child(1)').text()
      if(ex) ex = new Date(ex).toISOString().replace(/T.+/, '')
      let rec = $row.find('td:nth-child(7)').text()
      if(rec) rec = new Date(rec).toISOString().replace(/T.+/, '')
      cb(null, {
        ex: ex,
        amount: $row.find('td:nth-child(2)').text(),
        rec: rec
      })
    })
  }
}