import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors()); // allow your frontend origin

const TOKEN = 'YOUR_CLASH_ROYALE_API_TOKEN_HERE';

app.get('/api/cards', async (req, res) => {
  try {
    const response = await fetch('https://api.clashroyale.com/v1/cards', {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

app.listen(3001, () => console.log('Proxy running on port 3001'));