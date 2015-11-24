'use strict';

require('dotenv').load();

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var SlackStrategy = require('passport-slack').Strategy;
var cookieSession = require('cookie-session');
// var favicon = require('serve-favicon');

var db = require('./db');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// auth setup
app.set('trust proxy', 1); // trust first proxy

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// passport config
passport.use(new SlackStrategy({
    clientID: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scope: ['channels:read', 'users:read'],
    callbackURL: '/auth/slack/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    var users = db.get('users');

    // find or create user
    // TODO: error handling
    users.findOne({
      query: {
        slackId: profile.id
      },
      update: {
        $set: {
          accessToken: accessToken
        }
      }
    },
    function(err, user) {
      if (user) {
        console.log('this user already exists! Logging in.');
        return done(err, user);
      } else {
        users.insert({
          slackId: profile.id,
          accessToken: accessToken
        },
        function(err, user) {
          if (err) console.log(err);
          console.log('this user is new! Logging in.');
          return done(err, user);
        });
      }
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  db.get('users').findById(user._id, function (err, user) {
    done(err, user);
  });
});

// attach user var to every request so we can access it in the templates
app.use(function(req, res, next){
  // console.log(req.user);
  res.locals.user = req.user;
  next();
});

// set up routes
app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var port = process.env.PORT;

app.listen(port);

console.log("Listening on port " + port);
