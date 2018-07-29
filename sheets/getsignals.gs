
/*
 * on page load, we will grab the cached signal results
 * we use a myjson backup in case the now.sh instance goes down (power down to low hit activity)
 */
var cache = CacheService.getUserCache();
var results = JSON.parse(cache.get('results')||'{}')
function onOpen(){
  if (results && results.lastRun > new Date().getTime() - 1800000) {
    return;
  }
  var url = 'https://api.myjson.com/bins/19fs22';
  var response = UrlFetchApp.fetch(url, {
    'method': 'get',
    'muteHttpExceptions': false
  });
  var responseCode = response.getResponseCode();
  if(responseCode!==200){
    throw 'failed to fetch JSON cache data'
  }
  var payload = JSON.parse(response.getContentText())
  // cache for 30 minutes
  cache.put("lastRun", payload.lastRun, 1800);
  cache.put("lastTicker", payload.lastTicker, 1800);
  cache.put("results", JSON.stringify(payload.results), 1800);
}
onOpen()

function isEmptyObject(obj) {
  for(var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }
  return true;
}

/**
 * get the trading signals for a period
 * @param {string} ticker, the ticker symbol (either in format `NASDAQ-NVDA` or `NVDA`)
 * @param {string} period, the time period for the signals (e.g. `day`, `week`)
 * @return {object} signals (e.g. {date:"2018/61/27", Oscillators:"Buy", Summary:"Buy", 'Moving Averages':"Neutral"})
 */
function getSignals(ticker, period){
  if(isEmptyObject(results)){
    results = JSON.parse(cache.get('results')||'{}')
  }
  if(results[ticker]){
    return results[ticker][period] || {} // if an invalid period is given, return an empty object
  }
  // now fuzz test the ticker for a match
  var markets = ['AMEX','ASX','NASDAQ','NYSE','TSX']
  for(var i=0; i<markets.length; i++){
    var key = markets[i]+'-'+ticker
    if(results[key]){
      return results[key][period] || {} // if an invalid period is given, return an empty object
    }
  }
}

// SHEETS API
function GET_LAST_RUN(){
  var d = new Date(Number(cache.get("lastRun")))
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}
function GET_LAST_TICKER(){
  return "Last: "+cache.get("lastTicker")
}

function GET_TICKER_SIGNAL(ticker, period, signal){
  // Google Finance API requires ticker has leading market with a colon
  // e.g. NYSEAMERICAN:BTG
  var subTicker = ticker.split(':')
  if(subTicker.length === 2){
    ticker = subTicker[1]
  }
  var tickerResults = getSignals(ticker, period)
  if(!tickerResults){
    return 'ticker?'
  }
  if(!tickerResults[signal]){
    throw 'no results for signal'
  }
  var signalData = tickerResults[signal]
  if(signal === 'date'){
    dateObj = new Date(signalData);
    signalData = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString()
  }
  return signalData
}