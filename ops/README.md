# AWS

Running on an EC2 instance:
```
# https://docs.aws.amazon.com/AmazonECS/latest/developerguide/docker-basics.html
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

git clone https://github.com/atomantic/tradingview_signals.git
cd tradingview_signals
docker build -t tr .
docker run -p 8808:8808 tr
```