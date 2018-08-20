# TODO

1. get RSI/Stoch RSI and Ultimate Osc from Alpha Vantage: e.g. https://www.alphavantage.co/query?function=STOCHRSI&symbol=MSFT&interval=daily&time_period=10&series_type=close&fastkperiod=6&fastdmatype=1&apikey=demo
2. use python to evaluate to query how often the price prediction goes up, but the price goes down--and vice-versa
  - If the move is positive, we would expect the price to go up on the next log entry.
  - if the move is negative, we expect the price to go down on the next query
  - remove oldest entry for each ticker (those began with a Neutral rating for all previous signals)
