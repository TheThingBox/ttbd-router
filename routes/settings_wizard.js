module.exports = function(app, dir, RED, settings_nodered) {
  const { existsSync, statSync, readdirSync, readFileSync } = require('fs')
  const { join } = require('path')
  const express = require('express');
  const bodyParser = require('body-parser');
  const InterfaceUtils = require('ttbd-interface-utils')
  const interface_utils = new InterfaceUtils({hydra_exec_host: "mosquitto"})
  const getDirectories = source => readdirSync(source).filter(name => statSync(join(source, name)).isDirectory())
  const i18n = require('../materialize/i18n.min.js')
  var notOrderedCurrent = 99900
  var persistenceDir = settings_nodered.persistenceDir || settings_nodered.userDir || __dirname;
  var wizardViewPath = join(__dirname, '..', 'settings_wizard');

  var cguPassed = false
  var langs = {}

  var promisesReachable = [interface_utils.ZOIB.reachable(), interface_utils.Coldfacts.reachable()]
  var promiseInterfaces = interface_utils.getInterfaces()

  const deviceTypeList = ['timesquair', 'thethingbox']
  var deviceType = require(join(dir, 'package.json'))

  if(deviceType && deviceType.name){
    deviceType = deviceType.name.toLowerCase()
  }

  if(deviceTypeList.indexOf(deviceType) === -1) {
    deviceType = deviceTypeList[0]
  }

  function capitalizeFirstLetter(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const prettyName = deviceType==deviceTypeList[0]?'TimeSquAir':(deviceType==deviceTypeList[1])?'TheThingBox':capitalizeFirstLetter(deviceType)

  app.set('views', wizardViewPath);
  app.set('view engine', 'ejs');

  var title = `${prettyName}`
  var viewsApi = {}

  const moduleToIgnore = ['showall', 'account']
  var views = getDirectories(join(__dirname, '..', 'node_modules')).filter(name => name.indexOf('ttb-settings-wizard-view-') === 0).map( name => {
    let _name = name.substr(25)
    let _dir = join(__dirname, '..', 'node_modules', name)
    let _ejsPath = join(_dir, `${_name}.ejs`)

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
    if(existsSync(_ejsPath) !== true){
      return null
    }
    return {
      api: _api,
      name: _name,
      order: `${_order}`,
      canIgnore: _canIgnore,
      dir: _dir,
      ejs: _ejs
    }
  }).filter(e => e && moduleToIgnore.indexOf(e.name) == -1).sort( (a, b) => {
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
    })
    .then( hostname => {
      promiseInterfaces.then(interfaces =>{
        let _views = views.slice()
        if(!interfaces || interfaces.findIndex(item => item.name === 'wlan0') == -1){
          _views = _views.filter(item => item.name !== 'wifi')
        }
        res.render('index', {
          title: title,
          device: deviceType,
          devicePrettyName: prettyName,
          hostname: hostname,
          lang_key: lang_key,
          lang: langs[lang_key],
          views: _views
        });
      })
    })
  }

  app.get("/settings_wizard", render_wizard);

  app.get("/settings_wizard/api", function(req, res){
    res.json(Object.keys(viewsApi))
  });

  app.get("/settings_wizard/alive", function(req, res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json({ message: 'OK'})
  })

  app.get("/settings_wizard/css", function(req, res){
    res.sendFile(join(wizardViewPath, 'wizard.css'));
  })
  app.get("/settings_wizard/js", function(req, res){
    res.sendFile(join(wizardViewPath, 'wizard.js'));
  })

  app.get("/settings_wizard/reachable", function(req, res){
    Promise.all(promisesReachable).then(function(values) {
      res.json({zoib: values[0], coldfacts: values[1]})
    })
  })

  app.get("/settings_wizard/interfaces", function(req, res){
    promiseInterfaces.then(function(values) {
      res.json(values)
    })
  })

  app.use('/settings_wizard/locales', express.static(join(wizardViewPath, 'locales')))

  app.post("/settings_wizard/reboot", function(req, res){
    res.json({ message: 'OK'})
    setTimeout( () => {
      interface_utils.rebootDevice()
    }, 1000)
  })

  app.post("/settings_wizard/restart", function(req, res){
    res.json({ message: 'OK'})
    setTimeout( () => {
      interface_utils.restartNodered()
    }, 1000)
  })

  app.post("/settings_wizard/shutdown", function(req, res){
    res.json({ message: 'OK'})
    setTimeout( () => {
      interface_utils.shutdownDevice()
    }, 1000)
  })

  function isCGUReaded() {
    var readed = true
    if(viewsApi.hasOwnProperty('cgu')){
      readed = viewsApi.cgu.getStats().readed
    }
    return readed
  }

  app.all("/", function(req, res, next) {
    if(settings_nodered.httpNodeRoot != "/" && (req.path.indexOf(`${settings_nodered.httpNodeRoot}settings_wizard/`) == 0 || req.path.indexOf(`${settings_nodered.httpNodeRoot}materialize/`) == 0)) {
      return next();
    } else {
      if(isCGUReaded()) {
        return next();
      } else {
        res.redirect('/settings_wizard');
      }
    }
  })

  function redirect_portal(req, res){
    res.redirect(302, 'http://192.168.61.1/settings_wizard');
  }

  app.use("/portal", bodyParser.urlencoded({ extended: true }));
  app.get("/portal", redirect_portal);

  // captive portal detection : windows
  app.use("/ncsi.txt", bodyParser.urlencoded({ extended: true }));
  app.use("/connecttest.txt", bodyParser.urlencoded({ extended: true }));
  app.use("/redirect", bodyParser.urlencoded({ extended: true }));
  app.get("/ncsi.txt ", redirect_portal);
  app.get("/connecttest.txt", redirect_portal);
  app.get("/redirect", redirect_portal);
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

}
