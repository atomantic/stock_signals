#!/usr/local/bin/python

import pandas as pd
import os

files = os.listdir('./')
csv_files = [f for f in files if "0.csv" in f]

frame = pd.DataFrame()
list_ = []
for file_ in csv_files:
    df = pd.read_csv(file_,index_col=None, header=None)
    list_.append(df)
frame = pd.concat(list_)
frame.columns = ["ticker", "price", "time", 
                "meta_signal", "meta_previous",
                "4h","1d","1w","1m",
                "4hp","1dp","1wp","1mp"]
frame.sort_values(['ticker', 'time'], inplace=True)

# split ticker into market-name
frame['market'], frame['name'] = frame.ticker.str.split('-', 1).str
frame.head(2)

frame.sort_values(['name', 'time'], inplace=True)
frame.head(10)

frame = frame.dropna()

frame = frame[frame.price!=0]

# remove duplicates
df = frame.drop_duplicates(["ticker", "price", 
                "meta_signal", "meta_previous",
                "4h","1d","1w","1m",
                "4hp","1dp","1wp","1mp"])

# test that we have expected number of unique tickers (at least one entry for each)
# currently, we have 159 tickers
print("unique tickers: {} ".format(df.ticker.nunique()))

# add meta movement indicator
df['meta_move'] = df['meta_signal'].values - df['meta_previous'].values

# round to 3 decimals (python tweaks the numbers)
df.price = df.price.round(3)

# export new, cleaned db file
df.to_csv('./signals.csv', header=None, index=None)