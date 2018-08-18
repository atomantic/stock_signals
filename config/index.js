module.exports = {
  maps: require('./maps'),
  tickerSchema: {
    price: 0,
    time: 0,
    sum: [
      0, // 4 hour summary signal
      0, // 1 day summary signal
      0, // 1 week summary signal
      0 // 1 month summary signal
    ],
    // last changed summary signals
    // so if it went from Neutral->Buy on the 1 day, sum[1] = 1 && prev[1] = 0
    prev: [0,0,0,0],
    meta: 0, // the average meta signal from all time periods
    from: 0 // the previous meta value
  },
  tickers: require('./tickers'),
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
  // userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
}
