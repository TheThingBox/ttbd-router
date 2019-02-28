function nextElementSibling(element) {
    do {
        element = element.nextSibling;
    } while (element && element.nodeType !== 1);
    return element;
}

function toggle(element){
  if (element.style.display === "none") {
      element.style.display = "block";
  } else {
      element.style.display = "none";
  }
}

function toggleClass(element, _class){
  if(element.classList.contains(_class)){
    element.classList.remove(_class)
  } else {
    element.classList.add(_class)
  }
}

function hide(element){
    element.style.display = "none";
}

function show(element){
    element.style.display = "block";
}

function isObject(val) {
    if (val === null) { return false; }
    return ((typeof val === 'function') || (typeof val === 'object'));
}
