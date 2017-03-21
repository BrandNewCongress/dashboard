const {InfluxDB} = require('influx');
const {MongoClient} = require('mongodb');

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
  .catch(err => {
    console.error(`Error creating Influx database!`);
  })

  log('Fetching candidate evaluations');
  let count = 0;
  let points = [];

  db.collection('Nominee Evaluations').find().forEach(e => {
    const tags = {
      status: e.status,
      score: e.score,
      round: e.round
    };
    if (Array.isArray(e.evaluatorName)) {
      tags.evaluatorName = e.evaluatorName[0];
    }
    const point = {
      tags,
      fields: {
        count: 1
      },
      timestamp: new Date(e.evaluationDate)
    };
    points.push(point);

    if (++count === 200) {
      influx.writeMeasurement('nominee_evaluations', points).catch(err => {
        console.error(`Encountered error while writing measurements: ${err.message}`);
        console.error('Note that metrics have still been written to the DB');
      });
      count = 0;
      points = [];
    }
  }, () => {
    db.close();
  });
}

function log(...args) {
  console.log('[bnc-metrics]', ...args);
}
