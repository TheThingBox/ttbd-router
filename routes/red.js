module.exports = function add(app, dir, RED, settings_nodered) {
    function basicAuthMiddleware(user, pass) {
        var basicAuth = require('basic-auth');
        var crypto = require("crypto");
        try { bcrypt = require('bcrypt'); }
        catch(e) { bcrypt = require('bcryptjs'); }

        var checkPassword;
        var localCachedPassword;
        if (pass.length == "32") {
            // Assume its a legacy md5 password
            checkPassword = function(p) {
                return crypto.createHash('md5').update(p, 'utf8').digest('hex') === pass;
            }
        } else {
            checkPassword = function(p) {
                return bcrypt.compareSync(p, pass);
            }
        }

        var checkPasswordAndCache = function(p) {
            // For BasicAuth routes we know the password cannot change without
            // a restart of Node-RED. This means we can cache the provided crypted
            // version to save recalculating each time.
            if (localCachedPassword === p) {
                return true;
            }
            var result = checkPassword(p);
            if (result) {
                localCachedPassword = p;
            }
            return result;
        }

        return function(req, res, next) {
            if (req.method === 'OPTIONS') {
                return next();
            }
            var requestUser = basicAuth(req);
            if (!requestUser || requestUser.name !== user || !checkPasswordAndCache(requestUser.pass)) {
                res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
                return res.sendStatus(401);
            }
            next();
        }
    }

    if (settings_nodered.httpAdminRoot !== false && settings_nodered.httpAdminAuth) {
        RED.log.warn(RED.log._("server.httpadminauth-deprecated"));
        app.use(settings_nodered.httpAdminRoot, basicAuthMiddleware(settings_nodered.httpAdminAuth.user, settings_nodered.httpAdminAuth.pass));
    }

    if (settings_nodered.httpAdminRoot !== false) {
        app.use(settings_nodered.httpAdminRoot, RED.httpAdmin);
    }
    if (settings_nodered.httpNodeRoot !== false && settings_nodered.httpNodeAuth) {
        app.use(settings_nodered.httpNodeRoot, basicAuthMiddleware(settings_nodered.httpNodeAuth.user, settings_nodered.httpNodeAuth.pass));
    }
    if (settings_nodered.httpNodeRoot !== false) {
        app.use(settings_nodered.httpNodeRoot, RED.httpNode);
    }

    if (settings_nodered.httpStatic) {
        settings_nodered.httpStaticAuth = settings_nodered.httpStaticAuth || settings_nodered.httpAuth;
        if (settings_nodered.httpStaticAuth) {
            app.use("/", basicAuthMiddleware(settings_nodered.httpStaticAuth.user, settings_nodered.httpStaticAuth.pass));
        }
        app.use("/", express.static(settings_nodered.httpStatic));
    }
    return true;
}