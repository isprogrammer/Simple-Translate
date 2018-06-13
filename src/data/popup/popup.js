var wrongWord = '';

var background = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path == 'background-to-popup') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": 'popup-to-background', "method": id, "data": data})}
  }
})();

var checkVoice = function () {background.send("check-voice-request")};
var playVoice = function (word, lang) {background.send("play-voice", {"word": word, "lang": lang})};

var onClick = function () {
  document.getElementById("answer-title").textContent = '';
  document.getElementById("answer-details").textContent = '';
  var word = document.getElementById("question-input").getAttribute("word");
  if (!word) return;
  var toSelect = document.getElementById("to-select");
  var value = toSelect.children[toSelect.selectedIndex].getAttribute("value");
  if (!value) document.getElementById("answer-title").textContent = "select your language!";
  else {
    background.send("translation-request", word);
    document.getElementById("definition-table").setAttribute('state', 'loading');
  }
  document.getElementById("question-input").select();
};

var load = function () {
  background.send("initialization-request");
  document.getElementById("question-input").focus();
  document.getElementById("answer-title").textContent = '';
  document.getElementById("answer-details").textContent = '';
  document.getElementById("definition-table").removeAttribute('state');

  document.getElementById('fromto-td').addEventListener('click', function () {
    var difinition = document.getElementById("definition-table").getAttribute("definition");
    if (difinition) {
      document.getElementById("question-input").value = difinition;
      document.getElementById("question-input").setAttribute("word", difinition);
    }
    background.send("toggle-request");
  }, false);

  document.getElementById('home-td').addEventListener('click', function () {
    background.send("open-page", {"page": 'define', "word": document.getElementById("question-input").getAttribute("word")});
  }, false);

  document.getElementById('faq-td').addEventListener('click', function () {background.send("open-page", {"page": 'faq'})}, false);
  document.getElementById('settings-td').addEventListener('click', function () {background.send("open-page", {"page": 'settings'})}, false);

  document.getElementById("history-select").addEventListener("change", function (e) {
    var word = e.target.children[e.target.selectedIndex].getAttribute("value");
    document.getElementById('question-input').setAttribute("word", word);
    document.getElementById('question-input').value = word;
    onClick();
  }, false);

  document.getElementById("question-input").addEventListener("change", function (e) {
    document.getElementById("question-input").setAttribute("word", document.getElementById("question-input").value);
    onClick();
  }, false);

  document.getElementById('from-select').addEventListener("change", function (e) {
    var from = e.target.children[e.target.selectedIndex].value;
    background.send("change-from-select-request", from);
    checkVoice();
    onClick();
  }, false);

  document.getElementById('to-select').addEventListener("change", function (e) {
    var to = e.target.children[e.target.selectedIndex].value;
    background.send("change-to-select-request", to);
    checkVoice();
    onClick();
  }, false);

  document.getElementById('voice-question-td').addEventListener("click", function(e) {
    if (e.target.getAttribute("voice") == "false") return;
    var word = document.getElementById("question-input").getAttribute("word");
    var lang = document.getElementById('from-select').children[document.getElementById('from-select').selectedIndex].value;
    if (lang === 'auto') lang = document.getElementById('from-select').getAttribute("detected-language");
    playVoice(word, lang);
  }, false);

  document.getElementById('voice-answer-td').addEventListener("click", function(e) {
    if (e.target.getAttribute("voice") == "false") return;
    var word = document.getElementById('definition-table').getAttribute("definition");
    var lang = document.getElementById('to-select').children[document.getElementById('to-select').selectedIndex].value;
    playVoice(word, lang);
  }, false);

  document.getElementById('phrasebook-td').addEventListener("click", function(e) {
    var word = document.getElementById("question-input").getAttribute("word");
    var definition = document.getElementById("definition-table").getAttribute("definition");
    if (!word || !definition) return;
    if (!e.target.getAttribute("status")) background.send("add-to-phrasebook", {"question": word, "answer": definition});
    else background.send("remove-from-phrasebook", {"question": word, "answer": definition});
    e.target.setAttribute("status", "loading");
  }, false);
};

