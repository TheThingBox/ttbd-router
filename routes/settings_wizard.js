module.exports = function(app, dir, RED, settings_nodered) {
  const { existsSync, statSync, readdirSync, readFileSync } = require('fs')
  const { join } = require('path')
  const express = require('express');
  const exec = require('ttbd-exec');
  const exec_opt = {hydra_exec_host: "mosquitto"}
  const getDirectories = source => readdirSync(source).filter(name => statSync(join(source, name)).isDirectory())
  var notOrderedCurrent = 99900
  var persistenceDir = settings_nodered.persistenceDir || settings_nodered.userDir || __dirname;
  var wizardViewPath = join(__dirname, '..', 'settings_wizard');

  var cguPassed = false

  const deviceTypeList = ['timesquair', 'thethingbox']
  var deviceType = require(join(dir, 'package.json'))

  if(deviceType && deviceType.name){
    deviceType = deviceType.name.toLowerCase()
  }

  if(deviceTypeList.indexOf(deviceType) === -1) {
    deviceType = deviceTypeList[0]
  }

  const prettyName = deviceType==deviceTypeList[0]?'TimeSquAir':(deviceType==deviceTypeList[1])?'TheThingBox':deviceType

  app.set('views', wizardViewPath);
  app.set('view engine', 'ejs');

  function getHostname(callback){
    exec('cat /etc/hostname', exec_opt, function(err, stdout, stderr){
      if(err){
        console.log('hostname');
        console.log(err);
        console.log(stdout);
        console.log(stderr);
      }
      if(typeof callback === "function"){
        callback(err, stdout.replace(/[\r\n\t\f\v]/g, "").trim().replace(/[ ]+/g,"_"));
      }
    });
  }

  var title = `${prettyName} : Settings Wizard`
  var viewsApi = {}

  const moduleToIgnore = ['ttb-settings-wizard-view-wifi']
  var views = getDirectories(join(__dirname, '..', 'node_modules')).filter(name => name.indexOf('ttb-settings-wizard-view-') === 0).filter(name => moduleToIgnore.indexOf(name) === -1).map( name => {
    let _name = name.substr(25)
    let _dir = join(__dirname, '..', 'node_modules', name)
    let _ejsPath = join(_dir, `${_name}.ejs`)
    if(existsSync(_ejsPath) !== true){
      return null
    }
    app.use(`/settings_wizard/${_name}`, express.static(_dir))

    let _ejs = `/settings_wizard/${_name}/${_name}.ejs`
    var _indexApi = join(_dir, 'api.js')
    var _api = null
    let _order = null
    let _canIgnore = false
    if(existsSync(_indexApi)){
      _api = `/settings_wizard/api/${_name}`
      viewsApi[_name] = require(_indexApi)
      viewsApi[_name].init(app, _api, persistenceDir)
      _order = viewsApi[_name].order
      _canIgnore = viewsApi[_name].canIgnore || false
    }

    if(!_order && _order !== 0){
      _order = `${notOrderedCurrent}`
      notOrderedCurrent = notOrderedCurrent+1
    }
    return {
      api: _api,
      name: _name,
      order: `${_order}`,
      canIgnore: _canIgnore,
      dir: _dir,
      ejs: _ejs
    }
  }).filter(e => e).sort( (a, b) => {
    if(a.order > b.order){
      return 1;
    }
    if(a.order < b.order){
      return -1;
    }
    return 0;
  })

  const updateViews = function(){
    for(v in views){
      views[v].stats = {
        initialized: true,
        status: 'nok',
        validateAction: 'none'
      }
      if(viewsApi[views[v].name]){
        viewsApi[views[v].name].syncStats()
        var _originalStats = viewsApi[views[v].name].getStats()
        Object.assign(views[v].stats, _originalStats)
      }
      views[v].readable = false
      if(v == 0 || views[v-1].stats.status !== 'nok'){
        views[v].readable = true
      }
    }
  }

  updateViews()

  function render_wizard(req, res){
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      let lang = req.acceptsLanguages('fr-FR', 'en-US')
      if( ['fr-FR', 'fr'].indexOf(lang) !== -1){
        lang = 'fr'
      } else {
        lang = 'en'
      }
      updateViews()
      getHostname( (err_hostname, hostname) => {
        res.render('index', {
          title: title,
          device: deviceType,
          devicePrettyName: prettyName,
          hostname: (err_hostname)?null:hostname,
          lang: lang,
          views: views
        });
      });
  }

  app.get("/settings_wizard", render_wizard);

  app.get("/settings_wizard/css", function(req, res){
    res.sendFile(join(wizardViewPath, 'wizard.css'));
  })
  app.get("/settings_wizard/js", function(req, res){
    res.sendFile(join(wizardViewPath, 'wizard.js'));
  })


  // function isCGUReaded() {
  //     var sets = fs.readFileSync('/root/persistence/settings.json', 'utf8');
  //     try {
  //         sets = JSON.parse(sets);
  //     } catch (e) {};
  //
  //     if ((sets.CGUReaded === "true" || sets.CGUReaded === true) && ((sets.AccountCreated === "true" || sets.AccountCreated === true) || (sets.AccountLater === "true" || sets.AccountLater === true))) {
  //         return true;
  //     } else {
  //         return false;
  //     }
  // }
  //
  // app.all("/", function(req, res, next) {
  //     if (settings_nodered.httpNodeRoot != "/" &&
  //         req.path.indexOf(settings_nodered.httpNodeRoot) == 0 &&
  //         req.path != settings_nodered.httpNodeRoot + "form/settings") {
  //         return next();
  //     } else {
  //         if (isCGUReaded()) {
  //             return next();
  //         } else {
  //             res.redirect('/cgu');
  //         }
  //     }
  // });

}
