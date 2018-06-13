var app = {};

app.loadReason = "startup";
app.version = function () {return chrome.runtime.getManifest().version};
if (chrome.runtime.onInstalled) chrome.runtime.onInstalled.addListener(function (e) {app.loadReason = e.reason});
if (chrome.runtime.setUninstallURL) chrome.runtime.setUninstallURL(m(7) + '?name=' + "translator" + '&version=' + app.version(), function () {});

app.tab = {
  "open": function (url) {chrome.tabs.create({"url": url, "active": true})},
  "openOptions": function () {chrome.runtime.openOptionsPage(function () {})},
};

app.Promise = (function () {
  if (!Promise.defer) {
    Promise.defer = function () {
      var deferred = {};
      var promise = new Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject  = reject;
      });
      deferred.promise = promise;
      return deferred;
    };
  }
  return Promise;
})();

app.storage = (function () {
  var objs = {};
  window.setTimeout(function () {
    chrome.storage.local.get(null, function (o) {
      objs = o;
      var script = document.createElement("script");
      script.src = "../common.js";
      document.body.appendChild(script);
    });
  }, 300);
  /*  */
  return {
    "read": function (id) {return objs[id]},
    "write": function (id, data) {
      var tmp = {};
      data = data + '';
      objs[id] = data;
      tmp[id] = data;
      chrome.storage.local.set(tmp, function () {});
    }
  }
})();

app.get = function (url, headers, data) {
  var xhr = new XMLHttpRequest();
  var deferred = Promise.defer();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 400 || xhr.status < 200) {
        var e = new Error(xhr.statusText);
        e.status = xhr.status;
        deferred.reject(e);
      } else deferred.resolve(xhr.responseText);
    }
  };
  xhr.open(data ? "POST" : "GET", url, true);
  for (var id in headers) xhr.setRequestHeader(id, headers[id]);
  if (data) {
    var arr = [];
    for (e in data) arr.push(e + '=' + data[e]);
    data = arr.join('&');
  }
  xhr.send(data ? data : '');
  return deferred.promise;
};

app.context_menu = {
  "remove": function () {chrome.contextMenus.removeAll(function () {})},
  "create": function (title, type, callback) {
    chrome.contextMenus.create({"title": title, "contexts": [type], "onclick": function () {callback()}});
  }
};

app.notification = function (title, text) {
  var notification = chrome.notifications.create('', {
    "title": title,
    "message": text,
    "type": "basic",
    "iconUrl": chrome.extension.getURL('') + 'data/icon64.png'
  }, function () {});
};

app.play = function (url, callback) {
  var audio = new Audio();
  var canPlay = audio.canPlayType("audio/mpeg");
  var ended = function () {
    audio.removeEventListener("ended", ended);
    callback(true);
  };
  if (!canPlay) {
    audio = document.createElement("iframe");
    document.body.appendChild(audio);
  }
  if (canPlay) {
    audio.setAttribute('src', url);
    audio.play();
  } else {
    audio.removeAttribute('src');
    audio.setAttribute('src', url);
  }
  audio.addEventListener("ended", ended);
};

app.onBeforeSendHeaders = function (callback) {
  var listener = function (e) {return callback(e)};
  var urls = ["*://*.translate.google.com/*", "*://translate.google.com/*"];
  chrome.webRequest.onBeforeSendHeaders.addListener(listener, {"urls": urls}, ["blocking", "requestHeaders"]);
};

app.popup = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'popup-to-background') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data, tabId) {
      chrome.runtime.sendMessage({"path": 'background-to-popup', "method": id, "data": data});
    }
  }
})();

app.options = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'options-to-background') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data, tabId) {
      chrome.runtime.sendMessage({"path": 'background-to-options', "method": id, "data": data});
    }
  }
})();

app.content_script = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'page-to-background') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data, global) {
      var options = global ? {} : {"active": true, "currentWindow": true};
      chrome.tabs.query(options, function (e) {
        e.forEach(function (tab) {
          chrome.tabs.sendMessage(tab.id, {"path": 'background-to-page', "method": id, "data": data}, function () {});
        });
      });
    }
  }
})();
