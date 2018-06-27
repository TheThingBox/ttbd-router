module.exports = function(app, dir, RED, settings_nodered) {
    var fs = require("fs");
    var path = require("path");
    var bodyParser = require('body-parser');
    var express = require("express");

    if(fs.existsSync(path.join(dir, 'views', 'cgu.ejs')) === false){
        return false
    }

    function isCGUReaded() {
        var sets = fs.readFileSync('/root/persistence/settings.json', 'utf8');
        try {
            sets = JSON.parse(sets);
        } catch (e) {};

        if ((sets.CGUReaded === "true" || sets.CGUReaded === true) && ((sets.AccountCreated === "true" || sets.AccountCreated === true) || (sets.AccountLater === "true" || sets.AccountLater === true))) {
            return true;
        } else {
            return false;
        }
    }

    app.set('views', path.join(dir, 'views'));
    app.set('view engine', 'ejs');

    app.use("/cgu", bodyParser.urlencoded({ extended: true }));

    app.all("/", function(req, res, next) {
        if (settings_nodered.httpNodeRoot != "/" &&
            req.path.indexOf(settings_nodered.httpNodeRoot) == 0 &&
            req.path != settings_nodered.httpNodeRoot + "form/settings") {
            return next();
        } else {
            if (isCGUReaded()) {
                return next();
            } else {
                res.redirect('/cgu');
            }
        }
    });

    app.get("/cgu",
        function(req, res, next) {
            if (isCGUReaded()) {
                res.redirect("/")
            } else {
                next();
            }
        },
        function(req, res) {
            res.render('cgu');
        }
    );

    app.post("/cgu",
        function(req, res) {
            res.redirect('/');
        }
    );

    return true;
}
