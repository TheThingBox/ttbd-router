document.addEventListener('DOMContentLoaded', function() {
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

  loaded_promises = []

  for(var v in params.views){
    if(typeof params.views[v].isOk !== 'function'){
      params.views[v].isOk = function(){
        return true
      }
    }
    if(typeof params.views[v].enabled !== 'function'){
      params.views[v].enabled = function(){
        var _index = params.views.findIndex(_e => _e.name === this.name)
        if(params.views[_index].isOk() === true){
          enableNextView(params.views[_index].order)
        }
      }
    }
    if(typeof params.views[v].checkButtonNextStats !== 'function'){
      params.views[v].checkButtonNextStats = function(){
        var _index = params.views.findIndex(_e => _e.name === this.name)
        var _nextDiv = document.getElementById(`wizard_${params.views[_index].name}_form_next`)
        if(_nextDiv){
          if(params.views[_index].isOk()){
            _nextDiv.classList.remove("disabled")
          } else {
            _nextDiv.classList.add("disabled")
            disableNextViews()
          }
        }
      }
    }
    if(typeof params.views[v].getResumed !== 'function'){
      params.views[v].getResumed = function(){
        if(form_params[this.name].ignore === true){
          return `The ${this.name} settings will be ignored`
        }
        return `The ${this.name} has been set`
      }
    }

    var _footer = document.getElementById(`wizard_${params.views[v].name}_footer`)
    if(_footer){
      _footer.innerHTML = buildFooter(v)
      var _nextViewButton = document.getElementById(`wizard_${params.views[v].name}_form_next`)
      if(_nextViewButton){
        _nextViewButton.addEventListener("click", function(e){
          let currentViewIndex = params.views.findIndex(_e => _e.order === getActiveViewOrder())
          if(currentViewIndex !== -1 && params.views[currentViewIndex].isOk()){
            goToNextView()
          }
        })
      }

      var _previousViewButton = document.getElementById(`wizard_${params.views[v].name}_form_previous`)
      if(_previousViewButton){
        _previousViewButton.addEventListener("click", function(e){
          goToPreviousView()
        })
      }

      var _ignoreViewButton = document.getElementById(`wizard_${params.views[v].name}_form_ignore`)
      if(_ignoreViewButton){
        _ignoreViewButton.addEventListener("click", function(e){
          ignoreView()
        })
      }

      var _ignoreWrapperDiv = document.getElementById(`wizard_${params.views[v].name}_ignore_wrapper`)
      if(_ignoreWrapperDiv){
        _ignoreWrapperDiv.addEventListener("click", function(e){
          unIgnoreView()
        })
      }
    }

    var _validateFooter = document.getElementById(`wizard_${params.views[v].name}_validate_footer`)
    if(_validateFooter){
      _validateFooter.innerHTML = buildValidateFooter(v)
      var _validateButton = document.getElementById(`wizard_${params.views[v].name}_form_validate`)
      if(_validateButton){
        _validateButton.addEventListener("click", function(e){
          var _clickedName = this.id.split('_')
          if(_clickedName.length > 2){
            _clickedName = _clickedName[1]
          }
          var _clickedIndex = params.views.findIndex(v => v.name === _clickedName)
          if(_clickedIndex !== -1){
            params.views[_clickedIndex].validate()
          }
        })
      }
    }


    if(typeof params.views[v].loaded !== 'function'){
      params.views[v].loaded = function(){ return true }
    }
    loaded_promises.push(params.views[v].loaded())
  }
  Promise.all(loaded_promises).then( datas => {
    for(var v in params.views){
      if(params.views[v].isOk()){
        params.views[v].checkButtonNextStats()
        if(params.views[v].canIgnore === true){
          ignoreView(params.views[v].order, 0)
        } else {
          goToNextView(params.views[v].order)
        }
      } else {
        break
      }
    }
  })
});

const getNextViewOrder = function(viewOrder){
  var _viewOrder = viewOrder || getActiveViewOrder()
  let currentViewIndex = params.views.findIndex(v => v.order === _viewOrder)
  if(currentViewIndex === -1 || (currentViewIndex+1) === params.views.length){
    return null
  }
  return params.views[currentViewIndex+1].order
}

const getPreviousViewOrder = function(viewOrder){
  var _viewOrder = viewOrder || getActiveViewOrder()
  let currentViewIndex = params.views.findIndex(v => v.order === _viewOrder)
  if(currentViewIndex < 1 ){
    return null
  }
  return params.views[currentViewIndex-1].order
}

const getActiveViewOrder = function(){
  var currentActive = document.getElementsByClassName("navtab active");
  if(currentActive.length > 0){
    currentActive = currentActive[0].classList.toString().split(' ').filter(e => e.indexOf('navtab_') === 0).map(e => e.substr(7))
    if(currentActive.length > 0){
      return currentActive[0]
    }
  }
  return null
}

