const path = require('path');

const {InfluxDB} = require('influx');
const {MongoClient} = require('mongodb');
const {config: loadEnvConfig} = require('dotenv');
const moment = require('moment');

loadEnvConfig({path: path.join(__dirname, '.env')});
main();

async function main() {
  const db = await MongoClient.connect(process.env.MONGO_URL);
  const influx = new InfluxDB({
    host: process.env.INFLUX_HOST,
    database: process.env.INFLUX_DATABASE,
    port: process.env.INFLUX_PORT
  });

  influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('bnc')) {
      return influx.createDatabase('bnc');
    }
  })
  .catch(() => {
    console.error(`Error creating Influx database!`);
  });

  log('Fetching candidate evaluations');
  let count = 0;
  let points = [];

  db.collection('Nominee Evaluations').find().forEach(async e => {
    const tags = {
      status: e.status,
      score: e.score,
      round: e.round
    };
    if (Array.isArray(e.evaluatorName)) {
      tags.evaluatorName = e.evaluatorName[0];
    }
    const timestamp = moment(e.evaluationDate, moment.ISO_8601);
    if (!timestamp.isValid()) {
      console.error('Invalid timestamp', timestamp);
    }
    const point = {
      tags,
      fields: {
        value: 1
      },
      timestamp: timestamp.toDate()
    };
    points.push(point);

    if (++count === 2000) {
      log('Flushing measurements in batch');
      await influx.writeMeasurement('nominee_evaluations', points).catch(err => {
        console.error(`Encountered error while writing measurements: ${err.message}`);
        console.error('Note that metrics have still been written to the DB');
      });
      count = 0;
      points = [];
    }
  }, async err => {
    if (err) {
      throw err;
    }
    // Handle leftovers
    if (points.length > 0) {
      log('Flushing remaining measurements in batch');
      // eslint-disable-next-line promise/no-promise-in-callback
      await influx.writeMeasurement('nominee_evaluations', points).catch(err => {
        console.error(`Encountered error while writing measurements: ${err.message}`);
        console.error('Note that metrics have still been written to the DB');
      });
    }
    log('Done');
    db.close();
  });
}

function log(...args) {
  console.log('[bnc-metrics]', ...args);
}
