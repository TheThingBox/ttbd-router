module.exports = function(app, dir, RED, settings_nodered) {
    var fs = require("fs");
    var path = require("path");
    var bodyParser = require('body-parser');
    var express = require("express");
    
    let dataPath = path.join(dir, 'views', 'welcome.json')
        
    if(fs.existsSync(path.join(dir, 'views', 'welcome.ejs')) === false){
        return false
    }

    function isWelcomeEnable() {
        var sets = fs.readFileSync('/root/persistence/settings.json', 'utf8');
        try {
            sets = JSON.parse(sets);
        } catch (e) {};

        if (sets.welcome === "true" || sets.welcome === true) {
            return true;
        } else {
            return false;
        }
    }

    app.set('views', path.join(dir, 'views'));
    app.set('view engine', 'ejs');

    app.use("/welcome", bodyParser.urlencoded({ extended: true }));

    app.all("/", function(req, res, next) {
        if (settings_nodered.httpNodeRoot != "/" &&
            req.path.indexOf(settings_nodered.httpNodeRoot) == 0 &&
            req.path != settings_nodered.httpNodeRoot + "form/settings") {
            return next();
        } else {
            if (!isWelcomeEnable()) {
                return next();
            } else {
                res.redirect('/welcome');
            }
        }
    });

    app.get("/welcome",
        function(req, res, next) {
            if (!isWelcomeEnable()) {
                res.redirect("/")
            } else {
                next();
            }
        },
        function(req, res) {
            let data = {}
            if(fs.existsSync(dataPath) === true){
                data = fs.readFileSync(dataPath, 'utf8');
                try {
                    data = JSON.parse(data);
                } catch (e) { data = {} };
            }
            res.render('welcome', data);
        }
    );

    app.post("/welcome",
        function(req, res) {
            res.redirect('/');
        }
    );

    return true;
}
