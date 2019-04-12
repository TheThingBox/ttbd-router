var VIEW = function() {
  var VIEW = function() {
    this.type= 'view'
    this.tab_id = `tab_${this.type}`
    this.navtab_id = `navtab_${this.type}`
    this.index = null
    this.params = {}
    this.form = {}
  }

  VIEW.prototype.isOk = function() {
    return true
  }

  VIEW.prototype.enabled = function() {
    if(this.type==='view'){ return }

    if(this.params.order && this.isOk() === true){
      this.enableNextView()
    }
  }

  VIEW.prototype.checkButtonNextStats = function() {
    if(this.type==='view'){ return }

    var _nextDiv = document.getElementById(`wizard_${this.type}_form_next`)
    if(_nextDiv){
      if(this.isOk()){
        _nextDiv.classList.remove("disabled")
      } else {
        _nextDiv.classList.add("disabled")
        this.disableNextViews()
      }
    }
  }

  VIEW.prototype.getResumed = function() {
    if(this.type==='view'){ return '' }

    if(this.form.ignore === true){
      return VIEW.lang('resumed_ignored', { name: this.tab_name })
    }
    return VIEW.lang('resumed_ignored', { name: this.tab_name })
  }

  VIEW.prototype.buildFooter = function() {
    if(this.type==='view'){ return '' }

    var _footer = document.getElementById(`wizard_${this.type}_footer`)
    var _validateFooter = document.getElementById(`wizard_${this.type}_validate_footer`)

    var _innerHTML = ''
    if(_footer){
      _innerHTML = `
        <div class="col s12">
          <div id="wizard_${this.type}_errors" class="row errors_wrapper" style="margin-bottom:0px !important"></div>
      `
      if(this.index == 0){
        _innerHTML = `${_innerHTML}
          <div class="row">
            <div class="col m3 hide-on-small-only"></div>
            <div class="col m3 hide-on-small-only" style="min-width:200px"></div>
            <div class="col m3 s12" style="min-width:200px">
              <span>
                <a style="margin-top:8px;width:100%" class="waves-effect waves-light btn-large disabled ttb-color-light-grey ttb-color-dark-grey-text" id="wizard_${this.type}_form_next"><i class="material-icons right" style="margin-right:-22px !important; margin-left:-22px !important">navigate_next</i>${VIEW.lang('next')}</a>
              </span>
            </div>
            <div class="col m3 hide-on-small-only"></div>
          </div>
        `
      } else {
        _innerHTML = `${_innerHTML}
          <div class="row">
            <div class="col m3 hide-on-small-only"></div>
            <div class="col m3 s12" style="min-width:200px">
              <span>
                <a style="margin-top:8px;width:100%" class="waves-effect waves-light btn-large ttb-color-light-grey ttb-color-dark-grey-text" id="wizard_${this.type}_form_previous"><i class="material-icons left" style="margin-right:-22px !important; margin-left:-22px !important">navigate_before</i>${VIEW.lang('previous')}</a>
              </span>
            </div>
            <div class="col m3 s12" style="min-width:200px">
              <span>
                <a style="margin-top:8px;width:100%" class="waves-effect waves-light btn-large ttb-color-light-grey ttb-color-dark-grey-text disabled" id="wizard_${this.type}_form_next"><i class="material-icons right" style="margin-right:-22px !important; margin-left:-22px !important">navigate_next</i>${VIEW.lang('next')}</a>
              </span>
            </div>
            <div class="col m3 hide-on-small-only"></div>
          </div>
        `
      }

      if(this.params.canIgnore){
        _innerHTML = `${_innerHTML}
          <div class="row">
            <div class="col m3 hide-on-small-only"></div>
            <div class="col m3 hide-on-small-only" style="min-width:200px"></div>
            <div class="col m3 s12" style="min-width:200px">
              <span>
                <a style="width:100%" class="waves-effect btn-large ttb-color-white" id="wizard_${this.type}_form_ignore"><i class="material-icons right" style="margin-right:-22px !important; margin-left:-22px !important">cancel</i>${VIEW.lang('ignore_step')}</a>
              </span>
            </div>
            <div class="col m3 hide-on-small-only"></div>
          </div>
        `
      }
      _innerHTML = `${_innerHTML}
        </div>
      `
      _footer.innerHTML = _innerHTML

      var _nextViewButton = document.getElementById(`wizard_${this.type}_form_next`)
      if(_nextViewButton){
        _nextViewButton.addEventListener("click", (e) => {
          if(this.isOk()){
            this.goToNextView()
          }
        })
      }

      var _previousViewButton = document.getElementById(`wizard_${this.type}_form_previous`)
      if(_previousViewButton){
        _previousViewButton.addEventListener("click", (e) => {
          this.goToPreviousView()
        })
      }

      var _ignoreViewButton = document.getElementById(`wizard_${this.type}_form_ignore`)
      if(_ignoreViewButton){
        _ignoreViewButton.addEventListener("click", (e) => {
          this.ignoreView()
        })
      }

      var _ignoreWrapperDiv = document.getElementById(`wizard_${this.type}_ignore_wrapper`)
      if(_ignoreWrapperDiv){
        _ignoreWrapperDiv.addEventListener("click", (e) => {
          this.unIgnoreView()
        })
      }
    }

    _innerHTML = ''
    if(_validateFooter){
      _innerHTML = `
        <div class="col s12">
          <div class="row">
            <div class="col m3 hide-on-small-only"></div>
            <div class="col m3 hide-on-small-only" style="min-width:200px"></div>
            <div class="col m3 s12" style="min-width:200px">
              <span>
                <a style="margin-top:8px;width:100%;" class="waves-effect waves-light btn-large disabled ttb-color-white" id="wizard_${this.type}_form_validate"><i class="material-icons right" style="margin-right:-16px !important; margin-left:-22px !important; color: #80ff00 !important">send</i>${VIEW.lang('validate')}</a>
              </span>
            </div>
            <div class="col m3 hide-on-small-only"></div>
          </div>
        </div>
      `
      _validateFooter.innerHTML = _innerHTML

      var _validateButton = document.getElementById(`wizard_${this.type}_form_validate`)
      if(_validateButton && typeof this.validate === 'function'){
        _validateButton.addEventListener("click", (e) => {
          this.validate()
        })
      }
    }
  }

  VIEW.prototype.getLang = function(lang_key){
    var _lang_key = lang_key ||  params.lang_key
    var req = new Request(`settings_wizard/${this.type}/locales/${_lang_key}/${this.type}.json`)
    return req.get()
  }

  VIEW.prototype.getView = function(){
    var req = new Request(this.params.ejs)
    return req.get()
  }

  VIEW.prototype.load = function() {
    return new Promise( (resolve, reject) => {
      resolve()
    })
  }

  VIEW.prototype.loaded = function() {
    return new Promise( (resolve, reject) => {
      resolve()
    })
  }

  VIEW.prototype.getNextViewIndex = function(){
    if(this.index === null || this.index+1 === modules.length){
      return null
    }
    return (this.index+1)
  }

  VIEW.prototype.getPreviousViewIndex = function(){
    if(this.index === null || this.index < 1){
      return null
    }
    return (this.index-1)
  }

  VIEW.prototype.goToNextView = function(){
    var nextActive = this.getNextViewIndex()
    if(nextActive !== null && nextActive != this.index){
      VIEW.enableView(nextActive)
      var next_a = document.getElementById(modules[nextActive].instance.navtab_id);
      if(next_a){
        next_a.click()
      }
    }
  }

  VIEW.prototype.goToPreviousView = function(){
    var previousActive = this.getPreviousViewIndex()
    if(previousActive !== null && previousActive != this.index){
      var previous_a = document.getElementById(modules[previousActive].instance.navtab_id);
      if(previous_a){
        previous_a.click()
      }
    }
  }

  VIEW.prototype.ignoreView = function(tout = 750){
    this.form.ignore = true
    var wrapper = document.getElementById(`wizard_${this.type}_ignore_wrapper`)
    var _nextViewButton = document.getElementById(`wizard_${this.type}_form_next`)
    if(_nextViewButton){
      _nextViewButton.classList.add('disabled')
    }
    var _errorDiv = document.getElementById(`wizard_${this.type}_errors`)
    if(_errorDiv){
      _errorDiv.classList.remove('is-visible')
    }
    if(tout !== null){
      if(wrapper){
        wrapper.classList.add('is-visible');
        setTimeout(() => { this.goToNextView() }, tout)
      } else {
        this.goToNextView()
      }
    }

    if(typeof this.ignored === 'function'){
      this.ignored()
    }
  }

  VIEW.prototype.unIgnoreView = function(){
    delete this.form.ignore
    this.checkButtonNextStats()
    var _ignoreWrapperDiv = document.getElementById(`wizard_${this.type}_ignore_wrapper`)
    if(_ignoreWrapperDiv){
      _ignoreWrapperDiv.classList.remove('is-visible')
    }
    var _errorDiv = document.getElementById(`wizard_${this.type}_errors`)
    if(_errorDiv){
      if(this.form._willShowErrors){
        clearTimeout(this.form._willShowErrors)
      }
      this.form._willShowErrors = setTimeout(() => { this.isOk(true) }, 3000)
    }

    if(typeof this.unIgnored === 'function'){
      this.unIgnored()
    }
  }

  VIEW.prototype.showErrors = function(errors = []){
    if(this.form.ignore === true){
      return
    }

    if(!Array.isArray(errors)){
      errors = [errors]
    }

    var _errorDiv = document.getElementById(`wizard_${this.type}_errors`)
    if(_errorDiv){
      var _innerHTML = ''
      if(errors.length > 0){
        _innerHTML = `
          <div class="col m3 hide-on-small-only"></div>
          <div class="col m6 s12 errors_container">
            <ul class="collection with-header">
              <li class="collection-header"><h4>${VIEW.lang('list_errors', errors.length)}</h4></li>
        `
        for(var e in errors){
          _backgroundColor = ''
          if(e%2===1){
            _backgroundColor = 'background-color: #F1F1F1;'
          }
          _innerHTML = `${_innerHTML}
            <li class="collection-item avatar" style="min-height:20px !important;${_backgroundColor}">
              <i class="material-icons circle ttb-color-purple">priority_high</i>
              <span class="title">${errors[e].title}</span>
              <p>${errors[e].corpus}</p>
            </li>
          `
        }
        _innerHTML = `${_innerHTML}
            </ul>
          </div>
        `
        _errorDiv.classList.add('is-visible')
      } else {
        _errorDiv.classList.remove('is-visible')
      }
      _errorDiv.innerHTML = _innerHTML
    } else if(errors.length > 0) {
      console.log(errors)
    }
  }

  VIEW.prototype.enableView = function(){
    var done = false
    var view_li = document.getElementById(this.tab_id);
    if(view_li){
      view_li.classList.remove("disabled")
      this.enabled()
      done = true
    }
    return done
  }

  VIEW.prototype.enableNextView = function(){
    var nextView = this.getNextViewIndex()
    if(nextView){
      VIEW.enableView(nextView)
    }
  }

  VIEW.prototype.disableView = function(){
    var done = false
    var view_li = document.getElementById(this.tab_id);
    if(view_li){
      if(!view_li.classList.contains('disabled')){
        view_li.classList.add("disabled")
        done = true
      }
    }
    return done
  }

  VIEW.prototype.disableNextViews = function(){
    var _nextIndex = this.getNextViewIndex()
    while(_nextIndex !== null){
      VIEW.disableView(_nextIndex)
      _nextIndex = VIEW.getNextViewIndex(_nextIndex)
    }
  }

  VIEW.getActiveViewIndex = function(){
    var currentActive = document.getElementsByClassName("navtab active");
    if(currentActive.length > 0){
      currentActive = modules.findIndex(m => m.instance.navtab_id == currentActive[0].id)
      if(currentActive !== -1){
        return currentActive
      }
    }
    return null
  }

  VIEW.getNextViewIndex = function(index){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      return modules[index].instance.getNextViewIndex()
    }
    return null
  }

  VIEW.getPreviousViewIndex = function(index){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      return modules[index].instance.getPreviousViewIndex()
    }
    return null
  }

  VIEW.goToNextView = function(index){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      modules[index].instance.goToNextView()
    }
  }

  VIEW.goToPreviousView = function(index){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      modules[index].instance.goToPreviousView()
    }
  }

  VIEW.ignoreView = function(index, tout = 750){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      modules[index].instance.ignoreView(tout)
    }
  }

  VIEW.unIgnoreView = function(index){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      modules[index].instance.unIgnoreView()
    }
  }

  VIEW.showErrors = function(index, errors = []){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      modules[index].instance.showErrors(errors)
    }
  }

  VIEW.enableView = function(index){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      modules[index].instance.enableView()
    }
  }

  VIEW.enableNextView = function(index){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      modules[index].instance.enableNextView()
    }
  }

  VIEW.disableView = function(index){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      modules[index].instance.disableView()
    }
  }

  VIEW.disableNextViews = function(index){
    if(!index){
      index = VIEW.getActiveViewIndex()
    }
    if(index !== null){
      modules[index].instance.disableNextViews()
    }
  }

  return VIEW
}()

