var TKK_TIMER = null, NOTIFICATION_UPDATE = false, autoDetectedLang = 'en', wordForSwapRequest = '', globalToken, sourceLanguage;

const languagesNoVoice = [
  "az","eu","be","bn","bg","ceb","et","tl","gl","ka","gu","ha","iw","hmn",
  "ig","ga","jw","kn","km","lo","lt","ms","mt","mi","mr","mn","ne","fa",
  "pa","sl","so","te","uk","ur","yi","yo","zu", "si", "st"
];

var languagesMapName = {
  "bg": "Bulgarian", "ca": "Catalan", "ceb": "Cebuano", "zh-CN": "Ch (Simplified)", "zh-TW": "Ch (Traditional)", "hr": "Croatian", "cs": "Czech",
  "af": "Afrikaans", "sq": "Albanian", "ar": "Arabic", "hy": "Armenian", "az": "Azerbaijani", "eu": "Basque", "be": "Belarusian", "bn": "Bengali",
  "th": "Thai", "tr": "Turkish", "uk": "Ukrainian", "ur": "Urdu", "vi": "Vietnamese", "cy": "Welsh", "yi": "Yiddish", "yo": "Yoruba", "zu": "Zulu",
  "ka": "Georgian", "de": "German", "el": "Greek", "gu": "Gujarati", "ht": "Haitian Creole", "ha": "Hausa", "iw": "Hebrew", "hi": "Hindi", "hmn": "Hmong",
  "da": "Danish", "nl": "Dutch", "en": "English", "eo": "Esperanto", "et": "Estonian", "tl": "Filipino", "fi": "Finnish", "fr": "French", "gl": "Galician",
  "hu": "Hungarian", "is": "Icelandic", "ig": "Igbo", "id": "Indonesian", "ga": "Irish", "it": "Italian", "ja": "Japanese", "jw": "Javanese", "kn": "Kannada",
  "mr": "Marathi", "mn": "Mongolian", "ne": "Nepali", "no": "Norwegian", "fa": "Persian", "pl": "Polish", "pt": "Portuguese", "pa": "Punjabi", "ro": "Romanian",
  "km": "Khmer", "ko": "Korean", "lo": "Lao", "la": "Latin", "lv": "Latvian", "lt": "Lithuanian", "mk": "Macedonian", "ms": "Malay", "mt": "Maltese", "mi": "Maori",
  "ru": "Russian", "sr": "Serbian", "sk": "Slovak", "sl": "Slovenian", "so": "Somali", "es": "Spanish", "sw": "Swahili", "sv": "Swedish", "ta": "Tamil", "te": "Telugu"
};

window.setTimeout(function () {
  var version = config.welcome.version;
  if (version !== app.version()) {
    if (app.loadReason === "install" || app.loadReason === "startup") {
      if (config.welcome.page) {
        app.tab.open(m(0) + app.version() + (version ? "&p=" + version + "&type=upgrade" : "&type=install"));
      }
      config.welcome.version = app.version();
    }
  }
}, config.welcome.timeout);

app.content_script.receive("GT-TKK", function (e) {
  if (e) config.translator.TKK = e;
  if (!NOTIFICATION_UPDATE) return;
  app.notification("Google Translator", e ? "DONE!, you can now close 'translate.google.com' tab." : "Error! Google Translator addon needs to be upgraded.");
  NOTIFICATION_UPDATE = false;
});

