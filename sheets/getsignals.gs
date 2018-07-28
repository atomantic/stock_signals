
/*
 * on page load, we will grab the cached signal results
 */
var url = 'https://api.myjson.com/bins/19fs22';
var response = UrlFetchApp.fetch(url, {
  'method': 'get',
  'muteHttpExceptions': false
});
var cache = JSON.parse(response.getContentText());

/**
 * get the trading signals for a period
 * @param {string} ticker, the ticker symbol (either in format `NASDAQ-NVDA` or `NVDA`)
 * @param {string} period, the time period for the signals (e.g. `day`, `week`)
 * @return {object} signals (e.g. {date:"2018/61/27", Oscillators:"Buy", Summary:"Buy", 'Moving Averages':"Neutral"})
 */
function getSignals(ticker, period){
  if(cache[ticker]){
    return cache[ticker][period] || {} // if an invalid period is given, return an empty object
  }
  // now fuzz test the ticker for a match
  var markets = ['AMEX','ASX','NASDAQ','NYSE']
}