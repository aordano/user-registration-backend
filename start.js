#!/usr/bin/env node

/**
 * Module dependencies.
 */

const app = require('./build/app').app;
// const debug = require('debug')('contact-form:server');
const http = require('http');

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */

const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

const onListening = () => {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  // debug('Listening on ' + bind);
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(9898);
server.on('error', onError);
server.on('listening', onListening);