require('dotenv').config({ path:'.development.env'});
const NODE_ENV = process.env.NODE_ENV || 'development';
const Aplicacion = require('./src/Applicacion');

const app = new Aplicacion();
app.startServer();