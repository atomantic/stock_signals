#!/usr/bin/env bash
ALPHA_VANTAGE_API_KEY=$1
ticker=${2:-DIS}
WAIT=65
# echo "wget -O ../data/timeseries/$ticker.daily.price.csv https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=TIME_SERIES_DAILY&outputsize=full"
# exit
# price
wget -O ../data/timeseries/$ticker.daily.price.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=TIME_SERIES_DAILY&outputsize=full';
sleep $WAIT;
# exit
# stoch
wget -O ../data/timeseries/$ticker.daily.STOCH.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=STOCH&interval=daily';
sleep $WAIT;
# stoch RSI
wget -O ../data/timeseries/$ticker.daily.STOCHRSI.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=STOCHRSI&interval=daily&series_type=close&time_period=14';
sleep $WAIT;
# rsi
wget -O ../data/timeseries/$ticker.daily.RSI.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=RSI&interval=daily&time_period=14&series_type=close';
sleep $WAIT;
# sma
wget -O ../data/timeseries/$ticker.daily.SMA.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=SMA&interval=daily&time_period=10&series_type=close';
sleep $WAIT;
# ema
wget -O ../data/timeseries/$ticker.daily.EMA.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=EMA&interval=daily&time_period=10&series_type=close';
sleep $WAIT;
# macd
wget -O ../data/timeseries/$ticker.daily.MACD.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=MACD&interval=daily&time_period=10&series_type=close';
sleep $WAIT;
# adx
wget -O ../data/timeseries/$ticker.daily.ADX.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=ADX&interval=daily&time_period=10';
sleep $WAIT;
# cci: https://www.investopedia.com/investing/timing-trades-with-commodity-channel-index/
wget -O ../data/timeseries/$ticker.daily.CCI.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=CCI&interval=daily&time_period=20';
sleep $WAIT;
# aroon: https://www.investopedia.com/articles/trading/06/aroon.asp
wget -O ../data/timeseries/$ticker.daily.AROON.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=AROON&interval=daily&time_period=20';
sleep $WAIT;
# bbands: http://www.investopedia.com/articles/technical/04/030304.asp
wget -O ../data/timeseries/$ticker.daily.BBANDS.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=BBANDS&interval=daily&time_period=5&series_type=close&nbdevup=3&nbdevdn=3';
sleep $WAIT;
# ad: https://www.investopedia.com/articles/active-trading/031914/understanding-chaikin-oscillator.asp
wget -O ../data/timeseries/$ticker.daily.AD.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=AD&interval=daily';
sleep $WAIT;
# obv: https://www.investopedia.com/articles/technical/100801.asp
wget -O ../data/timeseries/$ticker.daily.OBV.csv 'https://www.alphavantage.co/query?datatype=csv&symbol='$ticker'&apikey='$ALPHA_VANTAGE_API_KEY'&function=OBV&interval=daily';
