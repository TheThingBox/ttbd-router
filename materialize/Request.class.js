var Request = function() {

    var Request = function(url, data) {
        this.url = url
        this.data = ''
        this.isJsonData = false
        if(typeof data !== 'undefined'){
          this.setData(data)
        }
    }

    Request.prototype.setData = function(data) {
      this.data = data
      if(!data){
        return
      }

      if(this.isObjectData()){
        this.data = JSON.stringify(this.data)
        this.isJsonData = true
      } else {
        try {
          JSON.parse(this.data)
          this.isJsonData = true
        } catch(e){}
      }
    }

    Request.prototype.isObjectData = function() {
        if (this.data === null) { return false; }
        return ((typeof this.data === 'function') || (typeof this.data === 'object'));
    }

    Request.handleResponse = function(response) {
      var contentType = response.headers.get("content-type");
      if(contentType && contentType.indexOf("text/") !== -1){
        return response.text().then((text) => {
          if (!response.ok) {
            const error = Object.assign({}, {
              message: text,
              status: response.status,
              statusText: response.statusText,
            });
            return Promise.reject(error);
          }
          return text;
        });
      } else if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json().then((json) => {
          if (!response.ok) {
            const error = Object.assign({}, json, {
              status: response.status,
              statusText: response.statusText,
            });
            return Promise.reject(error);
          }
          return json;
        });
      } else {
        throw new Error("Unsupported response");
      }
    }

    Request.prototype.post = function() {
      return new Promise( (resolve, reject) => {
        var _headers = new Headers({'Accept': 'application/json, text/plain, */*', 'Content-Length': this.data.length.toString()})
        if(this.isJsonData === true){
          _headers.append('Content-Type', 'application/json; charset=utf-8')
        }
        fetch(this.url, {
          method: 'POST',
          body: this.data,
          mode: 'cors',
          headers: _headers
        })
        .then(Request.handleResponse)
        .then( data => {
          resolve(data)
        }).catch( error => {
          reject(error)
        })
      })
    }

    Request.prototype.get = function() {
      return new Promise( (resolve, reject) => {
        var _headers = new Headers({'Accept': 'application/json, text/plain, */*'})
        var _url = this.url
        if(this.isJsonData){
          var _data = JSON.parse(this.data)
          if(Object.keys(_data).length > 0){
            _url = `${this.url}?${Object.keys(_data).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(_data[key])).join('&')}`
          }
        }
        fetch(_url, {
          method: 'GET',
          mode: 'cors',
          headers: _headers
        }).then(response => {
          if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
          }
          var contentType = response.headers.get("content-type");
          if(contentType && contentType.indexOf("application/json") !== -1) {
            return response.json()
          } else if (contentType && contentType.indexOf("text/plain") !== -1){
            return response.text()
          } else if (contentType && contentType.indexOf("image/") !== -1){
            return response.blob().then(blob => {
              return URL.createObjectURL(blob)
            })
          } else {
            throw new Error("Unsupported response");
          }
        }).then(data => {
          resolve(data)
        }).catch( error => {
          reject(error)
        })
      })
    }

    return Request
}();
