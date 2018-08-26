module.exports = {
  maps: require('./maps'),
  tickerSchema: {
    ma: [
      [
        []// Hull MA (numeric signal: -2,-1,0,1,2)
      ], // 4 hour
      [[]], // daily
      [[]], // weekly
      [[]] // monthly
    ],
    osc: [
      [ // 4 hour
        [],// Relative Strength Index (14)
        [],// Stochastic RSI Fast (3, 3, 14, 14)
        [],// Stochastic %K (14, 3, 3)
        [],// Ultimate Oscillator (7, 14, 28)
        [] // MACD Level (12, 27) (numeric signal: -2,-1,0,1,2)
      ],
      [[],[],[],[]],
      [[],[],[],[]],
      [[],[],[],[]]
    ],
    change: 0,
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
  skip: require('./skip'),
  tickers: require('./tickers'),
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
  // userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
}