var WIZARD = function() {
  var WIZARD = function() {
  }

  WIZARD.aliveApi = '/settings_wizard/alive'

  WIZARD.requestAlive = new Request(WIZARD.aliveApi)

  WIZARD.deviceIsAlive = function(){
    return new Promise( (resolve, reject) => {
      WIZARD.requestAlive.get().then( resp => {
        resolve(true)
      }).catch( err => {
        resolve(false)
      })
    })
  }

  WIZARD.waitForDevice = function(tout = 0){
    return new Promise( (resolve, reject) => {
      setTimeout( () => {
        WIZARD.deviceIsAlive().then( (isAlive) => {
          if(isAlive === false){
            return WIZARD.waitForDevice(2000)
          }
          resolve(true)
        })
        .then(() => {
          resolve(true)
        })
        .catch(() => {
          reject(false)
        })
      }, tout)
    })
  }

  WIZARD.restartDevice = function(hard){
    var _req = new Request('/settings_wizard/restart')
    if(hard === true){
      _req.setUrl('/settings_wizard/reboot')
    }
    _req.post()
    .then( () => {
      WIZARD.waitForDevice(15000).then( () => {
        setTimeout( () => {
          window.location = `${WIZARD.requestAlive.getProtocol()}//${WIZARD.requestAlive.getHost()}/`
        }, 3000)
      })
    })
    .catch( err => {})
  }

  return WIZARD
}()

