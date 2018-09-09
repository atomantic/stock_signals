/*
 * on page load, we will grab the cached signal results
 * we use a myjson backup in case the now.sh instance goes down (power down to low hit activity)
 */
var cache = CacheService.getUserCache();
//var cache = CacheService.getScriptCache();
//var cache = CacheService.getDocumentCache();
var results = JSON.parse(cache.get('t1')||cache.get('results')||'{}');
var results2 = JSON.parse(cache.get('t2')||'{}');
for(var t in results2){
  results[t] = results2[t]
}
var resultsArray = resultsToArray();
var time = cache.get('time');
var fetchCounter = 0;

function getValue(v){
  return (v && typeof v === 'object') ? v[v.length-1] : v
}
function getDirection(v){
  if(!v || typeof v !=='object' || v.length < 2){
    return '';
  }
  var current = v[v.length - 1]
  var last = v[v.length - 2]
  return current > last ? '+' : (current===last ? '' : '-')
}
function getStrongOrWeak(v){
  if(!v || typeof v !=='object' || v.length < 2){
    return 0;
  }
  var current = v[v.length - 1]
  var last = v[v.length - 2]
  return current > last ? 1 : (current===last ? 0 : -1)
}
function resultsToArray(){
  var reverseValues = {
    '-2': 'Strong Sell',
    '-1': 'Sell',
    '0': 'Hold',
    '1': 'Buy',
    '2': 'Strong Buy'
 };
 // map results to an array
  var res = [];
  var res_crypto = [];
  for(t in results){
    var row = []
    row.push(
      t,
      dateToHuman(results[t].time),
      Math.round(results[t].meta - results[t].from),
      reverseValues[results[t].meta],
      results[t].sum[0], // 4 hour
      results[t].sum[1], // 1 day
      results[t].sum[2], // 1 week
      results[t].sum[3] // 1 month
    );
    // Relative Strength Index (14)
    results[t].osc.forEach(function(o){
      row.push(
        getValue(o[0]),
        getDirection(o[0])
      );
    });
    // is the RSI weak or strong on the short/long 
    var rsi_short = Math.round((
      // [4h][RSI]
      getStrongOrWeak(results[t].osc[0][0]) +
      // [1d][RSI]
      getStrongOrWeak(results[t].osc[1][0]) 
      )/2);
    var rsi_long = Math.round((
      // [1w][RSI]
      getStrongOrWeak(results[t].osc[2][0]) +
      // [1m][RSI]
      getStrongOrWeak(results[t].osc[3][0]) 
      )/2)
    row.push(
      rsi_short,
      rsi_long,
      // total weakness/Strength
      Math.round((rsi_short+rsi_long)/2)
    );

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
    // strong or week stochastic 
    var stoch_short = Math.round((
      getStrongOrWeak(results[t].osc[0][2]) +
      getStrongOrWeak(results[t].osc[1][2]) 
      )/2);
    var stoch_long = Math.round((
      getStrongOrWeak(results[t].osc[2][2]) +
      getStrongOrWeak(results[t].osc[3][2]) 
      )/2)
    row.push(
      Math.round((stoch_short+stoch_long)/2)
    );
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
      results[t].price
    );
    row = row.concat(
      results[t].divergence
    );
    // debugging divergence logic (temp)
    row = row.concat(
      results[t].oversold.cont
    );
    results[t].oversold.state.forEach(function(o){
      if(o.length===0){
        row.push('','','','')
      }
      if(o.length===1){
        row.push('','',o[0][0],o[0][1])
      }
      if(o.length===2){
        row.push(o[0][0],o[0][1],o[1][0],o[1][1])
      }
    });
    row = row.concat(
      results[t].overbought.cont
    );
    results[t].overbought.state.forEach(function(o){
      if(o.length===0){
        row.push('','','','')
      }
      if(o.length===1){
        row.push('','',o[0][0],o[0][1])
      }
      if(o.length===2){
        row.push(o[0][0],o[0][1],o[1][0],o[1][1])
      }
    });
    if(row[0].indexOf('crypto:')!==-1){
      res_crypto.push(row);
    }else{
      res.push(row);
    }
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
  // sort crypto by full ticker (e.g. BTC-USD)
  res_crypto.sort(function(a, b){
    var keyA = a[0].split(':')[1],
        keyB = b[0].split(':')[1];
    if(keyA < keyB) return -1;
    if(keyA > keyB) return 1;
    return 0;
  });

  return res.concat(res_crypto);
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
  // split tickers in 2 (too big to store in a single cache key)
  var count = 0
  var t1 = {}
  var t2 = {}
  for(var t in payload.tickers){
    if(count < 50){
      t1[t] = payload.tickers[t]
    }else{
      t2[t] = payload.tickers[t]
    }
    count++
  }
  cache.put("t1", JSON.stringify(t1), 600);
  cache.put("t2", JSON.stringify(t2), 600);
  return time;
}
fillCache()

function dateToHuman(timestamp){
  var d = new Date(timestamp);
  return (d.getMonth()+1)+'/'+d.getDate()+' '+d.toLocaleTimeString()
}

// SHEETS API

function GET_TICKER_FETCH_COUNTER(){
  return fetchCounter;
}
function RELOAD_TICKERS(){
  Utilities.sleep(60000);
  results = {};
  cache.removeAll(['time','last','results', 't1','t2']);
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