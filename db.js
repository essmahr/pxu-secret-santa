var db = require('monk')(process.env.MONGOLAB_URI || process.env.LOCAL_DB_URI);

module.exports = db;
