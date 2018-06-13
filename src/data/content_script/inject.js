var manifest = {"url": chrome.extension.getURL('')};

var background = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path == 'background-to-page') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": 'page-to-background', "method": id, "data": data})}
  }
})();

var init = function () {
  var isDblclick = false;
  var iconTopCorner = true;
  var translateIconShow = 0;
  var translateIconTime = 3;
  var isTranslateIcon = false;
  var isTextSelection = false;
  var word, definition, keyCode;
  var translateInputArea = true;
  var minimumNumberOfCharacters = 2;
  var isMouseOverTranslation = false;
  var timeoutIconShow, timeoutIconHide;
  var allowMouseOverTranslation = true;
  var bubbleRGB = "rgb(222, 184, 135)";
  var bubble, header, header_w, header_d, content, footer, bookmarks, toggle, voice, home, settings, faq;
  /*  */
  var html = function (tag, attrs, parent) {
    if (!attrs) attrs = {};
    var elm = document.createElement(tag);
    for (var i in attrs) elm.setAttribute(i, attrs[i]);
    if (parent) parent.appendChild(elm);
    return elm;
  };
  /*  */
  var dir = function (e) {
    var wGCS = window.getComputedStyle(e, null);
    if (wGCS) {
      var text_direction = wGCS.direction || '';
      if (text_direction === 'rtl') e.style.textAlign = "right";
      if (text_direction === 'ltr') e.style.textAlign = "left";
    }
  };
  /*  */
  var getSelectedRect = function (w) {
    try {
      if (w.rangeCount) {
        var range = w.getRangeAt(0).cloneRange();
        if (range.startOffset !== range.endOffset) {
          var rect = range.getBoundingClientRect();
          return rect;
        }
        else if (range.startOffset === 0 && range.endOffset === 0) return null;
        else {
          var arr = range.startContainer.childNodes;
          for (var i = 0; i < arr.length; i++) {
            var target = arr[i].nodeName.toLowerCase();
            if (target.indexOf('text') !== -1 || target.indexOf('input') !== -1) {
              var rect = getTextBoundingRect(arr[i], arr[i].selectionStart, arr[i].selectionEnd);
              if (rect.top && rect.left && rect.height && rect.width) return rect;
              else return null;
            }
          }
          range.collapse(false);
          var dummy = document.createElement("span");
          range.insertNode(dummy);
          var rect = dummy.getBoundingClientRect();
          dummy.parentNode.removeChild(dummy);
          return rect;
        }
      } else return null;
    } catch (e) {return null}
  };
  /*  */
  var requestBubbleTranslation = function (e) {
    header.textContent = '';
    content.textContent = '';
    header_w.textContent = '';
    header_d.textContent = '';
    content.style.display = "none";
    mainDIV.style.display = 'block';
    allowMouseOverTranslation = false;
    header.style.width = (264) + "px";
    mainDIV.style.width = (274) + "px";
    mainDIV.style.height = (80) + "px";
    translateIcon.style.display = 'none';
    var rect = requestBubbleTranslation.rect;
    header.parentNode.style.backgroundImage = "url(" + manifest.url + "data/icons/loading.gif)";
    mainDIV.style.top = (rect && rect.top ? (rect.top + window.scrollY + rect.height) : (e.clientY + window.scrollY + 40)) + 'px';
    mainDIV.style.left = (rect && rect.left ? (rect.left + window.scrollX - 23 + rect.width / 2) : (e.clientX + window.scrollX - 40)) + 'px';
    /*  */
    background.send("translation-request", requestBubbleTranslation.text);
  };
  /*  */
  var showTranslateIcon = function (e) {
    var rect = requestBubbleTranslation.rect;
    var offsetY_1 = iconTopCorner ? -18 : 18;
    var offsetY_2 = iconTopCorner ? -30 : 30;
    if (timeoutIconShow) window.clearTimeout(timeoutIconShow);
    if (timeoutIconHide) window.clearTimeout(timeoutIconHide);
    timeoutIconHide = window.setTimeout(function () {translateIcon.style.display = "none"}, translateIconTime * 1000);
    timeoutIconShow = window.setTimeout(function () {translateIcon.style.display = "block"}, translateIconShow * 1000);
    translateIcon.style.top = (rect && rect.top ? (rect.top + window.scrollY + offsetY_1) : (e.clientY + window.scrollY + offsetY_2)) + 'px';
    translateIcon.style.left = (rect && rect.left ? (rect.left + window.scrollX + rect.width - 2) : (e.clientX + window.scrollX + 10)) + 'px';
  };
  /*  */
  var mainDIV = html("div", {"class": "igtranslator-main-div"}, document.body);
  var iFrame = html("iframe", {"src": "about:blank", "class": "igtranslator-iframe", "scrolling": "no", "frameborder": 0}, mainDIV);
  /*  */
  window.setTimeout(function () {
    if (iFrame.contentDocument) {
      var cssLink = html("link", {"href": manifest.url + "data/content_script/inject.css", "rel": "stylesheet", "type": "text/css"}, iFrame.contentDocument.head);
      bubble = html("table", {"class": "igtranslator-bubble"}, iFrame.contentDocument.body);
      var header_td = html("td", {colspan: 6, "class": "igtranslator-header"}, html("tr", {}, bubble));
      content = html("tbody", {"class": "igtranslator-content"}, html("table", {style: "width: 100%"}, html("td", {colspan: 6}, html("tr", {}, bubble))));
      footer = html("tr", {"class": "igtranslator-footer"}, bubble);
      header_w = html("pre", {dir: "auto"}, header_td);
      header = html("pre", {dir: "auto"}, header_td);
      header_d = html("pre", {dir: "auto"}, header_td);
      /*  */
      bookmarks = html("td", {style: "background-image: url(" + manifest.url + "data/icons/bookmarks.png)", title: "Save to Phrasebook"}, footer);
      toggle = html("td", {style: "background-image: url(" + manifest.url + "data/icons/toggle.png)", title: "Swap Languages"}, footer);
      voice = html("td", {style: "background-image: url(" + manifest.url + "data/icons/voice.png)", title: "Listen"}, footer);
      home = html("td", {style: "background-image: url(" + manifest.url + "data/icons/home.png)", title: "Open Google Translate"}, footer);
      settings = html("td", {style: "background-image: url(" + manifest.url + "data/icons/settings.png)", title: "Open Settings"}, footer);
      faq = html("td", {style: "background-image: url(" + manifest.url + "data/icons/faq.png)", title: "Open FAQ|Support Page"}, footer);
      /*  */
      bookmarks.addEventListener("click", function () {
        if (!bookmarks.getAttribute("status")) background.send("add-to-phrasebook", {"question": word, "answer": definition});
        else background.send("remove-from-phrasebook", {"question": word, "answer": definition});
        bookmarks.style.backgroundImage = "url(" + manifest.url + "data/icons/bookmarks-loading.gif)";
      }, false);
      toggle.addEventListener("click", function () {
        background.send("toggle-request");
        toggle.style.backgroundImage = "url(" + manifest.url + "data/icons/bookmarks-loading.gif)";
      }, false);
      voice.addEventListener("click", function () {
        var isVoice = voice.getAttribute("isVoice") == "true";
        if (!isVoice) return;
        background.send("play-voice", {"word": word});
      }, false); 
      home.addEventListener("click", function (e) {background.send("open-page", {"page": 'define', "word": word})});
      settings.addEventListener("click", function () {background.send("open-page", {"page": 'settings'})}, false);
      faq.addEventListener("click", function () {background.send("open-page", {"page": 'faq'})}, false);
    }
    /*  */
    if (iFrame.contentWindow) {
      iFrame.contentWindow.addEventListener("resize", function (e) {
        var mainDIVStyle = window.getComputedStyle(mainDIV, null);
        if (mainDIVStyle) {
          var mainDIVH = mainDIVStyle.getPropertyValue("height");
          if (mainDIVH && mainDIVH !== "auto") content.style.height = parseInt(mainDIVH) - 80 + "px";
        }
      });
    }
  }, 500);
  /*  */
  var colorLevel0 = '', colorLevel1 = '', colorLevel2 = '';
  function colorBubble() {
    function shadeRGBColor(color, percent) {
      var f = color.split(","), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = parseInt(f[0].slice(4)), G = parseInt(f[1]), B = parseInt(f[2]);
      return "rgb(" + (Math.round((t - R) * p) + R) + "," + (Math.round((t - G) * p) + G) + ","+(Math.round((t - B) * p) + B) + ")";
    }
    /* 0 <dark --- light> 100 */
    colorLevel0 = shadeRGBColor(bubbleRGB, 0.00);
    colorLevel1 = shadeRGBColor(bubbleRGB, 0.30);
    colorLevel2 = shadeRGBColor(bubbleRGB, 0.60);
    /*  */
    var doc = iFrame.contentDocument;
    if (doc) {
      var id = "igtranslator-color";
      var style = doc.getElementById(id);
      if (style) style.parentNode.removeChild(style);
      var style = doc.createElement("style");
      style.setAttribute("type", "text/css");
      style.setAttribute("id", id);
      var head = doc.querySelector("head") || doc.head || doc.documentElement;
      if (head) head.appendChild(style);
      style.sheet.insertRule(".igtranslator-bubble {background-color: " + colorLevel2 + "; border: solid 1px " + colorLevel0 + ";}", 0);
      style.sheet.insertRule(".igtranslator-bubble:before {border-bottom-color: " + colorLevel0 + " !important;}", 1);
      style.sheet.insertRule(".igtranslator-bubble:after {border-bottom-color: " + colorLevel2 + " !important;}", 2);
      style.sheet.insertRule(".igtranslator-content {border-top: solid 1px " + colorLevel0 + ";}", 3);
      style.sheet.insertRule(".igtranslator-footer td {background-color: " + colorLevel1 + "; border: solid 1px " + colorLevel0 + ";}", 4);
      style.sheet.insertRule(".igtranslator-footer td:hover {background-color: " + colorLevel0 + ";}", 5);
    }
    /*  */
    var style = document.getElementById(id);
    if (style) style.parentNode.removeChild(style);
    var style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("id", id);
    var head = document.querySelector("head") || document.head || document.documentElement;
    if (head) head.appendChild(style);
    style.sheet.insertRule(".igtranslator-activator-icon {background-color: " + colorLevel0 + " !important;}", 0);
  }
  colorBubble();
  /*  */
  var translateIcon = html("div", {
    "class": "igtranslator-activator-icon bounceIn",
    "style": "background-image: url(" + manifest.url + "data/icons/home.png)",
    "title": "Click to Show Translation"
  }, document.body);
  translateIcon.addEventListener("click", requestBubbleTranslation, false);
  /*  */
  background.receive("context-menu-reload-page", function (url) {document.location.href = url});
  background.receive("context-menu-url-request", function () {background.send("context-menu-url-response", document.location.href)});
  background.receive("context-menu-word-request", function () {background.send("context-menu-word-response", window.getSelection().toString())});
  /*  */
  background.receive("translation-response", function (data) {
    header.textContent = '';
    content.textContent = '';
    header_w.textContent = '';
    header_d.textContent = '';
    mainDIV.style.width = data.width + "px";
    mainDIV.style.height = data.height + "px";
    toggle.style.backgroundImage = "url(" + manifest.url + "data/icons/toggle.png)";
    /*  */
    if (!data.wordIsCorrect && data.correctedWord) background.send("translation-request", data.correctedWord);
    else {
      word = data.word;
      definition = data.definition;
      if (typeof header === 'undefined') return;
      header.parentNode.style.backgroundImage = "none";
      content.style.display = "block";
      if (data.error) {
        if (data.error === "TKK") header.textContent = "Addon needs to update some data from 'translate.google.com', please try again after few seconds...";
        else header.textContent = "NET Error: Cannot Access Google Translate!";
        /*  */
        onlyHeader = true;
        header.style.width = "420px";
        content.style.display = "none";
        header.style.fontSize = "100%";
        header.style.textAlign = "left";
        content.style.backgroundImage = "url(" + manifest.url + "data/icons/error.png)";
        voice.style.backgroundImage = "url(" + manifest.url + "data/icons/novoice.png)";
        voice.setAttribute("isVoice", "no");
      } else {
        content.style.backgroundImage = "none";
        if (data.phrasebook) {
          bookmarks.style.backgroundImage = "url(" + manifest.url + "data/icons/bookmarks-saved.png)";
          bookmarks.setAttribute("status", "saved");
        } else {
          bookmarks.style.backgroundImage = "url(" + manifest.url + "data/icons/bookmarks.png)";
          bookmarks.removeAttribute("status");
        }
        voice.style.backgroundImage = "url(" + manifest.url + "data/icons/" + (data.isVoice ? "" : "no") + "voice.png)";
        voice.setAttribute("isVoice", data.isVoice);
        /*  */
        var synonyms = data.synonyms;
        var similars = data.similar_words;
        var details = data.detailDefinition;
        var flag1 = false, flag2 = false, flag3 = false, onlyHeader = false, extraHeight = 25, extraWidth = 0;
        /*  */
        if (details && details.length) {
          header_w.textContent = word ? word : 'N/A';
          header.textContent = ' : ';
          header.style.whiteSpace = 'pre';
          header_d.textContent = definition ? definition : "Definition Not Found!";
        } else header.textContent = definition ? definition : "Definition Not Found!";
        /*  */
        var tr = html("tr", {style: ''}, content);
        var _language = html("td", {style: "color: #777; font-size: 90%"}, tr);
        _language.textContent = "Language";
        var _detected = html("td", {colspan: 2, style: "color: #444; font-size: 90%"}, tr);
        _detected.textContent = data.mapSourceLang + ' > ' + data.mapTargetLang;
        /*  */
        if (details && details.length) {
          flag1 = true;
          details.forEach(function (detail) {
            var pos = html("td", {style: "color: #777; font-style: italic;"}, html("tr", {}, content)).textContent = detail.pos;
            detail.entry.forEach(function (entry) {
              var tr = html("tr", {style: ""}, content);
              var score = Math.round((entry.score || 0) * 90) + 10;
              html("div", {"style": "width: 32px; height: 7px; background: linear-gradient(90deg, " + colorLevel0 + " " + score + "%, " + colorLevel1 + " " + score + "%);"}, html("td", {}, tr));
              var direct_translation = html("td", {dir: "auto"}, tr);
              direct_translation.textContent = entry.word;
              dir(direct_translation);
              var reverse_translation = html("td", {dir: "auto"}, tr);
              if (entry.reverse_translation) {
                reverse_translation.textContent = entry.reverse_translation.join(", ");
                dir(reverse_translation);
              }
            });
          });
        }
        /*  */
        if (synonyms && synonyms.length) {
          flag2 = true;
          synonyms.forEach(function (synonym) {
            var pos = html("td", {style: "color: #777; font-style: italic;"}, html("tr", {}, content)).textContent = "synonyms";
            synonym.entry.forEach(function (entry) {
              var tr = html("tr", {style: ""}, content);
              html("div", {style: "width: 32px; height: 7px; background: linear-gradient(90deg, " + colorLevel0 + " " + 0 + "%, " + colorLevel1 + " " + 0 + "%);"}, html("td", {}, tr));
              var pos = html("td", {dir: "auto", style: "color: #777; font-style: italic;"}, tr);
              pos.textContent = synonym.pos;
              dir(pos);
              var translation_synonyms = html("td", {dir: "auto"}, tr);
              translation_synonyms.textContent = entry.join(", ");
              dir(translation_synonyms);
            });
          });
        }
        /*  */
        if (similars && similars.length) {
          flag3 = true;
          var tr = html("tr", {}, content);
          html("div", {style: "width: 32px; height: 7px; background: linear-gradient(90deg, " + colorLevel0 + " " + 0 + "%, " + colorLevel1 + " " + 0 + "%);"}, html("td", {}, tr));
          var pos = html("td", {style: "color: #777; font-style: italic;"}, tr);
          pos.textContent = "see also";
          var translation_similars = html("td", {dir: "auto"}, tr);
          translation_similars.textContent = similars.join(", ");
          dir(translation_similars);
        }
        /*  */
        if (!flag1 && !flag2 && !flag3) {
          onlyHeader = true;
          header.style.width = "388px";
          content.style.display = "none";
          header.style.fontSize = "100%";
          header.style.whiteSpace = 'pre-line';
          if (header.textContent.length > 50) header.style.textAlign = "justify";
        } else header.style.width = "auto";
      }
    }
    /*  */
    window.setTimeout(function () {
      var wGCSB = window.getComputedStyle(bubble, null);
      var wGCSC = window.getComputedStyle(content, null);
      if (wGCSB && wGCSC) {
        var mdWidth, mdHeight;
        var Wb = wGCSB.getPropertyValue("width");
        var Hb = wGCSB.getPropertyValue("height");
        var Wc = wGCSC.getPropertyValue("width");
        var Hc = wGCSC.getPropertyValue("height");
        /*  */
        if (Wb.indexOf("px") === -1 || !parseInt(Wb)) {
          if (Wc.indexOf("px") === -1 || !parseInt(Wc)) mdWidth = "auto";
          else mdWidth = parseInt(Wc) + 40 + "px";
        } else mdWidth = Wb;
        /*  */
        if (Hb.indexOf("px") === -1 || !parseInt(Hb)) {
          if (Hc.indexOf("px") === -1 || !parseInt(Hc)) mdHeight = "auto";
          else mdHeight = parseInt(Hc) + 80 + "px";
        } else mdHeight = Hb;
        /*  */
        if (Wb.indexOf("px") !== -1 && Wc.indexOf("px") !== -1) {
          if (parseInt(Wb) && parseInt(Wc)) {
            if (parseInt(Wb) > (parseInt(Wc) + 50) && !onlyHeader) mdWidth = parseInt(Wc) + 40 + "px";
          }
        }
        /*  */
        if (Hb.indexOf("px") !== -1 && Hc.indexOf("px") !== -1) {
          if (parseInt(Hb) && parseInt(Hc)) {
            if (parseInt(Hb) > (parseInt(Hc) + 90) && !onlyHeader) mdHeight = parseInt(Hc) + 80 + "px";
          }
        }
        /*  */
        if (!onlyHeader) {
          extraWidth = 0;
          extraHeight = 100;
          /*  */
          if (parseInt(mdWidth) < 400) mdWidth = "400px";
          if (parseInt(mdHeight) < 130) mdHeight = "130px";
          if (parseInt(mdWidth) > data.width) mdWidth = data.width + "px";
          if (parseInt(mdHeight) > data.height) mdHeight = data.height + "px";
        } else {
          extraHeight = 40;
          header.style.width = "auto";
        }
        /*  */
        if (data.autoAdjustSize + '' === "true") {
          content.style.width = "auto";
          mainDIV.style.width = (parseInt(mdWidth) + extraWidth) + "px";
          mainDIV.style.height = (parseInt(mdHeight) + extraHeight) + "px";
          content.style.height = (parseInt(mdHeight) + extraWidth - 75) + "px";
        } else {
          mainDIV.style.width = parseInt(data.width) + "px";
          mainDIV.style.height = parseInt(data.height) + "px";
          content.style.height = (parseInt(data.height) - 85) + "px";
        }
        /*  */
        function smoothScrollTo(duration) {
          var factor = 0, timer, start = Date.now();
          if (timer) window.clearInterval(timer);
          smoothScroll = {"scrollTo": true, "scrollX": window.scrollX, "scrollY": window.scrollY};
          var step = function () {
            var left = mainDIV.offsetLeft;
            var width = mainDIV.offsetWidth;
            factor = (Date.now() - start) / duration;
            window.scrollTo(window.scrollX + factor * parseInt(mdWidth), window.scrollY);
            if (window.pageXOffset + window.innerWidth > left + width) {
              window.clearInterval(timer);
              factor = 1;
              return;
            }
          };
          timer = window.setInterval(step, 10);
        }
        /*  */
        if (!isMouseOverTranslation && mainDIV.offsetLeft > window.innerWidth - parseInt(mdWidth)) smoothScrollTo(800);
        allowMouseOverTranslation = true;
      }
    }, 100);
  });
  /*  */
  var smoothScroll = {};
  function hideBubble(e) {
    var target = e.target || e.originalTarget;
    while (target.parentNode && target.getAttribute) {
      if (target == bubble || target == translateIcon || target == iFrame || target == mainDIV) return;
      target = target.parentNode;
    }
    /*  */
    translateIcon.style.display = 'none';
    mainDIV.style.display = 'none';
    mainDIV.style.width = (0) + "px";
    mainDIV.style.height = (0) + "px";
    if (smoothScroll.scrollTo) {
      window.scrollTo(smoothScroll.scrollX, smoothScroll.scrollY);
      smoothScroll = {scrollTo: false, windowScrollX: 0, windowScrollY: 0};
    }
  }
  /*  */
  document.addEventListener('mousedown', hideBubble, false);
  document.addEventListener('keyup', function (e) {keyCode = null}, false);
  document.addEventListener('keydown', function (e) {if (!e.metaKey && !e.altKey && e.keyCode !== 45 && e.keyCode !== 84) hideBubble(e)}, false);
  /*  */
  function getSelectedText(target) {
    function getTextSelection() {
      var selectedText = '';
      if (target.getAttribute("type")) {if (target.getAttribute("type").toLowerCase() === "checkbox") return ''}
      var value = target.value;
      if (value) {
        var startPos = target.selectionStart;
        var endPos = target.selectionEnd;
        if (!isNaN(startPos) && !isNaN(endPos)) selectedText = value.substring(startPos, endPos);
        return selectedText;
      } else return '';
    }
    var selectedText = window.getSelection().toString();
    if (!selectedText) selectedText = getTextSelection();
    return selectedText;
  }
  /*  */
  function getWordAtPoint(elem, x, y) {
    if (elem && elem.nodeType == elem.TEXT_NODE) {
      var range = elem.ownerDocument.createRange();
      range.selectNodeContents(elem);
      var currentPos = 0;
      var endPos = range.endOffset;
      while (currentPos + 1 < endPos) {
        range.setStart(elem, currentPos);
        range.setEnd(elem, currentPos+1);
        if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right  >= x && range.getBoundingClientRect().top  <= y && range.getBoundingClientRect().bottom >= y) {
          range.expand("word");
          var originalRange = range;
          range.detach();
          return (originalRange);
        }
        currentPos += 1;
      }
    } else {
      for (var i = 0; i < elem.childNodes.length; i++) {
        var range = elem.childNodes[i].ownerDocument.createRange();
        range.selectNodeContents(elem.childNodes[i]);
        if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right  >= x && range.getBoundingClientRect().top  <= y && range.getBoundingClientRect().bottom >= y) {
          range.detach();
          return (getWordAtPoint(elem.childNodes[i], x, y));
        } else range.detach();
      }
    }
    return (null);
  }
  /*  */
  function triggerTranslation(e) {
    var target = e.target;
    var flag0_1 = target.getAttribute("type") ? target.getAttribute("type") === "text" : true;
    var flag0_2 = target.getAttribute("type") ? target.getAttribute("type") === "search" : true;
    var flag0_3 = target.getAttribute("type") ? target.getAttribute("type") === "password" : true;
    var flag0 = target.localName.toLowerCase() === "input" && (flag0_1 || flag0_2 || flag0_3);
    var flag1 = target.localName.toLowerCase() === "textarea";
    var flag2 = target.getAttribute('contenteditable') === 'true';
    var flag3 = target.className.indexOf("editable") !== -1;
    var inputArea = flag0 || flag1 || flag2 || flag3;
    if (inputArea && !translateInputArea) return;
    /*  */
    var keyboard = e.metaKey || e.altKey || keyCode === 45 || keyCode === 84;
    var mouseup = (e.type === 'mouseup') && isTextSelection && keyboard;
    var dblclick = (e.type === 'dblclick') && isDblclick;
    /*  */
    if (false) {
      var range = getWordAtPoint(e.target, e.x, e.y);
      if (range) {
        var selectedText = range.toString();
        requestBubbleTranslation.text = selectedText;
        requestBubbleTranslation.rect = range.getBoundingClientRect();
        if (allowMouseOverTranslation) {
          if (selectedText && selectedText.length >= minimumNumberOfCharacters) requestBubbleTranslation(e);
        }
      }
    } else {
      var selectedText = getSelectedText(target);
      /*  */
      if (selectedText && selectedText.length >= minimumNumberOfCharacters) {
        requestBubbleTranslation.text = selectedText;
        requestBubbleTranslation.rect = getSelectedRect(window.getSelection());
        if (isTranslateIcon && mainDIV.style.display === 'none') showTranslateIcon(e);
        else if (dblclick || mouseup) requestBubbleTranslation(e);
      }
    }
  }
  /*  */
  document.addEventListener('mouseup', triggerTranslation, false);
  document.addEventListener('dblclick', triggerTranslation, false);
  /*  */
  background.send("options-request", null);
  background.receive("options-response", function (data) {
    bubbleRGB = data.bubbleRGB; 
    colorBubble();
    /*  */
    isDblclick = data.isDblclick;
    iconTopCorner = data.iconTopCorner;
    isTranslateIcon = data.isTranslateIcon;
    isTextSelection = data.isTextSelection;
    translateIconShow = data.translateIconShow;
    translateIconTime = data.translateIconTime;
    translateInputArea = data.translateInputArea;
    isMouseOverTranslation = data.isMouseOverTranslation;
    minimumNumberOfCharacters = data.minimumNumberOfCharacters;
  });
  /*  */
  background.receive("saved-to-phrasebook", function () {
    bookmarks.setAttribute("title", "Saved");
    bookmarks.setAttribute("status", "saved");
    bookmarks.style.backgroundImage = "url(" + manifest.url + "data/icons/bookmarks-saved.png)";
  });
  /*  */
  background.receive("removed-from-phrasebook", function () {
    bookmarks.setAttribute("title", "Save to Phrasebook");
    bookmarks.removeAttribute("status");
    bookmarks.style.backgroundImage = "url(" + manifest.url + "data/icons/bookmarks.png)";
  });
  /*  */
  background.receive("failed-phrasebook", function (status) {
    bookmarks.setAttribute("title", "Sign-in required");
    bookmarks.setAttribute("status", status);
    bookmarks.style.backgroundImage = "url(" + manifest.url + "data/icons/bookmarks" + (status ? "-saved" : "") + ".png)";
  });
  /*  */
  document.removeEventListener("DOMContentLoaded", init, false);
};

