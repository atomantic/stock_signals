FROM node:8.11.3

RUN npm i -g --depth=0 --silent phantomjs-prebuilt casperjs --unsafe-perm

ENV NPM_CONFIG_LOGLEVEL warn
ENV LOG_LEVEL=info
ENV WAITTIME=60000

EXPOSE 8808

RUN mkdir -p /app
COPY package.json /app/
WORKDIR /app
RUN npm i --ignore-scripts

COPY . /app

RUN chown -R node:node /app

USER node

CMD node .