const enableView = function(viewOrder){
  var view_li = document.getElementsByClassName('tab_'+viewOrder);
  if(view_li.length > 0){
    view_li[0].classList.remove("disabled")
    let viewIndex = params.views.findIndex(v => v.order === viewOrder)
    if(viewIndex !== -1 && params.views[viewIndex].enabled){
      params.views[viewIndex].enabled()
    }
  }
}

const enableNextView = function(viewOrder){
  var nextViewOrder = getNextViewOrder(viewOrder)
  if(nextViewOrder){
    enableView(nextViewOrder)
  }
}

const disableView = function(viewOrder){
  var done = false
  var view_li = document.getElementsByClassName('tab_'+viewOrder);
  if(view_li.length > 0){
    if(!view_li[0].classList.contains('disabled')){
      view_li[0].classList.add("disabled")
      done = true
    }
  }

  return done
}

const disableNextViews = function(viewOrder){
  var _nextOrder = getNextViewOrder(viewOrder)
  while(_nextOrder !== null){
    disableView(_nextOrder)
    _nextOrder = getNextViewOrder(_nextOrder)
  }
}

const goToNextView = function(viewOrder){
  if(!viewOrder){
    viewOrder = getActiveViewOrder()
  }
  if(viewOrder){
    var nextActive = getNextViewOrder(viewOrder)
    if(nextActive && nextActive != viewOrder){
      enableView(nextActive)
      var next_a = document.getElementsByClassName('navtab_'+nextActive);
      if(next_a.length > 0){
        next_a[0].click()
      }
    }
  }
}

const goToPreviousView = function(){
  var currentActive = getActiveViewOrder()
  if(currentActive){
    var previousActive = getPreviousViewOrder(currentActive)
    if(previousActive && previousActive != currentActive){
      var previous_a = document.getElementsByClassName('navtab_'+previousActive);
      if(previous_a.length > 0){
        previous_a[0].click()
      }
    }
  }
}

const ignoreView = function(viewOrder, tout = 750){
  var _viewOrder = viewOrder || getActiveViewOrder()
  var _viewIndex = params.views.findIndex(v => v.order === _viewOrder)
  if(_viewIndex == -1 || params.views[_viewIndex].canIgnore === false){
    return
  }
  form_params[params.views[_viewIndex].name].ignore = true
  var wrapper = document.getElementById(`wizard_${params.views[_viewIndex].name}_ignore_wrapper`)
  var _nextViewButton = document.getElementById(`wizard_${params.views[_viewIndex].name}_form_next`)
  if(_nextViewButton){
    _nextViewButton.classList.add('disabled')
  }
  var _errorDiv = document.getElementById(`wizard_${params.views[_viewIndex].name}_errors`)
  if(_errorDiv){
    _errorDiv.classList.remove('is-visible')
  }
  if(wrapper){
    wrapper.classList.add('is-visible');
    setTimeout(goToNextView, tout, _viewOrder)
  } else {
    goToNextView(_viewOrder)
  }
}

const unIgnoreView = function(viewOrder){
  var _viewOrder = viewOrder || getActiveViewOrder()
  var _viewIndex = params.views.findIndex(v => v.order === _viewOrder)
  if(_viewIndex == -1){
    return
  }
  delete form_params[params.views[_viewIndex].name].ignore
  params.views[_viewIndex].checkButtonNextStats()
  var _ignoreWrapperDiv = document.getElementById(`wizard_${params.views[_viewIndex].name}_ignore_wrapper`)
  if(_ignoreWrapperDiv){
    _ignoreWrapperDiv.classList.remove('is-visible')
  }
  var _errorDiv = document.getElementById(`wizard_${params.views[_viewIndex].name}_errors`)
  if(_errorDiv){
    if(form_params[params.views[_viewIndex].name]._willShowErrors){
      clearTimeout(form_params[params.views[_viewIndex].name]._willShowErrors)
    }
    form_params[params.views[_viewIndex].name]._willShowErrors = setTimeout(() => { params.views[_viewIndex].isOk(true) }, 3000)
  }
}

const validateEmail = function(email) {
  var re = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  return re.test(email);
}

