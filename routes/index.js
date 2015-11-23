var express = require('express');
var passport = require('passport');
var router = express.Router();
var SlackApi = require('../models/SlackApi');

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/auth/slack', passport.authenticate('slack'));

router.get('/auth/slack/callback', passport.authenticate('slack', {failureRedirect: '/login'}), function(req, res) {
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// WIP admin view to dictate which users are a part
router.get('/settings', function(req, res) {
  console.log(req.user);
  var slack = new SlackApi(req.user.accessToken);
  slack.getUsers(function(err, users) {
    if (users) {
      res.render('settings', {users: users});
    } else {
      res.json(err);
    }
  });
});

module.exports = router;
