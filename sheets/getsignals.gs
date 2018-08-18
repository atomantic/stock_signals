/*
 * on page load, we will grab the cached signal results
 * we use a myjson backup in case the now.sh instance goes down (power down to low hit activity)
 */
var cache = CacheService.getUserCache();
//var cache = CacheService.getScriptCache();
//var cache = CacheService.getDocumentCache();
var results = JSON.parse(cache.get('results')||'{}');
var resultsArray = resultsToArray();
var time = cache.get('time');
var fetchCounter = 0;

function resultsToArray(){
  var reverseValues = {
    '-2': 'Strong Sell',
    '-1': 'Sell',
    '0': 'Neutral',
    '1': 'Buy',
    '2': 'Strong Buy'
 };
 // map results to an array
  var res = [];
  for(t in results){
    res.push([
      t,
      Math.round(results[t].meta - results[t].from),
      reverseValues[results[t].meta],
      reverseValues[results[t].sum[0]], // 4 hour
      reverseValues[results[t].sum[1]], // 1 day
      reverseValues[results[t].sum[2]], // 1 week
      reverseValues[results[t].sum[3]], // 1 month
      dateToHuman(results[t].time)
    ]);
  }
  // alphebetize elements by ticker suffix
  // (e.g. NASDAQ-EKSO sorts in E, by EKSO)
  res.sort(function(a, b){
    var keyA = a[0].split('-')[1],
        keyB = b[0].split('-')[1];
    if(keyA < keyB) return -1;
    if(keyA > keyB) return 1;
    return 0;
  });

  return res;
}
function fillCache(force){
  if (!force && time && time > (new Date().getTime()) - 600000) {
    return time;
  }
  fetchCounter++;
  var url = 'https://api.myjson.com/bins/1eh1ls';
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
  resultsArray = resultsToArray();
  //GET_SIGNALS_ARRAY(); // retrigger for reflow
  time = payload.time;
  // cache for 10 minutes
  cache.put("time", payload.time, 600);
  cache.put("last", payload.last, 600);
  cache.put("results", JSON.stringify(payload.tickers), 600);
  return time;
}
fillCache()

function dateToHuman(timestamp){
  var d = new Date(timestamp);
  return (d.getMonth()+1)+'/'+(d.getDate()+1)+' '+d.toLocaleTimeString()
}

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
 * @return {object} ticker object
 */
function getTickerObj(ticker){
  if(isEmptyObject(results)){
    // see if it was updated after open
    results = JSON.parse(cache.get('results')||'{}');
  }
  if(results[ticker]){
    return results[ticker];
  }
  // now fuzz test the ticker for a match
  var markets = ['AMEX','ASX','NASDAQ','NYSE','TSX'];
  for(var i=0; i<markets.length; i++){
    var key = markets[i]+'-'+ticker;
    if(results[key]){
      return results[key];
    }
  }
  throw('ticker not found: '+ticker);
}

/**
 * get the trading signals for a period
 * @param {string} ticker, the ticker symbol (either in format `NASDAQ-NVDA` or `NVDA`)
 * @param {string} period, the time period for the signals (e.g. `day`, `week`)
 * @return {object} period signal (e.g. {"Oscillators":"Buy", "Summary":"Buy", "Moving Averages":"Neutral"})
 */
function getSignals(ticker, period){
  return getTickerObj(ticker)[period] || {};
}

// SHEETS API

function GET_TICKER_FETCH_COUNTER(){
  return fetchCounter;
}
function RELOAD_TICKERS(){
  Utilities.sleep(600000);
  results = {};
  cache.removeAll(['time','last','results']);
  fillCache();
  return cache.get('time');
}
function GET_LAST_RUN(){
  return dateToHuman(Number(time));
}
function GET_LAST_TICKER(){
  return "Last: "+cache.get("last");
}

// alphabetize ticker list by suffix (to match sheet)
// return an array of cells showing [signal, direction, hour.Summary, day.Summary, week.Summary, month.Summary]
function GET_SIGNALS_ARRAY(){
  if(!resultsArray.length){
    resultsArray = resultsToArray();
  }
  return resultsArray;
}
function GET_RESULTS_LENGTH(){
  return resultsArray.length;
}