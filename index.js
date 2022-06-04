require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json()); 

app.use(bodyParser.urlencoded({ extended: true })); 
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env['DB_URL']
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
let database;

async function main() {
  await client.connect();
  console.log('Connected successfully to server');
  const db = await client.db("FCCP");
  const collection = await db.collection('urlShortener');

  return collection;
}

main()
  .then(res => database = res)
  .catch(console.error);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/shorturl/:id',async function(req, res) {
  const id = await Number(req.params.id);
  const data = await database.findOne({urlId: id});
  res.json({ original_url: data.url, short_url: data.urlId });
});

app.post('/api/shorturl', async(req, res) => {
  const url = await req.body.url;
  const data = await database.insertOne({url: url});
  setTimeout(async () => {
    const result = await database.findOne({_id: data.insertedId});
    res.json({ original_url: result.url, short_url: result.urlId });
  },1500);
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
