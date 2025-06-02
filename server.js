const axios = require('axios');

const PARSE_APP_ID = 'PT5etrzSWIMulTzgbT7jmL7nkt6sa4tdeXgkHJQZ';
const PARSE_REST_KEY = '1NZ4ZGOHphuZxRiC1h48XblSv9I7X7VgWhiky0lO';
const PARSE_SERVER_URL = 'https://parseapi.back4app.com'; // or your self-hosted URL

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Route for join links
app.get('/join/:token', async (req, res) => {
  const { token } = req.params;

  try {
    console.log('Received invite token:', token);
    // Query Parse for the space using inviteToken
    const response = await axios.get(`${PARSE_SERVER_URL}/classes/ZUserGroup`, {
      headers: {
        'X-Parse-Application-Id': PARSE_APP_ID,
        'X-Parse-REST-API-Key': PARSE_REST_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        where: JSON.stringify({ inviteToken: token }),
        limit: 1
      }
    });

    const results = response.data.results;
    if (!results || results.length === 0) {
      return res.status(404).send('Invalid invite link');
    }

    const space = results[0];
    res.render('join-space', {
      spaceName: space.name,
      inviteToken: token
    });
  } catch (err) {
    console.error('Error fetching space:', err.message);
    console.error('Full error response:', err.response?.data || err.message);
    res.status(500).send('Something went wrong');
  }
});

// Root route (redirect to Framer homepage)
app.get('/', (req, res) => {
  res.redirect('https://www.zovia.studio');
});

app.listen(port, () => {
  console.log(`Zovia web server running at http://localhost:${port}`);
});