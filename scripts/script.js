const {InfluxDB} = require('influx');
const {MongoClient} = require('mongodb');

main();

async function main() {
  const db = await MongoClient.connect('mongodb://localhost/bnc');
  const influx = new InfluxDB({host: 'localhost', database: 'bnc'});

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
      timestamp: e.evaluationDate
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
