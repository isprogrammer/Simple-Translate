var background = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'background-to-options') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": 'options-to-background', "method": id, "data": data})}
  }
})();

var connect = function (elem, pref) {
  var att = "value";
  if (elem) {
    if (elem.type === "checkbox") att = "checked";
    if (elem.localName === "select") att = "value";
    if (elem.localName === "span") att = "textContent";
    var pref = elem.getAttribute("data-pref");
    background.send("get", pref);
    elem.addEventListener("change", function () {background.send("changed", {"pref": pref, "value": this[att]})});
  }
  /*  */
  return {
    get value () {return elem[att]},
    set value (val) {
      if (elem.type === "file") return;
      if (val === "true") val = true;
      else if (val === "false") val = false;
      elem[att] = val;
    }
  }
};

background.receive("set", function (o) {
  if (window[o.pref]) window[o.pref].value = o.value;
  if (o.pref === "options.SorH") {
    var tabHistory = document.getElementById("tab-history");
    var tabSettings = document.getElementById("tab-settings");
    if (o.value === "history") {
      tabHistory.style.display = "block";
      tabSettings.style.display = "none";
    } else {
      tabHistory.style.display = "none";
      tabSettings.style.display = "block";
    }
  }
});

function clearOptionsHistoryTable() {
  var table = document.getElementById('translator-history-list');
  var trs = table.getElementsByTagName('tr');
  for (var i = trs.length - 1; i > 0; i--) table.removeChild(trs[i]);
}

function clearOptionsHistory() {
  background.send("clearOptionsHistory", '');
  clearOptionsHistoryTable();
}

function init() {
  var enable = document.querySelector("input[data-pref='history.enable']");
  var number = document.querySelector("input[data-pref='history.number']");
  var dbClick = document.querySelector("input[data-pref='settings.dbClick']");
  var showIcon = document.querySelector("input[data-pref='settings.showIcon']");
  var selection = document.querySelector("input[data-pref='settings.selection']");
  var mouseOver = document.querySelector("input[data-pref='settings.mouseOverTranslation']");
  var translateIconShow = document.querySelector("input[data-pref='settings.translateIconShow']");
  var translateIconTime = document.querySelector("input[data-pref='settings.translateIconTime']");
  /*  */
  var prefs = document.querySelectorAll("*[data-pref]");
  [].forEach.call(prefs, function (elem) {
    var pref = elem.getAttribute("data-pref");
    window[pref] = connect(elem, pref);
  });
  /*  */
  function set(elm, pref, value) {
    if (!elm) return;
    elm.checked = value;
    background.send("changed", {"pref": pref, "value": value});
  }
  /*  */
  selection.addEventListener('change', function (e) {
    var flag = e.target.checked;
    set(selection, 'settings.selection', flag);
    set(mouseOver, 'settings.mouseOverTranslation', false);
    set(showIcon, 'settings.showIcon', false);
    translateIconShow.disabled = true;
    translateIconTime.disabled = true;
  }, false);
  /*  */
  dbClick.addEventListener('change', function (e) {
    var flag = e.target.checked;
    set(dbClick, 'settings.dbClick', flag);
    set(mouseOver, 'settings.mouseOverTranslation', false);
    set(showIcon, 'settings.showIcon', false);
    translateIconShow.disabled = true;
    translateIconTime.disabled = true;
  }, false);
  /*  */
  showIcon.addEventListener('change', function (e) {
    var flag = e.target.checked;
    translateIconShow.disabled = !flag;
    translateIconTime.disabled = !flag;
    set(showIcon, 'settings.showIcon', flag);
    set(selection, 'settings.selection', false);
    set(dbClick, 'settings.dbClick', false);
    set(mouseOver, 'settings.mouseOverTranslation', false);
  }, false);
  /*  */
  document.getElementById('clearHistory').addEventListener('click', clearOptionsHistory, false);
  enable.addEventListener('click', function (e) {
    var flag = e.target.checked;
    if (!flag) {
      clearOptionsHistory();
      number.disabled = true;
    } else number.disabled = false;
  }, false);
  /*  */
  var dicHistoryData = [];
  var updateOptionsPage = function (data) {
    dicHistoryData = data;
    var n = window["history.number"].value;
    var e = window["history.enable"].value;
    var table = document.getElementById('translator-history-list');
    var addLine = function (table, i, word, definition, id) {
      var addColumn = function (tr, txt, rule, title) {
        var td = document.createElement("td");
        td.textContent = txt;
        td.setAttribute('rule', rule);
        td.setAttribute('dir', 'auto');
        td.setAttribute('title', title);
        if (rule === 'delete') {
          td.addEventListener('click', function (e) {
            var index = parseInt(e.target.parentNode.getAttribute('index'));
            dicHistoryData.splice(index, 1);
            updateOptionsPage(dicHistoryData);
            background.send("set-history-update", dicHistoryData);
          });
        }
        tr.appendChild(td);
      };
      /*  */
      var tr = document.createElement("tr");
      addColumn(tr, i + 1, 'index', '');
      addColumn(tr, word, 'word', '');
      addColumn(tr, definition, 'definition', '');
      addColumn(tr, '✕', 'delete', 'Delete Line');
      if (id) tr.style.fontWeight = 'bold';
      tr.setAttribute('index', i);
      table.appendChild(tr);
    };
    /*  */
    if (e || e === 'true') {
      number.disabled = false;
      clearOptionsHistoryTable();
      dicHistoryData.forEach(function (o, i) {if (i < n) addLine(table, i, o[0], o[1], o[2])});
    } else {
      clearOptionsHistory();
      number.disabled = true;
    }
    if (!showIcon.checked) {
      translateIconShow.disabled = true;
      translateIconTime.disabled = true;
    } else {
      translateIconShow.disabled = false;
      translateIconTime.disabled = false;
    }
  };
  /*  */
  background.send("get-history-update");
  background.receive("history-update", updateOptionsPage);
  document.getElementById('saveAsHistory').addEventListener('click', function () {
    var csv = '';
    dicHistoryData.forEach(function (o, i) {
      if (i < window["history.number"].value) {
        var column1 = i + 1;
        var column2 = o[0].replace(/\,/g, '').replace(/\u060c/g, '');
        var column3 = o[1].replace(/\,/g, '').replace(/\u060c/g, '');
        csv += column1 + ', ' + column2 + ', ' + column3 + '\n';
      }
    });
    var encodedUri = encodeURI(csv);
    var link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,\uFEFF' + encodedUri);
    link.setAttribute('download', 'dictionary-history.csv');
    document.body.appendChild(link);
    link.click();
  }, false);
  /*  */
  window.removeEventListener("load", init, false);
};

window.addEventListener("load", init, false);
