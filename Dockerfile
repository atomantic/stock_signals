FROM node:8.11.3-alpine

RUN apk update 
RUN apk add python
RUN apk add curl
RUN curl -Ls https://github.com/fgrehm/docker-phantomjs2/releases/download/v2.0.0-20150722/dockerized-phantomjs.tar.gz \
       | tar xz -C /

RUN npm i -g --depth=0 --silent casperjs --unsafe-perm

ENV NPM_CONFIG_LOGLEVEL warn
ENV LOG_LEVEL=info
ENV ABORT_SECONDS=60
ENV PAUSE_SECONDS=5
ENV JSON_CACHE=https://api.myjson.com/bins/1eh1ls
ENV TICKER_SOURCE_FILE=https://raw.githubusercontent.com/atomantic/tradingview_signals/master/config/tickers.js

EXPOSE 8808

RUN mkdir -p /app
COPY package.json /app/
WORKDIR /app
RUN npm i --ignore-scripts

COPY . /app

CMD node .
