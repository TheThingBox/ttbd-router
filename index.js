module.exports = function(app, router, folder, RED, settings) {
    var fs = require("fs");
    var path = require("path");
    var toReturn = null;

    var packagePath = path.join(router, "package.json")
    if (fs.existsSync(packagePath)) {
        var package = require(packagePath)
        if (package.hasOwnProperty("routes") && Array.isArray(package.routes)) {
            for (var route in package.routes) {
                if (typeof package.routes[route] === "object" && package.routes[route].hasOwnProperty("file")) {
                    var file = package.routes[route].file;
                    var name = package.routes[route].name || file;
                    var routePath = path.join(router, file)
                    RED.log.info("Express route loading : '" + name + "' from " + routePath);
                    try {
                        var routeToAdd = require(routePath);
                        res = new routeToAdd(app, folder, RED, settings);
                        if (res) {
                            RED.log.info("Express route added   : '" + name + "' from " + routePath);
                        } else {
                            RED.log.error("Cannot load the express route '" + name + "' from " + routePath + " : " + err);
                        }
                    } catch (e) {
                        RED.log.error("Cannot load '" + name + "' from " + routePath + " : " + e);
                    }
                } else {
                    RED.log.error("Object " + package.routes[route] + " as element n" + route + " from 'routes' array in " + packagePath)
                }
            }
    		toReturn = packagePath.routes
        }
    }

    return toReturn;
}