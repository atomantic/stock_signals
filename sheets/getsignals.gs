/*
 * on page load, we will grab the cached signal results from github
 */
var cache = CacheService.getUserCache();
//var cache = CacheService.getScriptCache();
//var cache = CacheService.getDocumentCache();
// cache is split into multiple keys to beat the cache value limit size
var results = JSON.parse(cache.get('t1')||cache.get('results')||'{}');
var results2 = JSON.parse(cache.get('t2')||'{}');
// swaps are stored in another key
var swaps = JSON.parse(cache.get('swaps')||'{}');
for(var t in results2){
  results[t] = results2[t]
}
var resultsArray = resultsToArray();
var swapsArray = swapsToArray();
var time = cache.get('time');
var fetchCounter = 0;

function getWorkingDays(startDate, endDate){
  var result = 0;
  var currentDate = startDate;
  while (currentDate <= endDate)  {  
    var weekDay = currentDate.getDay();
    if(weekDay !== 0 && weekDay !== 6) result++;
    currentDate.setDate(currentDate.getDate()+1); 
  }
  return result;
}
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
 var normalize = function(num){
    if(num < 0){
        if(num > -0.5) return '-1'
        return '-2'
    }
    if(num > 0){
        if(num < 0.5) return '1'
        return '2'
    }
    return '0'
 }
 // map results to an array
  var res = [];
  var res_crypto = [];
  for(t in results){
    var row = [];
    var r = results[t];
    row.push(
      r.price,
      t,
      dateToHuman(r.time),
      // next dividend date
      r.nextDiv,
      // days to next dividend
      r.nextDiv ? getWorkingDays(new Date(), new Date(r.nextDiv)) : '',
      // next earnings date
      r.nextEarn,
      // days to next earnings
      r.nextEarn ? getWorkingDays(new Date(), new Date(r.nextDiv)) : '',
      Math.round(r.meta - r.from),
      reverseValues[normalize(r.meta)],
      Number(normalize(r.sum[0])), // hourly
      Number(normalize(r.sum[1])), // daily
      Number(normalize(r.sum[2])), // weekly
      Number(normalize(r.sum[3])) // monthly
    );
    // Relative Strength Index (14)
    r.osc.forEach(function(o){
      row.push(
        getValue(o[0]),
        getDirection(o[0])
      );
    });
    // is the RSI weak or strong on the short/long 
    var rsi_short = Math.round((
      // [h][RSI]
      getStrongOrWeak(r.osc[0][0]) +
      // [d][RSI]
      getStrongOrWeak(r.osc[1][0]) 
      )/2);
    var rsi_long = Math.round((
      // [w][RSI]
      getStrongOrWeak(r.osc[2][0]) +
      // [m][RSI]
      getStrongOrWeak(r.osc[3][0]) 
      )/2)
    row.push(
      rsi_short,
      rsi_long,
      // total weakness/Strength
      Math.round((rsi_short+rsi_long)/2)
    );

    // Stochastic RSI Fast (3, 3, 14, 14)
    r.osc.forEach(function(o){
      row.push(
        getValue(o[1]),
        getDirection(o[1])
      );
    });
    // Stochastic %K (14, 3, 3)
    r.osc.forEach(function(o){
      row.push(
        getValue(o[2]),
        getDirection(o[2])
      );
    });
    // strong or week stochastic 
    var stoch_short = Math.round((
      getStrongOrWeak(r.osc[0][2]) +
      getStrongOrWeak(r.osc[1][2]) 
      )/2);
    var stoch_long = Math.round((
      getStrongOrWeak(r.osc[2][2]) +
      getStrongOrWeak(r.osc[3][2]) 
      )/2)
    row.push(
      Math.round((stoch_short+stoch_long)/2)
    );
    // Ultimate Oscillator (7, 14, 28)
    r.osc.forEach(function(o){
      row.push(
        getValue(o[3]),
        getDirection(o[3])
      );
    });
    // MACD Level (12, 27) - numeric indicator (-2, -1, 0, 1, 2)
    r.osc.forEach(function(o){
      row.push(
        getValue(o[4]),
        getDirection(o[4])
      );
    });
    // CCI (20)
    r.osc.forEach(function(o){
      if(o[5]){
        row.push(
          getValue(o[5]),
          getDirection(o[5])
        );
      }else{
        row.push(
         '',
         ''
        );
      }
    });
    r.ma.forEach(function(o){
      row.push(
        getValue(o[0]),
        getDirection(o[0])
      );
    });
    row = row.concat(
      r.divergence
    );
    r.oversold.state.forEach(function(o){
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
    r.overbought.state.forEach(function(o){
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
    if(row[1].indexOf('crypto:')!==-1){
      res_crypto.push(row);
    }else{
      res.push(row);
    }
  }
  // alphebetize elements by ticker suffix
  // (e.g. NASDAQ-EKSO sorts in E, by EKSO)
  res.sort(function(a, b){
    var keyA = a[1].split('-')[1],
        keyB = b[1].split('-')[1];
    if(keyA < keyB) return -1;
    if(keyA > keyB) return 1;
    return 0;
  });
  // sort crypto by full ticker (e.g. BTC-USD)
  res_crypto.sort(function(a, b){
    var keyA = a[1].split(':')[1],
        keyB = b[1].split(':')[1];
    if(keyA < keyB) return -1;
    if(keyA > keyB) return 1;
    return 0;
  });

  return res.concat(res_crypto);
}

function swapsToArray(){
 // map swaps to an array
  arr = []
  for(t in swaps){
    var row = []
    row.push(t);
    swaps[t].rsi.forEach(function(o){row.push(o)});
    row.push(swaps[t].rsi[0] > swaps[t].rsi[1] ? 1 : -1);
    swaps[t].cci.forEach(function(o){row.push(o)});
    row.push(swaps[t].cci[0] > swaps[t].cci[1] ? 1 : -1);
    if(swaps[t].avg){
      swaps[t].avg.forEach(function(o){row.push(o)});
    }else{
      row.push('','','')
    }
    arr.push(row)
  }
  return arr;
}
function fillCache(force){
  if (!force && time && time > (new Date().getTime()) - 600000) {
    return time;
  }
  fetchCounter++;
  var url = 'https://raw.githubusercontent.com/atomantic/stock_signals/master/data/latest.json';
  var response = UrlFetchApp.fetch(url, {
    'method': 'get',
    'muteHttpExceptions': false
  });
  var responseCode = response.getResponseCode();
  if(responseCode!==200){
    throw 'failed to fetch JSON cache data'
  }
  var payload = JSON.parse(response.getContentText());
  
  results = {};
  swaps = {};
  for(var key in payload.tickers){
    if(key.indexOf('swap:')!==-1){
      swaps[key.replace('swap:','')] = payload.tickers[key]
    }else{
      results[key] = payload.tickers[key]
    }
  }
  resultsArray = resultsToArray();
  swapsToArray();
  //GET_SIGNALS_ARRAY(); // retrigger for reflow
  time = payload.time;
  // cache for 10 minutes
  cache.put("time", payload.time, 600);
  cache.put("last", payload.last, 600);
  // split tickers in 2 (too big to store in a single cache key)
  var count = 0
  var t1 = {}
  var t2 = {}
  for(var t in results){
    if(count < 50){
      t1[t] = results[t]
    }else{
      t2[t] = results[t]
    }
    count++
  }
  cache.put("t1", JSON.stringify(t1), 600);
  cache.put("t2", JSON.stringify(t2), 600);
  cache.put("swaps", JSON.stringify(swaps), 600);
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
function GET_SWAPS_ARRAY(){
  if(!swapsArray.length){
    swapsArray = swapsToArray();
  }
  return swapsArray;
}
function GET_RESULTS_LENGTH(){
  return resultsArray.length;
}