var calcToken = function (a) {
  var k = "", cb = "&", Gf = "=", jd = ".", $b = "+-a^+6", t = "a", Yb = "+", Zb = "+-3^+b+-f";
  sM = function (a) {return function () {return a}},
  tM = function (a, b) {
    for (var c = 0; c < b.length - 2; c += 3) {
      var d = b.charAt(c + 2), d = d >= t ? d.charCodeAt(0) - 87 : Number(d), d = b.charAt(c + 1) == Yb ? a >>> d : a << d;
      a = b.charAt(c) == Yb ? a + d & 4294967295 : a ^ d
    }
    return a
  },
  uM = null;
  /*  */
  var b;
  if (null !== uM) b = uM;
  else {
    b = sM(String.fromCharCode(84));
    var c = sM(String.fromCharCode(75));
    b = [b(), b()];
    b[1] = c();
    b = (uM = config.translator.TKK || k) || k;
  }
  /*  */
  var d = sM(String.fromCharCode(116)), c = sM(String.fromCharCode(107)), d = [d(), d()];
  d[1] = c();
  c = cb + d.join(k) + Gf;
  d = b.split(jd);
  b = Number(d[0]) || 0;
  for (var e = [], f = 0, g = 0; g < a.length; g++) {
    var m = a.charCodeAt(g);
    128 > m ? e[f++] = m : (2048 > m ? e[f++] = m >> 6 | 192 : (55296 == (m & 64512) && g + 1 < a.length && 56320 == (a.charCodeAt(g + 1) & 64512) ? (m = 65536 + ((m & 1023) << 10) + (a.charCodeAt(++g) & 1023), e[f++] = m >> 18 | 240, e[f++] = m >> 12 & 63 | 128) : e[f++] = m >> 12 | 224, e[f++] = m >> 6 & 63 | 128), e[f++] = m & 63 | 128)
  }
  /*  */
  a = b;
  for (f = 0; f < e.length; f++) a += e[f], a = tM(a, $b);
  a = tM(a, Zb);
  a ^= Number(d[1]) || 0;
  0 > a && (a = (a & 2147483647) + 2147483648);
  a %= 1E6;
  return (a.toString() + jd + (a ^ b));
};

function findPhrasebook(word, definition) {
  var phrasebook = '';
  var obj = config.history.data;
  if (word && definition) phrasebook = obj.filter(function (a) {return (a[0].toLowerCase() === word.toLowerCase() && a[1].toLowerCase() === definition.toLowerCase())})[0];
  return phrasebook ? phrasebook[2] : '';
}

function saveToHistory(obj) {
  if (!obj.word || !obj.definition) return;
  if (config.history.enable + '' === "false") return;
  obj.word = obj.word.toLowerCase();
  obj.definition = obj.definition.toLowerCase();
  if (obj.word === obj.definition) return;
  var numberHistoryItems = config.history.number;
  var arr = config.history.data;
  /*  */
  var tmpPhrasebook;
  arr = arr.filter(function (a) {
    if (a[0].toLowerCase() === obj.word && a[1].toLowerCase() === obj.definition) {
      tmpPhrasebook = a[2];
      return false;
    } else return true;
  });
  /*  */
  arr.push([obj.word, obj.definition, "phrasebook" in obj ? obj.phrasebook : tmpPhrasebook || '', obj.data]);
  arr = arr.splice(-1 * numberHistoryItems);
  config.history.data = arr;
  /*  */
  app.popup.send("history-update", arr);
  app.options.send("history-update", config.history.data);
}

function clearHistory () {config.history.data = []}

