var express = require('express');
var passport = require('passport');
var router = express.Router();
var SlackApi = require('../models/SlackApi');
var db = require('../db');

//------------ Homepage ------------//

router.get('/', function(req, res, next) {
  var bodyClass = req.user ? 'authed' : 'not-authed';
  res.render('index', {
    bodyClass: bodyClass,
    message: req.flash('error')
  });
});

//------------ Authentication ------------//

router.get('/auth/slack', passport.authenticate('slack'));

router.get('/auth/slack/callback', passport.authenticate('slack', {
    failureRedirect: '/',
    failureFlash : true
  }), function(req, res) {
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

//------------ Making decisions ------------//

router.get('/accept', function(req, res) {
  var userCollection = db.get('users');

  userCollection.findAndModify({
    query: { _id: req.user._id },
    update: { $set: { optedIn: true } }
  },
  function(err, user) {
    if (err) console.log(err);

    res.render('accept');
  });
});

module.exports = router;
