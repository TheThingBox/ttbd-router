module.exports = function(app, dir, RED, settings_nodered) {
  var fs = require("fs");
  var path = require("path");
  var express = require('express');

  app.use('/materialize', express.static(path.join(__dirname, '..', 'materialize')))

}
