'use strict';

console.log('hola from the server');

require('dotenv').config();

const cors = require('cors');
const express = require('express');

const PORT = process.env.PORT;

const app = express();
app.use(cors());

app.get( '/test', (request, response) => {
  const name = request.query.name;
  response.send( `Hello. ${name}`);
});

app.listen( PORT, () => console.log('server is alive on ', PORT));


