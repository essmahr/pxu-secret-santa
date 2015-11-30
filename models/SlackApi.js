var https = require('https');
var querystring = require('querystring');
var _ = require('lodash');

function slackApi(token) {
  this.token = token;
}

slackApi.prototype.post = function(method, params, cb) {
  params['token'] = this.token;

  var post_data = querystring.stringify(params);

  var options = {
    hostname: 'slack.com',
    method: 'POST',
    path: '/api/' + method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };

  var req = https.request(options);

  req.on('response', function(res) {
    var buffer;
    buffer = '';

    res.on('data', function(chunk) {
      return buffer += chunk;
    });

    return res.on('end', function() {
      var value;
      if (cb != null) {
        if (res.statusCode === 200) {
          value = JSON.parse(buffer);
          return cb(value);
        } else {
          return cb({
            'ok': false,
            'error': 'API response: ' + res.statusCode
          });
        }
      }
    });
  });

  req.on('error', function(error) {
    if (cb != null) {
      return cb({
        'ok': false,
        'error': error.errno
      });
    }
  });

  req.write(post_data);
  return req.end();
};

slackApi.prototype.sendMessage = function(messageData, callback) {
  messageData['username'] = "Secret Santa";
  messageData['icon_emoji'] = ":santa:";


  this.post('chat.postMessage', messageData, function(response) {
    return callback(response);
  })
}

slackApi.prototype.getUsers = function(callback) {
  this.post('users.list', {presence: false}, function(response) {
    if (response.ok) {
      return callback(null, response.members);
    } else {
      return callback(response, null)
    }
  })
}

slackApi.prototype.getUserByID = function(userId, callback) {
  this.post('users.info', {user: userId}, function(response) {
    if (response.ok) {
      return callback(response.user);
    } else {
      return callback('error');
    }
  })
}

slackApi.prototype.sendDeclineMsg = function(targetUser, subjectUser, callback) {
  var _this = this;
  var messageData = {
    as_user: false,
    channel: '@' + targetUser.name,
    text: 'Hi! Sorry to interrupt, but it looks like ' + subjectUser.first_name + ' decided not to participate in the secret santa this year. Please visit <http://santa.pixelunion.net|santa.pixelunion.net> to be assigned a new person.'
  }
  _this.sendMessage(messageData, function(resp) {
    return callback(resp);
  });
}

module.exports = slackApi;
