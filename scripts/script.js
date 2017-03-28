const {InfluxDB} = require('influx');
const monk = require('monk')
const moment = require('moment');

try {
  main();
} catch (err) {
  console.log(err)
}

async function main() {
  const db = monk(process.env.MONGO_URL);

  const influx = new InfluxDB({
    host: process.env.INFLUX_HOST,
    database: process.env.INFLUX_DATABASE,
    port: process.env.INFLUX_PORT
  });

  influx.dropDatabase('bnc');

  const names = await influx.getDatabaseNames()
  if (!names.includes('bnc')) {
    log('Creating bnc db in influx')
    await influx.createDatabase('bnc');
  } else {
    log('Have bnc db in influx')
  }

  log('Fetching candidate evaluations');
  let count = 0;
  let points = [];

  const evaluations = await db.get('Nominee Evaluations').find();

  log('Fetching nominees of those evaluations');
  const nominees = await db.get('People').find();

  const districtDocs = await db.get('Congressional Districts').find();
  const districts = {};
  districtDocs.forEach(cd => districts[cd.id] = cd);

  let left = evaluations.length
  for (let e of evaluations) {
    const {moveToNextRound, score, round, districtScore} = e;
    const evaluatorName = e.evaluatorName && e.evaluatorName[0];
    const tags = {moveToNextRound, score, round, evaluatorName, districtScore};

    const timestamp = moment(e.evaluationDate, moment.ISO_8601);
    if (!timestamp.isValid()) {
      console.error('Invalid timestamp', timestamp);
    }

    const nominee = nominees.filter(n => n.evaluations && n.evaluations.includes(e.id))[0]

    if (nominee) {
      const {gender, race, source} = nominee;
      Object.assign(tags, {gender, race, source});

      const district = districts[nominee.district && nominee.district[0]];
    }

    Object.keys(tags).forEach(t => {
      if (!tags[t])
        delete tags[t]
    })

    const point = {
      tags,
      fields: {
        count: 1
      },
      timestamp: timestamp.toDate()
    };

    try {
      await influx.writeMeasurement('nominee_evaluations', [point]);
    } catch (err) {
      console.error(`Encountered error while writing measurements: ${err.message}`);
      console.error('Note that metrics have still been written to the DB');
    }

    console.log(`${left} left`);
    left--;
  }
}

function log(...args) {
  console.log('[bnc-metrics]', ...args);
}
