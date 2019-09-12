module.exports = {
  linreg_periods: {
    '60min': 100,
    'daily': 100,
    'weekly': 50
  }, // how many periods linear regression will examine
  maps: require('./maps'),
  historic_intervals: ['60min', 'daily', 'weekly'],
  periods: [
    '60', // 1 hour
    '1D', // 1 day
    '1W',
    '1M'
  ],
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
        [],// MACD Level (12, 27) (numeric signal: -2,-1,0,1,2)
        [] // Commodity Channel Index (20)
      ],
      [[],[],[],[],[],[]],
      [[],[],[],[],[],[]],
      [[],[],[],[],[],[]]
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
    historics: [ // calculations mapped to periods
      {
        mad: null, // median absolute deviation
        max: null,
        mean: null,
        median: null,
        min: null,
        std: null,
        variance: null
      }, // hourly
      {}, // daily
      {} // weekly
    ], 
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
    from: null, // the previous meta value
    nextDiv: null, // next dividend date (from yahoo)
    nextEarn: null, // next earnings date (yahoo)
    div_ex: null, // next ex-dividend date (dividata)
    div_rec: null,
    div_pay: null // next ex-dividend payment amount (dividata)
  },
  // swaps calculate using RSI, CCI on daily only
  swapSchema: { 
    cci: [],
    rsi: []
  },
  skip: require('./skip'),
  tickers: require('./tickers'),
  // for casper
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:65.0) Gecko/20100101 Firefox/65.0'
}
