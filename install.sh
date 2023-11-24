#!/bin/bash


set -e
set -x

# startup commands
apt update -y
apt upgrade -y

# deno dependencies
apt-get install unzip
curl -fsSL https://deno.land/x/install/install.sh | sh

# minecraft server dependencies
apt install git-lfs openjdk-21-jre-headless screen -y
ufw allow 25565 # allow the default minecraft port 25565 to be accessed
