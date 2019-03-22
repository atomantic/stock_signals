# TODO

1. create a nightly script to grab daily, weekly, and monthly updates from Alpha Vantage (https://www.alphavantage.co/documentation/)
2. use python to evaluate to query how often the price prediction goes up, but the price goes down--and vice-versa
  - If the move is positive, we would expect the price to go up on the next log entry.
  - if the move is negative, we expect the price to go down on the next query
  - remove oldest entry for each ticker (those began with a Neutral rating for all previous signals)
3. get the oscillation wave of the meta indicator and of simple others (RSI/Stoch RSI) to capture the direction of movement.
4. create oscilator for movement (current meta compared to previous meta over time)
5. log directionality for Hull MA
6. log directionality for price


-------------------------------------------



remove casper and switch to API:

curl 'https://scanner.tradingview.com/america/scan' -H 'Referer: https://www.tradingview.com/symbols/NYSE-CMP/technicals/' -H 'Origin: https://www.tradingview.com' \
-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36' \
-H 'content-type: application/x-www-form-urlencoded' \
--data '{"symbols":{"tickers":["NASDAQ:AAPL","NYSE:CMP"],"query":{"types":[]}},"columns":["Recommend.Other","Recommend.All","Recommend.MA","RSI","RSI[1]","Stoch.K","Stoch.D","Stoch.K[1]","Stoch.D[1]","CCI20","CCI20[1]","ADX","ADX+DI","ADX-DI","ADX+DI[1]","ADX-DI[1]","AO","AO[1]","Mom","Mom[1]","MACD.macd","MACD.signal","Rec.Stoch.RSI","Stoch.RSI.K","Rec.WR","W.R","Rec.BBPower","BBPower","Rec.UO","UO","EMA5","close","SMA5","EMA10","SMA10","EMA20","SMA20","EMA30","SMA30","EMA50","SMA50","EMA100","SMA100","EMA200","SMA200","Rec.Ichimoku","Ichimoku.BLine","Rec.VWMA","VWMA","Rec.HullMA9","HullMA9","Pivot.M.Classic.S3","Pivot.M.Classic.S2","Pivot.M.Classic.S1","Pivot.M.Classic.Middle","Pivot.M.Classic.R1","Pivot.M.Classic.R2","Pivot.M.Classic.R3","Pivot.M.Fibonacci.S3","Pivot.M.Fibonacci.S2","Pivot.M.Fibonacci.S1","Pivot.M.Fibonacci.Middle","Pivot.M.Fibonacci.R1","Pivot.M.Fibonacci.R2","Pivot.M.Fibonacci.R3","Pivot.M.Camarilla.S3","Pivot.M.Camarilla.S2","Pivot.M.Camarilla.S1","Pivot.M.Camarilla.Middle","Pivot.M.Camarilla.R1","Pivot.M.Camarilla.R2","Pivot.M.Camarilla.R3","Pivot.M.Woodie.S3","Pivot.M.Woodie.S2","Pivot.M.Woodie.S1","Pivot.M.Woodie.Middle","Pivot.M.Woodie.R1","Pivot.M.Woodie.R2","Pivot.M.Woodie.R3","Pivot.M.Demark.S1","Pivot.M.Demark.Middle","Pivot.M.Demark.R1"]}' --compressed

=>

{ "data":[{"s":"NASDAQ:AAPL","d":[9.090909e-02,4.4545454e-01,8e-01,7.58055e+01,8.0465355e+01,9.116894e+01,9.204179e+01,9.203438e+01,9.2611374e+01,1.4295009e+02,1.8766661e+02,3.8687897e+01,4.282509e+01,1.0558894e+01,4.5155476e+01,1.1865015e+01,1.3499487e+01,1.2441369e+01,2.049e+01,2.259e+01,5.894e+00,4.6301513e+00,0e+00,8.970068e+01,-1e+00,-1.5218163e+01,0e+00,1.9572853e+01,0e+00,6.2958096e+01,1.9050531e+02,1.934e+02,1.9024e+02,1.868037e+02,1.86257e+02,1.8185481e+02,1.802715e+02,1.785754e+02,1.7715167e+02,1.7572812e+02,1.701762e+02,1.7784157e+02,1.740688e+02,1.8131142e+02,1.90671e+02,0e+00,1.83535e+02,1e+00,1.8155112e+02,-1e+00,1.9362703e+02,1.5177e+02,1.6171e+02,1.6743e+02,1.7165e+02,1.7737e+02,1.8159e+02,1.9153e+02,1.6171e+02,1.6550708e+02,1.6785292e+02,1.7165e+02,1.7544708e+02,1.7779292e+02,1.8159e+02,1.704165e+02,1.7132767e+02,1.7223883e+02,1.7165e+02,1.7406117e+02,1.7497234e+02,1.758835e+02,1.5937e+02,1.6265e+02,1.6931e+02,1.7259e+02,1.7925e+02,1.8253e+02,1.8919e+02,1.6954e+02,1.72705e+02,1.7948e+02]},{"s":"NYSE:CMP","d":[2.7272728e-01,4.030303e-01,5.3333336e-01,5.6929344e+01,6.909372e+01,6.932222e+01,6.466858e+01,6.757808e+01,6.3434124e+01,9.677419e+01,2.373309e+02,1.9135212e+01,3.228801e+01,1.8583256e+01,3.6164875e+01,2.0814571e+01,8.4276026e-01,5.605397e-01,3.75e+00,6.02e+00,6.0225046e-01,4.0145993e-01,0e+00,7.117944e+01,0e+00,-3.7793102e+01,0e+00,3.9427707e+00,0e+00,5.2271767e+01,5.384643e+01,5.41359e+01,5.3626e+01,5.319033e+01,5.2655e+01,5.2712082e+01,5.2545e+01,5.2274864e+01,5.2885334e+01,5.1623524e+01,5.13796e+01,5.2284313e+01,4.92084e+01,5.562036e+01,5.7252e+01,0e+00,5.3235e+01,1e+00,5.281253e+01,-1e+00,5.4664703e+01,3.6088333e+01,4.3833332e+01,4.8106667e+01,5.1578335e+01,5.5851665e+01,5.9323334e+01,6.706834e+01,4.3833332e+01,4.6791924e+01,4.8619743e+01,5.1578335e+01,5.4536922e+01,5.6364742e+01,5.9323334e+01,5.0250126e+01,5.0960083e+01,5.167004e+01,5.1578335e+01,5.308996e+01,5.3799915e+01,5.4509876e+01,4.08425e+01,4.407375e+01,4.85875e+01,5.181875e+01,5.63325e+01,5.956375e+01,6.40775e+01,4.98425e+01,5.244625e+01,5.75875e+01]}],"totalCount":2}%