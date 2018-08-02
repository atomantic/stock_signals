/*
 * on page load, we will grab the cached signal results
 * we use a myjson backup in case the now.sh instance goes down (power down to low hit activity)
 */
var cache = CacheService.getUserCache();
//var cache = CacheService.getScriptCache();
//var cache = CacheService.getDocumentCache();
var results = JSON.parse(cache.get('results')||'{}')
var fetchCounter = 0;
function fillCache(){
  var lastRun = cache.get('lastRun');
  if (lastRun) {
    return lastRun;
  }
  fetchCounter++;
  var url = 'https://api.myjson.com/bins/19fs22';
  var response = UrlFetchApp.fetch(url, {
    'method': 'get',
    'muteHttpExceptions': false
  });
  var responseCode = response.getResponseCode();
  if(responseCode!==200){
    throw 'failed to fetch JSON cache data'
  }
  var payload = JSON.parse(response.getContentText());
  
  results = payload.results;
  // cache for 15 minutes
  cache.put("lastRun", payload.lastRun, 900);
  cache.put("lastTicker", payload.lastTicker, 900);
  cache.put("results", JSON.stringify(payload.results), 900);
  return lastRun;
}
fillCache()

function isEmptyObject(obj) {
  for(var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }
  return true;
}

/**
 * get a ticker's results object
 * @param {string} ticker, the ticker symbol (either in format `NASDAQ-NVDA` or `NVDA`)
 * @return {object} ticker (e.g. {
 * "updated":"1533083031228",
 * "signal": "Buy", 
 * "hours": {"Oscillators":"Buy", "Summary":"Buy", "Moving Averages":"Neutral"}
 * "day": {"Oscillators":"Buy", "Summary":"Buy", "Moving Averages":"Neutral"}
 * "week": {"Oscillators":"Buy", "Summary":"Buy", "Moving Averages":"Neutral"}
 * }
 * )
 */
function getTickerObj(ticker){
  if(isEmptyObject(results)){
    // see if it was updated after open
    results = JSON.parse(cache.get('results')||'{}')
  }
  if(results[ticker]){
    return results[ticker];
  }
  // now fuzz test the ticker for a match
  var markets = ['AMEX','ASX','NASDAQ','NYSE','TSX']
  for(var i=0; i<markets.length; i++){
    var key = markets[i]+'-'+ticker
    if(results[key]){
      return results[key]
    }
  }
  throw('ticker not found: '+ticker)
}

/**
 * get the trading signals for a period
 * @param {string} ticker, the ticker symbol (either in format `NASDAQ-NVDA` or `NVDA`)
 * @param {string} period, the time period for the signals (e.g. `day`, `week`)
 * @return {object} period signal (e.g. {"Oscillators":"Buy", "Summary":"Buy", "Moving Averages":"Neutral"})
 */
function getSignals(ticker, period){
  return getTickerObj(ticker)[period] || {}
}

function ticker2Sub(ticker){
  // Google Finance API requires ticker has leading market with a colon
  // e.g. NYSEAMERICAN:BTG
  var subTicker = ticker.split(':')
  if(subTicker.length === 2){
    ticker = subTicker[1]
  }
  return ticker;
}

// SHEETS API

function GET_TICKER_FETCH_COUNTER(){
  return fetchCounter;
}
function RELOAD_TICKERS(){
  Utilities.sleep(600000);
  results = {};
  cache.removeAll(['lastRun','lastTicker','results']);
  fillCache();
  return cache.get('lastRun');
}
function GET_LAST_RUN(){
  var d = new Date(Number(cache.get("lastRun")))
  return d.toLocaleString()
}
function GET_LAST_TICKER(){
  return "Last: "+cache.get("lastTicker")
}

function GET_TICKER_SIGNAL(ticker, period, signal){
  ticker = ticker2Sub(ticker);
  var tickerResults = getSignals(ticker, period)
  if(!tickerResults){
    return 'ticker?'
  }
  if(!tickerResults[signal]){
    throw 'no results for signal'
  }
  return tickerResults[signal]
}

function GET_TICKER_UPDATE(ticker){
  ticker = ticker2Sub(ticker);
  var tickerObj = getTickerObj(ticker);
  var updatedDate = tickerObj['updated']||(tickerObj.day?tickerObj.day.date:false)
  if(!updatedDate){
    throw 'not found'+ticker
  }
  return (new Date(updatedDate)).toLocaleString()
}

function GET_TICKER_META_SIGNAL(ticker){
  ticker = ticker2Sub(ticker);
  var tickerObj = getTickerObj(ticker);
  return tickerObj['signal'];
}