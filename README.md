# Dashboard

**Overall Project Status**: :construction: Under active development

## Installation

### Prerequisites

You will need:

1. NodeJS v7+. We also recommend installing the [yarn package
   manager](https://yarnpkg.com) by running `[sudo] npm i -g yarn`.
2. Vagrant
3. The URL to the mongodb backup used to seed influxdb (please ask
   @traviskaufman or @brockoffdev for this).

### Installing

1. Clone the repo
2. Run `MONGODB_BZIP_URL=<URL to mongodb backup> make bootstrap`

This will initialize a vagrant machine which contains mongo, grafana,
and influx and forward all necessary ports.

## Development

Use your local machine to code / develop. The home dir is synced to
`/vagrant` within the host machine should you need to `vagrant ssh` in
and access it for any reason.

### Initial Grafana Setup

For now, you'll have to manually configure the datasource in Grafana during the first run. We hope to automate this
in the future. On your first login to Grafana, click "Add Data Source" when prompted, select InfluxDB, make sure the `host`
is set to `http://localhost:8086` and the Database is set to `bnc`. You should then be able to use the data source.
