#!/bin/sh

cd ..
# deploy latest
now deploy --public --docker
# map custom DNS to new deployment
now alias $(pbpaste) signals
# remove oldest deployment
now rm -y $(now ls tradingview_runner | grep tradingview | tail -n1 | awk '{print $2}')