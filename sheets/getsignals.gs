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

function getValue(v){
  return (v && typeof v === 'object') ? v[v.length-1] : v
}
function getDirection(v){
  if(!v || typeof v !=='object' || v.length < 2){
    return '-';
  }
  var current = v[v.length - 1]
  var last = v[v.length - 2]
  return current > last ? '📈' : (current===last ? '-' : '📉')
}
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
    var row = []
    row.push(
      t,
      dateToHuman(results[t].time),
      Math.round(results[t].meta - results[t].from),
      reverseValues[results[t].meta],
      reverseValues[results[t].sum[0]], // 4 hour
      reverseValues[results[t].sum[1]], // 1 day
      reverseValues[results[t].sum[2]], // 1 week
      reverseValues[results[t].sum[3]] // 1 month
    );
    // Relative Strength Index (14)
    results[t].osc.forEach(function(o){
      row.push(
        getValue(o[0]),
        getDirection(o[0])
      );
    });
    // Stochastic RSI Fast (3, 3, 14, 14)
    results[t].osc.forEach(function(o){
      row.push(
        getValue(o[1]),
        getDirection(o[1])
      );
    });
    // Stochastic %K (14, 3, 3)
    results[t].osc.forEach(function(o){
      row.push(
        getValue(o[2]),
        getDirection(o[2])
      );
    });
    // Ultimate Oscillator (7, 14, 28)
    results[t].osc.forEach(function(o){
      row.push(
        getValue(o[3]),
        getDirection(o[3])
      );
    });
    // MACD Level (12, 27) - numeric indicator (-2, -1, 0, 1, 2)
    results[t].osc.forEach(function(o){
      row.push(
        getValue(o[4]),
        getDirection(o[4])
      );
    });
    results[t].ma.forEach(function(o){
      row.push(
        getValue(o[0]),
        getDirection(o[0])
      );
    });
    row.push(
      results[t].price,
      results[t].change
    );
    res.push(row);
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
  
  results = payload.tickers;
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
// return an array of cells showing 
// [signal, direction, hour.Summary, day.Summary, week.Summary, month.Summary, h.rsi, h.stoch, h.macd, ...]
function GET_SIGNALS_ARRAY(){
  if(!resultsArray.length){
    resultsArray = resultsToArray();
  }
  return resultsArray;
}
function GET_RESULTS_LENGTH(){
  return resultsArray.length;
}