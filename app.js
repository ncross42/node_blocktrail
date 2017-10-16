const conf = require('config');
const fs = require('fs');

const express = require('express');
const app = express();

const logger = require('morgan');
app.use(logger('short', {stream: fs.createWriteStream(conf.access_log, {flags: 'a'})}))
app.use(logger('short'));

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// var cookieParser = require('cookie-parser');
// NOT USED : app.use(cookieParser());
// var path = require('path');
// NOT USED : app.use(express.static(path.join(__dirname, 'public')));

var index = require('./routes/index');
app.use('/', index);
//var users = require('./routes/users');
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.end('error');
});

module.exports = app;