window.addEventListener('keydown', function (e) {
  if ((e.ctrlKey && e.shiftKey && e.keyCode === 38) || (e.metaKey && e.altKey && e.keyCode === 38)) document.getElementById('fromto-td').click();
}, false);

background.receive("translation-response", function (obj) {
  document.getElementById("answer-title").textContent = '';
  document.getElementById("answer-details").textContent = '';
  document.getElementById("definition-table").removeAttribute('state');
  function html(tag, attrs, parent) {
    if (!attrs) attrs = {};
    var tag = document.createElement(tag);
    for (var i in attrs) tag.setAttribute(i, attrs[i]);
    if (parent) parent.appendChild(tag);
    return tag;
  }
  if (!obj.error) {
    if (obj.wordIsCorrect) {
      document.getElementById("question-input").setAttribute("word", obj.word);
      if (wrongWord) document.getElementById("question-input").value = wrongWord + " >> " + obj.word;
      else document.getElementById("question-input").value = obj.word;
      wrongWord = '';
      /*  */
      document.getElementById("question-input").select();
      document.getElementById("definition-table").setAttribute("definition", obj.definition);
      var fs = document.getElementById("from-select").children[document.getElementById("from-select").selectedIndex];
      if (fs.value === 'auto' && obj.sourceLang) {
        fs.textContent = 'Auto (' + obj.sourceLang + ')';
        document.getElementById("from-select").setAttribute("detected-language", obj.sourceLang);
      }
      if (obj.phrasebook) {
        document.getElementById("phrasebook-td").setAttribute("status", "saved");
        document.getElementById("phrasebook-td").setAttribute("title", "Saved");
      } else {
        document.getElementById("phrasebook-td").removeAttribute("status");
        document.getElementById("phrasebook-td").setAttribute("title", "Save to Phrasebook");
      }
      document.getElementById("answer-title").textContent = obj.definition;
      /*  */
      var synonyms = obj.synonyms;
      var similars = obj.similar_words;
      var details = obj.detailDefinition;
      if (details && details.length) {
        details.forEach (function (detail) {
          var pos = html("td", {style: "color: #777; font-style: italic; height: 22px;"}, html("tr", {}, document.getElementById("answer-details"))).textContent = detail.pos;
          detail.entry.forEach(function (entry) {
            var tr = html("tr", {}, document.getElementById("answer-details"));
            var score = Math.round(entry.score * 90) + 10;
            html("div", {
              style: "width: 32px; height: 7px; background: linear-gradient(90deg, rgba(76,142,251,1.0) " + score + "%, rgba(76,142,251,0.3) " + score + "%);"
            }, html("td", {style: "vertical-align: middle;"}, tr));
            html("td", {"dir": "auto"}, tr).textContent = entry.word;
            html("td", {"dir": "auto"}, tr).textContent = entry.reverse_translation.join(", ");
          });
        });
      }
      if (synonyms && synonyms.length) {
        synonyms.forEach(function (synonym) {
          var pos = html("td", {style: "color: #777; font-style: italic; height: 22px;"}, html("tr", {}, document.getElementById("answer-details"))).textContent = "synonyms";
          synonym.entry.forEach(function (entry) {
            var tr = html("tr", {}, document.getElementById("answer-details"));
            html("div", {style: "width: 32px; height: 7px; background: linear-gradient(90deg, rgba(76,142,251,1.0) " + 0 + "%, rgba(76,142,251,0.3) " + 0 + "%);"}, html("td", {style: "vertical-align: middle;"}, tr));
            html("td", {dir: "auto", style: "color: #777; font-style: italic;"}, tr).textContent = synonym.pos;
            html("td", {dir: "auto"}, tr).textContent = entry.join(", ");
          });
        });
      }
      if (similars && similars.length) {
        var tr = html("tr", {}, document.getElementById("answer-details"));
        html("div", {style: "width: 32px; height: 7px; background: linear-gradient(90deg, rgba(76,142,251,1.0) " + 0 + "%, rgba(76,142,251,0.3) " + 0 + "%);"}, html("td", {}, tr));
        html("td", {style: "color: #777; font-style: italic;"}, tr).textContent = "see also";
        html("td", {dir: "auto"}, tr).textContent = similars.join(", ");
      }
    } else {
      background.send("translation-request", obj.correctedWord);
      document.getElementById("answer-title").textContent = "Check Spelling..";
      document.getElementById("definition-table").setAttribute('state', 'loading');
      wrongWord = obj.word;
    }
  } else {
    document.getElementById("answer-title").textContent = (obj.error === "TKK") ? "Addon needs to update some data from 'translate.google.com', please try again after few seconds..." : "NET Error: Cannot Access Google Translate!";
    document.getElementById("definition-table").setAttribute('state', 'error');
    document.getElementById("question-input").value = '';
  }
});

