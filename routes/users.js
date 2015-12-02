var express = require('express');
var router = express.Router();
var db = require('../db');
var isAuthenticated = require('../isAuthenticated');


/**
 * list all users in DB, for debugging
 */
router.get('/list', isAuthenticated, function(req, res) {
  var userCollection = db.get('users');

  userCollection.find({}, function(err, users){
    res.json(users);
  });
})

module.exports = router;
