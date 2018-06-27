module.exports = function(app, dir, RED, settings_nodered) {
    var path = require("path");
    var favicon = require('serve-favicon');

    app.use(favicon(path.join(dir, "node_modules", "node-red", "public", "favicon.ico")));
    return true;
}
