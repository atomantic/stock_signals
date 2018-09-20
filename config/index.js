module.exports = {
  maps: require('./maps'),
  tickerSchema: {
    ma: [
      [
        []// Hull MA (numeric signal: -2,-1,0,1,2)
      ], // hourly
      [[]], // daily
      [[]], // weekly
      [[]] // monthly
    ],
    osc: [
      [ // hourly
        [],// Relative Strength Index (14)
        [],// Stochastic RSI Fast (3, 3, 14, 14)
        [],// Stochastic %K (14, 3, 3)
        [],// Ultimate Oscillator (7, 14, 28)
        [] // MACD Level (12, 27) (numeric signal: -2,-1,0,1,2)
      ],
      [[],[],[],[],[]],
      [[],[],[],[],[]],
      [[],[],[],[],[]]
    ],
    // tuples for discovering bearish divergence
    // and for confirming bullish continuation
    overbought: {
      cont: [0, 0, 0, 0],  // start 0 to indicate not actively within > 70 RSI ranges
      state: [
        //  [[last_over_70_hourly_RSI, price],[latest_over_70_hourly_RSI, price]]
        [],
        //  [[last_over_70_daily_RSI, price],[latest_over_70_daily_RSI, price]]
        [],
        //  [[last_over_70_weekly_RSI, price],[latest_over_70_weekly_RSI, price]]
        [],
        //  [[last_over_70_monthly_RSI, price],[latest_over_70_monthly_RSI, price]]
        []
      ]
    },
    // ...[last_under_30_daily_RSI, price],[latest_under_30_daily_RSI, price]...
    // tuples for discovering bullish divergence
    // and for confirming bearish continuation
    oversold: {
      cont: [0, 0, 0, 0],  // start 0 to indicate not actively within < 30 RSI ranges
      state: [[],[],[],[]]
    },
    // boolean signal for bearish (-1), bulling (1) divergence
    divergence: [0, 0, 0, 0], // start at 0 to indicate we are not giving a divergent signal
    price: null,
    time: null,
    sum: [
      null, // 4 hour summary signal
      null, // 1 day summary signal
      null, // 1 week summary signal
      null // 1 month summary signal
    ],
    // last changed summary signals
    // so if it went from Neutral->Buy on the 1 day, sum[1] = 1 && prev[1] = 0
    prev: [null,null,null,null],
    meta: null, // the average meta signal from all time periods
    from: null // the previous meta value
  },
  skip: require('./skip'),
  tickers: require('./tickers'),
  //userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
}