document.addEventListener('DOMContentLoaded', function() {
  var req_lang = new Request(`settings_wizard/locales/${params.lang_key}/settings_wizard.json`)
  req_lang.get().then( lang =>{
    try{
      lang = JSON.parse(lang)
    } catch(e){}
    VIEW.lang = i18n.create({ values: lang })
    var promises = []
    var loaded_promises = []
    var reachableRequest = new Request('/settings_wizard/reachable')
    params.promisesReachable = reachableRequest.get()

    for(var i in modules){
      modules[i].instance = new (modules[i].module)()
      promises.push(modules[i].instance.load().then(resp => Object.assign({ success: true, data: resp })).catch(err => Object.assign({ success: false, data: err })))
    }

    Promise.all(promises).then( datas => {
      var _done = datas.filter( d => d.success === true)
      var _fail = datas.filter( d => d.success === false)

      if(_fail.length > 0){
        console.log(_fail)
        return
      }

      var nav_elems = document.querySelectorAll('.sidenav');
      var tab_elems = document.querySelectorAll('.tabs');
      var collapsible_elems = document.querySelectorAll('.collapsible');
      var tooltip_elems = document.querySelectorAll('.tooltiped');
      M.Sidenav.init(nav_elems);
      M.Tabs.init(tab_elems);
      M.Collapsible.init(collapsible_elems, {
        accordion: false
      });
      M.Tooltip.init(tooltip_elems);

      for(var i in modules){
        modules[i].instance.buildFooter()
        loaded_promises.push(modules[i].instance.loaded())
      }

      Promise.all(loaded_promises).then( loaded_datas => {
        for(var i in modules){
          if(modules[i].instance.isOk()){
            modules[i].instance.checkButtonNextStats()
            if(modules[i].instance.params.canIgnore === true){
              modules[i].instance.ignoreView(null)
            } 
            modules[i].instance.goToNextView()
          } else {
            break
          }
        }
      })
    })
  })
});