background.receive("history-update", function (obj) {
  var historySelect = document.getElementById("history-select");
  historySelect.textContent = '';
  /*  */
  function addNewItem (word, definition, index) {
    var option = document.createElement("option");
    option.textContent = word + ": " + definition;
    option.setAttribute("value", word);
    if (index == 0) {
      option.textContent = "- please select -";
      option.setAttribute("value", "");
    }
    historySelect.appendChild(option);
  }
  addNewItem('', '', 0);
  var count = 0;
  obj.reverse().forEach(function (o, i) {
    if (count > 9) return;
    if ((o[0].length + o[1].length) < 50) {
      addNewItem(o[0], o[1], count + 1);
      count++;
    }
  });
  /*  */
  if (!obj.length) {
    var option = document.createElement("option");
    option.setAttribute("disabled", true);
    option.textContent = "empty";
    historySelect.appendChild(option);
  }
});

background.receive("check-voice-response", function (arr) {
  var fromLang = document.getElementById('from-select').children[document.getElementById('from-select').selectedIndex].value;
  if (fromLang === 'auto') fromLang = document.getElementById('from-select').getAttribute("detected-language") || "en";
  var toLang = document.getElementById('to-select').children[document.getElementById('to-select').selectedIndex].value;
  document.getElementById("voice-question-td").setAttribute("voice", arr.indexOf(fromLang) === -1);
  document.getElementById("voice-answer-td").setAttribute("voice", arr.indexOf(toLang) === -1);
});

background.receive("saved-to-phrasebook", function () {
  document.getElementById("phrasebook-td").setAttribute("title", "Saved");
  document.getElementById("phrasebook-td").setAttribute("status", "saved");
});

background.receive("removed-from-phrasebook", function () {
  document.getElementById("phrasebook-td").removeAttribute("status");
  document.getElementById("phrasebook-td").setAttribute("title", "Save to Phrasebook");
});

background.receive("failed-phrasebook", function (status) {
  document.getElementById("phrasebook-td").setAttribute("status", status);
  document.getElementById("phrasebook-td").setAttribute("title", "Sign-in required");
});

background.receive("initialization-response", function (obj) {
  document.body.style.width = obj.width + "px";
  var toSelect = document.getElementById("to-select");
  var fromSelect = document.getElementById("from-select");
  document.getElementById("definition-table").style.height = obj.height + "px";
  document.getElementById("answer-details").style.maxHeight = obj.height - 34 + "px";
  for (var i = 0; i < fromSelect.children.length; i++) {
    if (fromSelect.children[i].getAttribute("value") === obj.from) {
      fromSelect.children[i].selected = "true";
      break;
    }
  }
  for (var i = 0; i < toSelect.children.length; i++) {
    if (toSelect.children[i].getAttribute("value") == obj.to) {
      toSelect.children[i].selected = "true";
      break;
    }
  }
  checkVoice();
  onClick();
});

window.addEventListener('load', load, false);