function newTranslationEngine(inputWord, ajaxResults) {
  var obj = {};
  obj.error = true;
  if (ajaxResults[0]) {
    var result = ajaxResults[0];
    var result_simplified = result.replace(/\,{2}/g, ',null,').replace(/\,{2}/g, ',null,').replace(/\[\,/g, "[null,");
    if (result_simplified) {
      var arr = [];
      try {arr = JSON.parse(result_simplified)} catch(e) {}
      if (arr) {
        var sourceLang = '', src1 = '', src2 = '';
        if (arr[2]) src1 = arr[2];
        if (arr[8] && arr[8][0] && arr[8][0][0]) src2 = arr[8][0][0];
        if (src1) sourceLang = src1;
        else if (src2) sourceLang = src2;
        obj.sourceLang = sourceLang;
        obj.targetLang = config.translator.to;
        autoDetectedLang = sourceLang;
        if (sourceLang == config.translator.to) {
          var result = ajaxResults[1];
          var result_simplified = result.replace(/\,{2}/g, ',null,').replace(/\,{2}/g, ',null,').replace(/\[\,/g, "[null,");
          if (result_simplified) {
            try {
              arr = JSON.parse(result_simplified);
              obj.targetLang = config.translator.alt;
            } catch (e) {}
          }
        }
        if (arr) {
          if (arr[0]) {
            obj.definition = '';
            obj.word = decodeURIComponent(decodeURIComponent(inputWord));
            for (var i = 0; i < arr[0].length; i++) {
              if (arr[0][i][0] && arr[0][i][1]) {
                var sentence = arr[0][i][0];
                /*  */
                sentence = sentence.replace(/ +\, +/g, ', ').replace(/ +\u060c +/g, '\u060c ').replace(/ +\. +/g, '. ');
                obj.definition += sentence;
                obj.error = false;
              }
            }
          }
          if (arr[1]) {
            var elm = arr[1];
            var detailDefinition = [];
            for (var i = 0; i < elm.length; i++) {
              var entry = [];
              var pos = elm[i][0];
              for (var k = 0; k < elm[i][2].length; k++) {
                var word = elm[i][2][k][0];
                var reverse_translation = elm[i][2][k][1];
                var score = elm[i][2][k][3];
                var line = {"word": word, "reverse_translation": reverse_translation, "score": score};
                entry.push(line);
              }
              detailDefinition.push({"pos": pos, "entry": entry});
            }
            obj.detailDefinition = detailDefinition;
          }
          if (arr[4] && arr[4][0] && arr[4][0][0]) obj.definition_backup = arr[4][0][0];
          if (arr[5] && arr[5][0] && arr[5][0][0]) obj.word_backup = arr[5][0][0];
          obj.wordIsCorrect = true;
          obj.correctedWord = '';
          if (arr[7] && arr[7][0]) { /* spell-check */
            obj.wordIsCorrect = false;
            obj.correctedWord = arr[7][1];
          }
          if (arr[11]) {
            var elm = arr[11];
            var synonyms = [];
            for (var i = 0; i < elm.length; i++) {
              var entry = [];
              var pos = elm[i][0];
              for (var k = 0; k < elm[i][1].length; k++) entry.push(elm[i][1][k][0]);
              synonyms.push({"pos": pos, "entry": entry});
            }
            obj.synonyms = synonyms;
          }
          if (arr[14] && arr[14][0]) obj.similar_words = arr[14][0];
        }
      }
    }
  }
  return obj;
}

function oldTranslationEngine(inputWord, ajaxResults) {
  var obj = {}, definition = '', wordIsCorrect = false, correctedWord = '', detailDefinition = [], sourceLang = '', error = true;
  try {obj = JSON.parse(ajaxResults[0])} catch(e) {}
  if (obj.src) {
    sourceLang = obj.src;
    autoDetectedLang = obj.src;
  }
  if (sourceLang == config.translator.to) try {obj = JSON.parse(ajaxResults[1])} catch (e) {};
  /*  */
  inputWord = decodeURIComponent(inputWord);
  var cnd1 = !obj.spell || (obj.spell && obj.spell.spell_res == inputWord.toLowerCase());
  var cnd2 = obj.spell && obj.spell.spell_res.replace(/[\-]/g,'') == inputWord.toLowerCase();
  var cnd3 = obj.dict || obj.sentences;
  if ((cnd1 || cnd2) && cnd3) {
    wordIsCorrect = true;
    definition = obj.sentences.reduce(function(p,c) {return p + c.trans}, "");
  } else correctedWord = obj.spell.spell_res;
  if (obj.dict) detailDefinition = obj.dict;
  if (inputWord && definition && sourceLang) error = false;
  var result = {
    "error": error,
    "word": inputWord,
    "definition": definition,
    "sourceLang": sourceLang,
    "wordIsCorrect": wordIsCorrect,
    "correctedWord": correctedWord,
    "detailDefinition": detailDefinition
  };
  /*  */
  return result;
}

function getTranslation(word) {
  word = word.trim();
  word = word.toLowerCase();
  word = word.replace(/\%/g, '');
  /*  */
  if (config.translator.useCache === 'true') {
    var arr = config.history.data;
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i][3];
      if (obj) {
        var flag1 = (obj.sourceLang === config.translator.from || 'auto' === config.translator.from);
        var flag2 = (obj.targetLang === config.translator.to);
        var flag3 = obj.word == word;
        if (flag1 && flag2 && flag3) {
          var d = app.Promise.defer();
          if (obj.token) globalToken = obj.token;
          d.resolve(obj);
          return d.promise;
        }
      }
    }
  }
  return _getTranslation(word, null);
}
/*  */
function _getTranslation(word, arr) {
  word = encodeURIComponent(word);
  var appGet, d = app.Promise.defer();
  if (arr) {
    globalToken = arr[0].token;
    appGet = app.Promise.all([app.get(arr[0].url), app.get(arr[1].url)]).then(function (results) {return results});
  } else {
    var token = function () {return calcToken(decodeURIComponent(word))};
    var parameters = '&hl=en&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at&dt=sw&ie=UTF-8&oe=UTF-8&ssel=0&tsel=0&tk=';
    var url_new_1 = m(6) + config.translator.from + '&tl=' + config.translator.to + parameters + token() + '&q=' + word;
    var url_new_2 = m(6) + config.translator.from + '&tl=' + config.translator.alt + parameters + token() + '&q=' + word;
    /*  */
    if (url_new_1 == url_new_2) appGet = app.get(url_new_1).then(function (result) {return [result, result]});
    else appGet = app.Promise.all([app.get(url_new_1), app.get(url_new_2)]).then(function (results) {return results});
  }
  /*  */
  appGet.then(function (results) {
    var obj = newTranslationEngine(word, results);
    sourceLanguage = obj.sourceLang;
    obj.phrasebook = findPhrasebook(obj.word, obj.definition);
    obj.isVoice = languagesNoVoice.indexOf(config.translator.from) === -1;
    if (!obj.error && obj.wordIsCorrect) {
      obj.token = globalToken;
      saveToHistory({"data": obj, "word": obj.word, "definition": obj.definition});
    }
    d.resolve(obj);
  }, function (e) {
    if (e && e.status === 403) {
      if (TKK_TIMER) window.clearTimeout(TKK_TIMER);
      TKK_TIMER = window.setTimeout(function () {
        app.notification("Google Translator", "Addon is updating some data from 'translate.google.com', please wait...");
        app.tab.open("https://translate.google.com/");
        NOTIFICATION_UPDATE = true;
      }, 1000);
    }
    d.resolve({
      "word": '',
      "definition": '',
      "sourceLang": '',
      "wordIsCorrect": '',
      "correctedWord": '',
      "detailDefinition": '',
      "error": (e && e.status === 403) ? 'TKK' : 'NET'
    });
  });
  /*  */
  return d.promise;
}

