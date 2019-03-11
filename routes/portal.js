module.exports = function(app, dir, RED, settings_nodered) {
    const { existsSync, statSync, readdirSync, readFileSync } = require('fs')
    const { join } = require('path')
    const express = require('express');
    const InterfaceUtils = require('ttbd-interface-utils')
    const interface_utils = new InterfaceUtils({hydra_exec_host: "mosquitto"})
    const getDirectories = source => readdirSync(source).filter(name => statSync(join(source, name)).isDirectory())
    const i18n = require('../materialize/i18n.min.js')
    var notOrderedCurrent = 99900
    var persistenceDir = settings_nodered.persistenceDir || settings_nodered.userDir || __dirname;
    var wizardViewPath = join(__dirname, '..', 'settings_wizard');
    var langs = {}

    var bodyParser = require('body-parser');

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

    const moduleToLoad = ['ttb-settings-wizard-view-wifi', 'ttb-settings-wizard-view-validation']
    var views = getDirectories(join(__dirname, '..', 'node_modules')).filter(name => moduleToLoad.indexOf(name) !== -1)

    if(views.findIndex(v => v === moduleToLoad[0]) === -1){
      return true;
    }

    views = views.map( name => {
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

    function render_portal(req, res){
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      let lang_key = req.acceptsLanguages('fr-FR', 'en-US')
      if( ['fr-FR', 'fr'].indexOf(lang_key) !== -1){
        lang_key = 'fr-FR'
      } else {
        lang_key = 'en-US'
      }
      if(!langs.hasOwnProperty(lang_key)){
        let lang = readFileSync(join(wizardViewPath, 'locales', lang_key, 'settings_wizard.json'))
        try{
          lang = JSON.parse(lang)
        } catch(e){
          lang = {}
        }
        langs[lang_key] = i18n.create({ values: lang })
      }
      updateViews()

      new Promise( (resolve, reject) => {
        interface_utils.getHostname().then( hostname =>{
          resolve(hostname)
        }).catch( err => {
          resolve(deviceType)
        })
      }).then( hostname => {
        res.render('index', {
          title: title,
          device: deviceType,
          devicePrettyName: prettyName,
          hostname: hostname,
          lang_key: lang_key,
          lang: langs[lang_key],
          views: views
        });
      })
    }

    app.get("/portal", render_portal);

    function redirect_portal(req, res){
      res.redirect(302, 'http://192.168.61.1/portal');
    }

    // captive portal detection : windows
    app.use("/portal", bodyParser.urlencoded({ extended: true }));
    app.use("/ncsi.txt", bodyParser.urlencoded({ extended: true }));
    app.use("/connecttest.txt", bodyParser.urlencoded({ extended: true }));
    app.get("/ncsi.txt ", redirect_portal);
    app.get("/connecttest.txt", redirect_portal);
    app.get("/redirect", render_portal);
    // captive portal detection : android
    app.use("/generate_204", bodyParser.urlencoded({ extended: true }));
    app.get("/generate_204", redirect_portal);
    // captive portal detection : ios
    app.use("/hotspot-detect.html", bodyParser.urlencoded({ extended: true }));
    app.get("/hotspot-detect.html", redirect_portal);

    try {
      var ssid_id = (settings_nodered.functionGlobalContext.settings.id || "ap").slice(-4)
      viewsApi['wifi'].enableAPOnWlan(ssid_id)
    } catch(e){}

    return true;
}
