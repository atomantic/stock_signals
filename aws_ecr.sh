
AWS_PROFILE=adam
APP_NAME=tradingview_signals
AWS_ACCOUNT_ID=$(aws sts get-caller-identity|jq -r ".Account")
REGION=us-west-2
$(aws ecr get-login --no-include-email --region $REGION)
docker build -t $APP_NAME .
docker tag $APP_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$APP_NAME:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$APP_NAME:latest