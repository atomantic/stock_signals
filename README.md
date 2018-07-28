> NOTICE: I am not a financial or trading advisor. This tool comes without any warrenty or assurances. None of the stock tickers listed or the results found within this codebase indicate a recommendation to buy or sell assets. Use at your own risk.

# Technical Signal Caching Engine

I use this project to get signals from TradingView, cache them on myjson, and ingest them into a Google Sheets to alert me of whether I should buy or sell particular holdings (based on whether my current position in those assets is underwater or in profit).

My general strategy is this:

- If the 1 Day Summary says `Buy`
    - If my cost-basis is lower than current price: `buy`
    - if my cost-basis is higher than the current price, `buy` only at regular intervals (1 share per week/month/etc), else `hold` if I've already bought recently
- If the 1 Day Summary says `Sell`
    - If my cost-basis is lower than current price: `hold`
    - if my cost-basis is higher than the current price: `sell`
- Neutral = `hold`
- `Strong Sell` and `Strong Buy` signals just increase the color coding darkness in the Google Sheet, which informs me of the quanitity I might wish to buy.

I might post the Google Sheets template logic later...

# Local Setup
```
# run setup
npm run setup
```
this will:
* ensure casper/phantom are installed globally via `npm i -g phantomjs-prebuilt casperjs`

## Local Run
```
npm start
```

## Get Trading Indicators for a Single Ticker
```
TICKER=NASDAQ-AMZN casperjs test --fail-fast lib/technicals.js
```

## Deploy
```
now deploy --public --docker
```

## Keeping now.sh alive
now.sh will expire a container if it isn't being hit regularly
hit it by leaving a running job like this:
```
watch -n 60 curl https://tradingviewrunner-atqvfxzfec.now.sh/service-status
```