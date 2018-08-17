# Results

`results.json` is a snapshot of the latest runs for each ticker. It is only the most recent run without historical context. This is used by the Google Sheet to determine the current state.

# Signals Files

Additionally, we save every single hit to a rolling log file, which we can use for backtesting strategies, and to see if the current signal is either moving up or down (direction is important). We use the last known state to know if the signal is either retreating or moving forward.

The rolling logs are capped at 100MB and are saved as minimal csv files using numeric indicators to create smaller files. The indicator legend is as follows:

- `Strong Buy` = 2
- `Buy` = 1
- `Neutral` = 0
- `Sell` = -1
- `Strong Sell` = -2