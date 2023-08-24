const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
const { parseString } = require('xml2js');

const port = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/fetch-xml', async (req, res) => {
  const xmlUrl = req.query.xmlUrl;

  if (!xmlUrl) {
    return res.status(400).send('XML URL is required.');
  }

  try {
    const response = await axios.get(xmlUrl);
    const xmlString = response.data;

    parseString(xmlString, (err, result) => {
      if (err) {
        console.error('Error parsing XML:', err);
        return res.status(500).send('Error parsing XML data.');
      }

      const fixtures = result.betgenius.fixtures[0].fixture;

      const data = fixtures.map(fixtureElement => {
        const mediaItem = fixtureElement.media[0].mediaitem[0];

        return {
          source: fixtureElement.$.source,
          name: fixtureElement.$.name,
          startTime: fixtureElement.$.startTime,
          sport: fixtureElement.$.sport,
          context: fixtureElement.$.context,
          rtmpID: mediaItem.$.name,
          rtmpURL: mediaItem.$.url,
        };
      });

      res.json(data);
    });
  } catch (error) {
    console.error('Error fetching XML:', error);
    res.status(500).send('Error fetching XML data.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
