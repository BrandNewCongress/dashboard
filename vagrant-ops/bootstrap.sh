#!/usr/bin/env bash

set -e

printf "Checking for proper node version..."
if ! node --version | grep -q "v7"; then
	echo "FAILURE: Node either not found or unsupported version used"
	echo "Please re-run script after installing the latest version of NodeJS at https://nodejs.org/en/download/current/"
	exit 1
fi
echo "ok"

printf "Checking for vagrant installation..."
if ! which vagrant > /dev/null; then
	echo "FAILURE: Could not find vagrant installation"
	echo "Please re-run script after installing vagrant by following the instructions at https://www.vagrantup.com/docs/installation/"
	exit 1
fi
echo "ok"

printf "Checking that "'$MONGODB_BZIP_URL'" is set..."
if [ -z "$MONGODB_BZIP_URL" ]; then
	echo "FAILURE: Could not find mongodb bzip url env variable"
	echo "Please rerun script with env variable 'MONGODB_BZIP_URL' set."
	exit 1
fi	
echo "ok"

echo "Downloading mongodb zip to proper location"
MONGODB_FILE='bnc-mongo.bson.bz2'
curl -L $MONGODB_BZIP_URL > scripts/$MONGODB_FILE

echo "Setting up Vagrant"
if ! vagrant up; then
	echo "Cleaning up..."
	vagrant destroy -f
	exit 1
fi

echo "Installing scripts dependencies"
CMD='npm install'
if which yarn > /dev/null; then
	CMD='yarn install'
fi
if ! (cd scripts && $CMD); then
	echo "Cleaning up..."
	rm -fr scripts/node_modules
	exit 1
fi

echo "Running initial load script for data from Mongo -> Influx"
MONGO_URL='mongodb://localhost/heroku_6ljxc24f' INFLUX_HOST=localhost INFLUX_PORT=8086 INFLUX_DATABASE=bnc node ./scripts/script.js

echo "You're all set! Opening localhost:3000 to drop you into the grafana dashboard"
sleep 1
open http://localhost:3000