function popupSendInits() {
  app.popup.send("initialization-response", {
    "height": parseInt(config.translator.height),
    "width": parseInt(config.translator.width),
    "from": config.translator.from,
    "to": config.translator.to
  });
}

app.popup.receive("change-to-select-request", function (e) {config.translator.to = e});
app.popup.receive("change-from-select-request", function (e) {config.translator.from = e});
app.popup.receive("translation-request", function (e) {getTranslation(e).then(function (o) {app.popup.send("translation-response", o)})});

app.popup.receive("toggle-request", function () {
  var from = config.translator.to;
  var to = config.translator.from;
  from = (from === '' ? 'en' : from);
  to = (to === 'auto' ? autoDetectedLang : to);
  config.translator.from = from;
  config.translator.to = to;
  popupSendInits();
});

app.popup.receive("initialization-request", function () {
  popupSendInits();
  app.popup.send("history-update", config.history.data);
});

function openPage(obj) {
  switch (obj.page) {
    case 'settings': app.tab.openOptions(); break;
    case 'faq': app.tab.open(m(0) + 'fromApp'); break;
    case 'define': app.tab.open(m(2) + config.translator.from + "/" + config.translator.to + "/" + obj.word); break;
  }
}

app.popup.receive("open-page", openPage);
app.content_script.receive("open-page", openPage);

