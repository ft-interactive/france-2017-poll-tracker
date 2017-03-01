/* eslint-disable */

// product-specific cuts-the-mustard test (customise for your needs)
window.cutsTheMustard = (typeof Function.prototype.bind !== 'undefined');

;(function(){

function addScript(src, async, defer, cb, attributes) {
  var script = document.createElement('script');
  script.src = src;
  script.async = !!async;
  if (attributes) {
    for (var key in attributes) {
      script.setAttribute(key, attributes[key]);
    }
  }
  if (defer) script.defer = !!defer;
  var head = document.head || document.getElementsByTagName('head')[0];
  if (!cb && typeof defer === 'function') {
    cb = defer;
  }

  if (typeof cb === 'function') {
    var onScriptLoaded = function onScriptLoaded() {
      var readyState = this.readyState; // we test for "complete" or "loaded" if on IE
      if (!readyState || /ded|te/.test(readyState)) {
        try {
          cb();
        } catch (error) {
          if (window.console && console.error) {
            console.error(error);
          }
        }
      }
    };

    script.onload = script.onerror = script.onreadystatechange = onScriptLoaded;
  }
  head.appendChild(script);
  return script;
}

function exec(script) {
  if (!window.cutsTheMustard) return;
  var s = typeof script;
  if (s === 'string') {
    try {
      addScript.apply(window, arguments);
    } catch(e) {
      console.error(e);
    }
  } else if (s === 'function') {
    try {
      script();
    } catch(e) {
      console.error(e);
    }
  } else if (script) {
    try {
      var args = Array.prototype.slice.call(arguments, 1);
      for (var i = 0; i < script.length; i++) {
        exec.apply(window, [script[i]].concat(args));
      }
    } catch(e){
      console.error(e);
    }
  }
}

var queuedScripts = [];
var lowPriorityQueue = [];

function queue(src, cb, lowPriority, attributes) {
  var args = [src, true, !!lowPriority, cb, attributes];

  if (!queuedScripts) {
    exec.apply(window, args);
    return;
  }

  if (lowPriority) {
    lowPriorityQueue.push(args);
  } else {
    queuedScripts.push(args);
  }
}

function emptyQueue(q) {
  var arr = q.slice(0);
  for (var i = 0; i < arr.length; i++) {
    exec.apply(window, arr[i]);
  }
}

function clearQueue() {
  emptyQueue(queuedScripts);
  queuedScripts = null;
  var callback = lowPriorityQueue.length
                        ? lowPriorityQueue[lowPriorityQueue.length - 1][3]
                        : null;

  var done = function () {
    document.documentElement.className = document.documentElement.className + ' js-success';
  }

  var onLoaded = typeof callback !== 'function' ? done : function() {
    callback();
    done();
  }

  if (lowPriorityQueue.length) {
    lowPriorityQueue[lowPriorityQueue.length - 1][3] = onLoaded;
  } else {
    setTimeout(function(){onLoaded()},1);
  }

  emptyQueue(lowPriorityQueue);
  lowPriorityQueue = null;
}

window.queue = queue;
window.clearQueue = clearQueue;
window.exec = exec;

exec(function(){
  window.isNext = document.cookie.indexOf('FT_SITE=NEXT') !== -1;
  window.isLoggedIn = document.cookie.indexOf('FTSession=') !== -1;
  document.documentElement.className = document.documentElement.className.replace(/\bcore\b/g, [
    'enhanced',
    (window.isNext ? 'is-next' : 'is-falcon'),
    (window.isLoggedIn ? 'is-loggedin' : 'is-anonymous')
  ].join(' '));
});

// Load the polyfill service with custom features. Exclude big unneeded polyfills.
// and use ?callback= to clear the queue of scripts to load
var polyfillFeatures = [
  'default-3.6',
  'matchMedia',
  'fetch',
  'IntersectionObserver',
  'HTMLPictureElement'
];

var polyfillUrl = 'https://cdn.polyfill.io/v2/polyfill.min.js?callback=clearQueue&features='
                    + polyfillFeatures.join(',')
                    + '&excludes=Symbol,Symbol.iterator,Symbol.species';

exec(polyfillUrl, true, false, null, {crossorigin: 'anonymous'})

}());
