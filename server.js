const axios = require('axios');
const express = require('express');
const path = require('path');

const PARSE_APP_ID = 'PT5etrzSWIMulTzgbT7jmL7nkt6sa4tdeXgkHJQZ';
const PARSE_REST_KEY = '1NZ4ZGOHphuZxRiC1h48XblSv9I7X7VgWhiky0lO';
const PARSE_SERVER_URL = 'https://parseapi.back4app.com';

const app = express();
const port = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

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
      return res.status(404).render('error', {
        title: 'Invalid Invite',
        message: 'This invite link is invalid or has expired.'
      });
    }

    const space = results[0];
    
    // Pass additional space data if available
    res.render('join-space', {
      spaceName: space.name,
      spaceDescription: space.description || null,
      memberCount: space.memberCount || 0,
      ownerName: space.ownerName || 'Space Admin',
      inviteToken: token,
      spaceType: space.type || 'private'
    });
  } catch (err) {
    console.error('Error fetching space:', err.message);
    console.error('Full error response:', err.response?.data || err.message);
    
    res.status(500).render('error', {
      title: 'Something went wrong',
      message: 'We couldn\'t load this invite. Please try again later.'
    });
  }
});

// Root route (status message)
app.get('/', (req, res) => {
  res.send('Zovia Invite Server is running on invite.zovia.studio');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Zovia web server running at http://localhost:${port}`);
});