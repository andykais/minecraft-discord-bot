#!/bin/bash

# startup commands
apt-get update
apt-get upgrade

# deno dependencies
apt-get install unzip
curl -fsSL https://deno.land/x/install/install.sh | sh

# minecraft server dependencies
apt install openjdk-21-jre-headless screen
ufw allow 25565 # allow the default minecraft port 25565 to be accessed
