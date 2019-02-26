ejs.fileLoader = function(url) {
    var request
    var method = 'GET'
    var params = null

    if (window.XMLHttpRequest) {
        request = new window.XMLHttpRequest();
    } else {
        try {
            request = new ActiveXObject("MSXML2.XMLHTTP");
        } catch (ex) {
            return null;
        }
    }

    request.open(method, url, false);
    request.send(params);

    if (request.readyState === 4 && request.status === 200){
        return request.responseText;
    }

    return null;
}