function playVoice(data) {
  function splitString(str, n) {
    var words = str.split(/\s+/g), result = [], tmp = [], count = 0;
    for (var i = 0; i < words.length; i++) {
      tmp.push(words[i]); count++;
      if (count == n || i == words.length - 1) {
        result.push(tmp.join(" "));
        tmp = [], count = 0;
      }
    }
    return result;
  }
  /*  */
  function token(str) {return calcToken(decodeURIComponent(str))}
  /*  */
  var lang = data.lang || config.translator.from;
  lang = (lang === 'auto' ? autoDetectedLang : lang);
  var text = data.word || '', audioUrl = [];
  /*  */
  if (false) {
    var url = m(3) + text + "&tl=" + lang + "&total=1&textlen=" + text.length + "&tk=" + globalToken + "&client=t";
    app.play(url, function (msg) {if (msg === 'error') app.notification("Google Translator", "Text-to-Speech Error: The sentence is Too long, or there was a Text-to-Speech internal API bug.")});
  } else {
    text = text.replace(/\'/g, '').replace(/\"/g, '').split(/\.|\,|\;|\u060c|\?|\!|\:/g);
    for (var i = 0; i < text.length; i++) {
      var subtext = splitString(text[i], 13); /* 13 words max */
      for (var j = 0; j < subtext.length; j++) {
        if (subtext[j].length) audioUrl.push(m(3) + subtext[j] + "&tl=" + lang + "&total=1&textlen=" + subtext[j].length + "&tk=" + (globalToken || token(subtext[j])) + "&client=t");
      }
    }
    var k = 0;
    var playRecursion = function () {
      if (audioUrl[k]) app.play(audioUrl[k], function (flag) {if (flag !== 'error') k++; if (k < audioUrl.length) playRecursion()});
    };
    playRecursion();    
  }
}

var bookmark = {
  "server": function (question, answer, action, id) {
    var d = app.Promise.defer();
    var from = config.translator.from;
    if (from == "auto") from = sourceLanguage || "en";
    var to = config.translator.to;
    app.get(m(2) + from + "/" + to + "/ok").then(function (content) {
      var usage = /USAGE\=\'([^\'\ ]*)\'/.exec(content);
      if (usage && usage.length) {
        usage = usage[1];
        var url = m(4) + action + "&sl=" + from + "&tl=" + to + "&ql=3&hl=en&xt=" + usage;
        app.get(url, {"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"}, action == "a" ? {q: question, utrans: answer} : {id: id}).then (function (content) {
          var key = /\"([^\"]*)\"/.exec(content)[1];
          if (key && key.length) d.resolve(key[1]);
          else d.reject({message: "no-key"});
        }, d.reject);
      }
    });
    /*  */
    return d.promise;
  },
  "onSuccess": function (data, key) {saveToHistory({"word": data.question, "definition": data.answer, "phrasebook": key, "data": data})},
  "onReject": function (e) {
    if (e.message === "no-key") app.notification("Google Translator", "Internal error. Are you logged-in to your Google account?");
    if (e.message === "Unauthorized" || e.status === 401) app.notification("Google Translator", "In order to save to Favourites, please sign-in to your Google account first!");
  }
};

app.popup.receive("add-to-phrasebook", function (data) {
  bookmark.server(data.question, data.answer, 'a').then(
    function (key) {
      app.popup.send("saved-to-phrasebook");
      bookmark.onSuccess(data, key);
    }, function (e) {
      app.popup.send("failed-phrasebook", '');
      bookmark.onReject(e);
    }
  );
});

app.popup.receive("remove-from-phrasebook", function (data) {
  var id = findPhrasebook(data.question, data.answer);
  if (!id) return;
  /*  */
  bookmark.server(data.question, data.answer, 'd', id).then(
    function () {
      app.popup.send("removed-from-phrasebook");
      bookmark.onSuccess(data, '');
    }, function (e) {
      app.popup.send("failed-phrasebook", "saved");
      bookmark.onReject(e);
    }
  );
});

var initPageTranslation = function (word) {
  getTranslation(word).then(function (obj) {
    wordForSwapRequest = obj.definition;
    obj["width"] = config.translator.iwidth;
    obj["height"] = config.translator.iheight;
    obj["autoAdjustSize"] = config.translator.autoAdjustSize;
    /*  */
    var _word = obj.word.toLowerCase();
    var _definition = obj.definition.toLowerCase();
    obj.mapTargetLang = languagesMapName[obj.targetLang] || obj.targetLang;
    obj.mapSourceLang = languagesMapName[obj.sourceLang] || obj.sourceLang;
    if (_word === _definition) obj.definition = obj.definition + " :: " + obj.mapSourceLang + " > " + obj.mapTargetLang;
    app.content_script.send("translation-response", obj);
  });
};

app.content_script.receive("toggle-request", function () {
  var from = config.translator.to;
  var to = config.translator.from;
  from = (from === '' ? 'en' : from);
  to = to === 'auto' ? autoDetectedLang : to;
  config.translator.from = from;
  config.translator.to = to;
  initPageTranslation(wordForSwapRequest);
});

var sendOptionsToPage = function () {
  app.content_script.send("options-response", {
    "bubbleRGB": config.settings.bubbleRGB,
    "isDblclick": (config.settings.dbClick === "true"),
    "translateIconTime": config.settings.translateIconTime,
    "translateIconShow": config.settings.translateIconShow,
    "isTranslateIcon": (config.settings.showIcon === "true"),
    "isTextSelection": (config.settings.selection === "true"),
    "iconTopCorner": (config.settings.iconTopCorner === "true"),
    "translateInputArea": (config.settings.translateInputArea === "true"),
    "minimumNumberOfCharacters": config.settings.minimumNumberOfCharacters,
    "isMouseOverTranslation": (config.settings.mouseOverTranslation === "true")
  }, true);
};

var createContextMenu = function () {
  app.context_menu.create("Define in Google Translate", "selection", function () {app.content_script.send("context-menu-word-request")});
  app.context_menu.create("Translate page in Google Translate", "page", function () {app.content_script.send("context-menu-url-request")});
};

app.popup.receive("play-voice", playVoice);
app.content_script.receive("play-voice", playVoice);
app.content_script.receive("options-request", sendOptionsToPage);
app.content_script.receive("translation-request", initPageTranslation);
var removeContextMenu = function () {app.context_menu.remove(function () {})};
window.setTimeout(function () {if (config.settings.contextMenu === 'true') createContextMenu()}, 500);
app.popup.receive("check-voice-request", function () {app.popup.send("check-voice-response", languagesNoVoice)});
app.content_script.receive("context-menu-word-response", function (word) {app.tab.open(m(2) + config.translator.from + '/' + config.translator.to + '/' + word)});

app.content_script.receive("context-menu-url-response", function (url) {
  var to = config.translator.to;
  var from = config.translator.from;
  url = m(5) + url + "&sl=" + from + "&tl=" + to;
  if (config.settings.translateInNewTab === 'true') app.tab.open(url);
  else app.content_script.send("context-menu-reload-page", url);
});

app.content_script.receive("add-to-phrasebook", function (data) {
  bookmark.server(data.question, data.answer, "a").then(
    function (key) {
      app.content_script.send("saved-to-phrasebook");
      bookmark.onSuccess(data, key);
    }, function (e) {
      app.content_script.send("failed-phrasebook", '');
      bookmark.onReject(e);
    }
  )
});

app.content_script.receive("remove-from-phrasebook", function (data) {
  var id = findPhrasebook(data.question, data.answer);
  if (!id) return;
  /*  */
  bookmark.server(data.question, data.answer, "d", id).then(
    function () {
      app.content_script.send("removed-from-phrasebook");
      bookmark.onSuccess(data, '');
    }, function (e) {
      app.content_script.send("failed-phrasebook", "saved");
      bookmark.onReject(e);
    }
  )
});

app.options.receive("changed", function (o) {
  config.set(o.pref, o.value);
  app.options.send("set", {"pref": o.pref, "value": config.get(o.pref)});
  sendOptionsToPage();
  /*  */
  if (config.settings.contextMenu === 'true') createContextMenu();
  if (config.settings.contextMenu === 'false') removeContextMenu();
});

app.options.receive("clearOptionsHistory", clearHistory);
app.options.receive("set-history-update", function (data) {config.history.data = data});
app.options.receive("get", function (pref) {app.options.send("set", {"pref": pref, "value": config.get(pref)})});
app.options.receive("get-history-update", function () {app.options.send("history-update", config.history.data)});

app.onBeforeSendHeaders(function (info) {
  var _url = info.url;
  if (_url.indexOf("/translate_tts?") !== -1 || _url.indexOf("/translate_a/") !== -1) {
    var _headers = info.requestHeaders;
    for (var i = 0; i < _headers.length; i++) {
      var _name = _headers[i].name.toLowerCase();
      if (_name === 'referer') {
        _headers[i].value = "https://translate.google.com/";
        return {"requestHeaders": _headers};
      }
    }
    var tmp = {"name": "referer", "value": "https://translate.google.com/"};
    _headers.push(tmp);
    return {"requestHeaders": _headers};
  }
});