const express = require('express');
const netApi = require('net-browserify');
const compression = require('compression');
const cors = require('cors');

const app = express();
const port = Number(process.env.PORT || 10000);
const timeout = Number(process.env.TIMEOUT || 10000);

app.use(compression());
app.use(cors());
app.use(netApi({ allowOrigin: '*', log: process.env.LOG === 'true', timeout }));

app.get('/', (_req, res) => res.json({
  ok: true,
  service: 'mainmet Minecraft Web Client proxy',
  target: `${process.env.MC_HOST || 'ArMaCraftnet.aternos.me'}:${process.env.MC_PORT || '60107'}`
}));
app.get('/health', (_req, res) => res.status(200).send('ok'));

app.listen(port, () => {
  console.log(`mainmet Minecraft browser proxy listening on ${port}`);
  console.log(`TCP target: ${process.env.MC_HOST || 'ArMaCraftnet.aternos.me'}:${process.env.MC_PORT || '60107'}`);
});
