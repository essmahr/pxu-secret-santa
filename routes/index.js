var express = require('express');
var passport = require('passport');
var router = express.Router();
var SlackApi = require('../models/SlackApi');
var db = require('../db');

//------------ Homepage ------------//

router.get('/', function(req, res, next) {
  var bodyClass = req.user ? 'authed' : 'not-authed';
  res.render('index', {bodyClass: bodyClass});
});

//------------ Authentication ------------//

router.get('/auth/slack', passport.authenticate('slack'));

router.get('/auth/slack/callback', passport.authenticate('slack', {failureRedirect: '/'}), function(req, res) {
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