const showErrors = function(errors, viewOrder){
  var _viewOrder = viewOrder || getActiveViewOrder()
  var _viewIndex = params.views.findIndex(v => v.order === _viewOrder)
  if(form_params[params.views[_viewIndex].name].ignore){
    return
  }

  if(!Array.isArray(errors)){
    errors = [errors]
  }

  var _errorDiv = document.getElementById(`wizard_${params.views[_viewIndex].name}_errors`)
  if(_errorDiv){
    var _innerHTML = ''
    if(errors.length > 0){
      _innerHTML = `<div class="col m3 hide-on-small-only"></div>
<div class="col m6 s12 errors_container">
<ul class="collection with-header">
<li class="collection-header"><h4>List of error${(errors.length>1)?'s':''}</h4></li>
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

const buildFooter = function(index){
  var _innerHTML = '<div class="col s12">'
  _innerHTML = `${_innerHTML}
<div id="wizard_${params.views[index].name}_errors" class="row errors_wrapper" style="margin-bottom:0px !important">
</div>
`

  if(index == 0){
    _innerHTML = `${_innerHTML}
<div class="row">
  <div class="col m3 hide-on-small-only"></div>
  <div class="col m3 hide-on-small-only" style="min-width:200px"></div>
  <div class="col m3 s12" style="min-width:200px">
    <span>
      <a style="margin-top:8px;width:100%" class="waves-effect waves-light btn-large disabled ttb-color-light-grey  ttb-color-dark-grey-text" id="wizard_${params.views[index].name}_form_next"><i class="material-icons right" style="margin-right:-22px !important; margin-left:-22px !important">navigate_next</i>Next</a>
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
      <a style="margin-top:8px;width:100%" class="waves-effect waves-light btn-large ttb-color-light-grey ttb-color-dark-grey-text" id="wizard_${params.views[index].name}_form_previous"><i class="material-icons left" style="margin-right:-22px !important; margin-left:-22px !important">navigate_before</i>Previous</a>
    </span>
  </div>
  <div class="col m3 s12" style="min-width:200px">
    <span>
      <a style="margin-top:8px;width:100%" class="waves-effect waves-light btn-large ttb-color-light-grey ttb-color-dark-grey-text disabled" id="wizard_${params.views[index].name}_form_next"><i class="material-icons right" style="margin-right:-22px !important; margin-left:-22px !important">navigate_next</i>Next</a>
    </span>
  </div>
  <div class="col m3 hide-on-small-only"></div>
</div>
`
  }

  if(params.views[index].canIgnore){
    _innerHTML = `${_innerHTML}
<div class="row">
  <div class="col m3 hide-on-small-only"></div>
  <div class="col m3 hide-on-small-only" style="min-width:200px"></div>
  <div class="col m3 s12" style="min-width:200px">
    <span>
      <a style="width:100%" class="waves-effect btn-large ttb-color-white" id="wizard_${params.views[index].name}_form_ignore"><i class="material-icons right" style="margin-right:-22px !important; margin-left:-22px !important">cancel</i>Ignore this step</a>
    </span>
  </div>
  <div class="col m3 hide-on-small-only"></div>
</div>
`
  }
  _innerHTML = `${_innerHTML}
</div>`
  return _innerHTML
}

const buildValidateFooter = function(index){
    var _innerHTML = '<div class="col s12">'

    _innerHTML = `${_innerHTML}
<div class="row">
  <div class="col m3 hide-on-small-only"></div>
  <div class="col m3 hide-on-small-only" style="min-width:200px"></div>
  <div class="col m3 s12" style="min-width:200px">
    <span>
      <a style="margin-top:8px;width:100%;" class="waves-effect waves-light btn-large disabled ttb-color-white" id="wizard_${params.views[index].name}_form_validate"><i class="material-icons right" style="margin-right:-16px !important; margin-left:-22px !important; color: #80ff00 !important">send</i>Validate</a>
    </span>
  </div>
  <div class="col m3 hide-on-small-only"></div>
</div>
`
    _innerHTML = `${_innerHTML}
    </div>`
    return _innerHTML
}

const settingsWizardAliveApi = '/settings_wizard/alive'

const requestAlive = new Request(settingsWizardAliveApi)

const ttbIsAlive = function(){
  return new Promise( (resolve, reject) => {
    requestAlive.get().then( resp => {
      resolve(true)
    }).catch( err => {
      resolve(false)
    })
  })
}

const waitTtbIsAlive = function(tout = 0){
  return new Promise( (resolve, reject) => {
    setTimeout( () => {
      ttbIsAlive().then( (isAlive) => {
        if(isAlive === false){
          return waitTtbIsAlive(2000)
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

const restart = function(hard){
  var _req = new Request('/settings_wizard/restart')
  if(hard === true){
    _req.setUrl('/settings_wizard/reboot')
  }
  _req.post()
  .then( () => {
    waitTtbIsAlive(5000).then( () => {
      setTimeout( () => {
        window.location = `${requestAlive.getProtocol()}//${requestAlive.getHost()}/`
      }, 3000)
    })
  })
  .catch( err => {})
}
