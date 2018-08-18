# General
For all logs and db files, the following legend maps TradingView Summary Signal status to numeric values:

- `Strong Buy` = 2
- `Buy` = 1
- `Neutral` = 0
- `Sell` = -1
- `Strong Sell` = -2

# Results

`latest.json` is a snapshot of the latest runs for each ticker. It is only the most recent run without historical context. This is used by the Google Sheet to determine the current state. This set maintains the last different state each summary was in:
```javascript
{
    "tickers": {
      "NASDAQ-EKSO": {
        "time": 1534543886445, // unix timestamp
        "sum": [-2,1,2,1], // summary values for periods (4 hour, 1 day, 1 week, 1 month)
        "prev": [-1,0,1,0], // last different values in those windows
        "meta": -2, // current meta summary signal accross time periods
        "from": -1 // last different summary
      }
    },
    "time": 1534549230684,
    "last": "NYSE-BAC"
  }
```

# Signals Files

Additionally, we save every single hit to a rolling log file, which we can use for backtesting strategies, and to see if the current signal is either moving up or down (direction is important). We use the last known state to know if the signal is either retreating or moving forward.

The rolling logs are capped at 100MB and are saved as minimal csv files using numeric indicators to create smaller files.

The column headers for the files are the following:

```
ticker  price   time    meta_signal    previous_meta
4_hour_summary  1_day_summary   1_week_summary  1_month_summary
4_hour_summary_from  1_day_summary_from   1_week_summary_from  1_month_summary_from
```


# Cleaning Errors

Remove 0 price records:
```
\w+-\w+,0,15[\d,-]+\n
```