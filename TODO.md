# TODO

1. create a nightly script to grab daily, weekly, and monthly updates from Alpha Vantage (https://www.alphavantage.co/documentation/)
2. use python to evaluate to query how often the price prediction goes up, but the price goes down--and vice-versa
  - If the move is positive, we would expect the price to go up on the next log entry.
  - if the move is negative, we expect the price to go down on the next query
  - remove oldest entry for each ticker (those began with a Neutral rating for all previous signals)
3. get the oscillation wave of the meta indicator and of simple others (RSI/Stoch RSI) to capture the direction of movement.
4. create oscilator for movement (current meta compared to previous meta over time)