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
  return res.redirect(data.url);
});

app.post('/api/shorturl', async(req, res) => {
  const urlPattern = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
  const url = await req.body.url;
  if(!url.match(urlPattern)) {
    return res.json({error: 'invalid url'})
  }
  const data = await database.insertOne({url: url});
  setTimeout(async () => {
    const result = await database.findOne({_id: data.insertedId});
    res.json({ original_url: result.url, short_url: result.urlId });
  },1500);
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
