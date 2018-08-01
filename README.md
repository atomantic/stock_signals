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
- `Strong Sell` and `Strong Buy` signals just increase the color coding darkness in the Google Sheet, which informs me of the quanitity I might wish to buy. I might sell half on a `Sell` and sell all on a `Strong Sell`.

Additionally, these indicators are still only prompting suggestions that require human evaluation. I consider other factors such as insider trading (e.g. insiders buying a bunch of stock in a mining company: https://www.secform4.com/insider-trading/1600470.htm) before making a decision.

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
TICKER=NASDAQ-AAPL SNAPSHOT_ENABLED=1 casperjs test --fail-fast --verbose --web-security=no --ignore-ssl-errors=true --load-images=false lib/technicals.js
```

## Deploy
```
wget https://github.com/fgrehm/docker-phantomjs2/releases/download/v2.0.0-20150722/dockerized-phantomjs.tar.gz
./deploy
```

## Keeping now.sh alive
now.sh will expire a container if it isn't being hit regularly
hit it by leaving a running job like this:
```
watch -n 120 curl https://signals.now.sh/
```