if (window.top === window) document.addEventListener("DOMContentLoaded", init, false);

function getTextBoundingRect(input, selectionStart, selectionEnd, debug) {
  // @author Rob W         http://stackoverflow.com/users/938089/rob-w
  // @name                 getTextBoundingRect
  if (!input || !('value' in input)) return input;
  if (typeof selectionStart == "string") selectionStart = parseFloat(selectionStart);
  if (typeof selectionStart != "number" || isNaN(selectionStart)) selectionStart = 0;
  if (selectionStart < 0) selectionStart = 0;
  else selectionStart = Math.min(input.value.length, selectionStart);
  if (typeof selectionEnd == "string") selectionEnd = parseFloat(selectionEnd);
  if (typeof selectionEnd != "number" || isNaN(selectionEnd) || selectionEnd < selectionStart) selectionEnd = selectionStart;
  if (selectionEnd < 0) selectionEnd = 0;
  else selectionEnd = Math.min(input.value.length, selectionEnd);
  if (typeof input.createTextRange == "function") {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveStart('character', selectionStart);
    range.moveEnd('character', selectionEnd - selectionStart);
    return range.getBoundingClientRect();
  }
  var offset = getInputOffset(), topPos = offset.top, leftPos = offset.left, width = getInputCSS('width', true), height = getInputCSS('height', true);
  var cssDefaultStyles = "white-space:pre;padding:0;margin:0;", listOfModifiers = ['direction', 'font-family', 'font-size', 'font-size-adjust', 'font-variant', 'font-weight', 'font-style', 'letter-spacing', 'line-height', 'text-align', 'text-indent', 'text-transform', 'word-wrap', 'word-spacing'];
  topPos += getInputCSS('padding-top', true);
  topPos += getInputCSS('border-top-width', true);
  leftPos += getInputCSS('padding-left', true);
  leftPos += getInputCSS('border-left-width', true);
  leftPos += 1;
  for (var i=0; i < listOfModifiers.length; i++) {
    var property = listOfModifiers[i];
    cssDefaultStyles += property + ':' + getInputCSS(property) +';';
  }
  var text = input.value, textLen = text.length, fakeClone = document.createElement("div");
  if (selectionStart > 0) appendPart(0, selectionStart);
  var fakeRange = appendPart(selectionStart, selectionEnd);
  if (textLen > selectionEnd) appendPart(selectionEnd, textLen);
  fakeClone.style.cssText = cssDefaultStyles;
  fakeClone.style.position = "absolute";
  fakeClone.style.top = topPos + "px";
  fakeClone.style.left = leftPos + "px";
  fakeClone.style.width = width + "px";
  fakeClone.style.height = height + "px";
  document.body.appendChild(fakeClone);
  var returnValue = fakeRange.getBoundingClientRect();
  if (!debug) fakeClone.parentNode.removeChild(fakeClone);
  return returnValue;
  function appendPart(start, end) {
    var span = document.createElement("span");
    span.style.cssText = cssDefaultStyles;
    span.textContent = text.substring(start, end);
    fakeClone.appendChild(span);
    return span;
  }
  function getInputOffset () {
    var body = document.body, win = document.defaultView, docElem = document.documentElement, box = document.createElement('div');
    box.style.paddingLeft = box.style.width = "1px";
    body.appendChild(box);
    var isBoxModel = box.offsetWidth == 2;
    body.removeChild(box);
    box = input.getBoundingClientRect();
    var clientTop = docElem.clientTop || body.clientTop || 0, 
        clientLeft = docElem.clientLeft || body.clientLeft || 0,
        scrollTop = win.pageYOffset || isBoxModel && docElem.scrollTop  || body.scrollTop, 
        scrollLeft = win.pageXOffset || isBoxModel && docElem.scrollLeft || body.scrollLeft;
    return {"top": box.top  + scrollTop  - clientTop, "left": box.left + scrollLeft - clientLeft};
  }
  function getInputCSS(prop, isnumber) {
    var defaultView = document.defaultView;
    if (defaultView) {
      var dDGCS = defaultView.getComputedStyle(input, null);
      if (dDGCS) {
        var val = dDGCS.getPropertyValue(prop);
        return isnumber ? parseFloat(val) : val;
      }
    }
    return '';
  }
}