let aktif = false;

chrome.runtime.onInstalled.addListener(function () {

  chrome.contextMenus.removeAll(function () {

    chrome.contextMenus.create({
      id: "root",
      title: "Disleksi Modu",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "selected",
      parentId: "root",
      title: "Seçili Metni Dönüştür",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "all",
      parentId: "root",
      title: "Tüm Sayfayı Dönüştür",
      contexts: ["page"]
    });

    chrome.contextMenus.create({
      id: "read",
      parentId: "root",
      title: "Sesli Oku",
      contexts: ["selection"]
    });

  });

});

chrome.contextMenus.onClicked.addListener(function (info, tab) {

  // SEÇİLİ METİN
  if (info.menuItemId === "selected") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: function (text) {
        var selection = window.getSelection();

        if (selection.rangeCount > 0) {
          var range = selection.getRangeAt(0);

          var span = document.createElement("span");
          span.style.backgroundColor = "#fdf6e3";
          span.style.fontSize = "20px";
          span.style.lineHeight = "2";
          span.style.letterSpacing = "1.5px";
          span.style.fontFamily = "Comic Sans MS, Arial";

          span.textContent = text;

          range.deleteContents();
          range.insertNode(span);
        }
      },
      args: [info.selectionText]
    });
  }

  // TÜM SAYFA
  if (info.menuItemId === "all") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: function () {

        var eski = document.getElementById("dyslexia-style");
        if (eski) return;

        var style = document.createElement("style");
        style.id = "dyslexia-style";

        style.innerHTML =
          "* { font-family: Comic Sans MS, Arial !important; line-height:2 !important; letter-spacing:1.5px !important; } body { background:#fdf6e3 !important; }";

        document.head.appendChild(style);
      }
    });
  }

  // SES
  if (info.menuItemId === "read") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: function (text) {
        var speech = new SpeechSynthesisUtterance(text);
        speech.lang = "tr-TR";
        speech.rate = 0.9;
        speechSynthesis.speak(speech);
      },
      args: [info.selectionText]
    });
  }

});


// İKON TOGGLE
chrome.action.onClicked.addListener(function (tab) {

  aktif = !aktif;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: function (durum) {

      var eski = document.getElementById("toggle-style");

      if (durum) {

        if (eski) return;

        var style = document.createElement("style");
        style.id = "toggle-style";

        style.innerHTML =
          "* { font-family: Comic Sans MS, Arial !important; line-height:2 !important; letter-spacing:1.5px !important; } body { background:#fdf6e3 !important; }";

        document.head.appendChild(style);

      } else {

        if (eski) eski.remove();

      }

    },
    args: [aktif]
  });

});