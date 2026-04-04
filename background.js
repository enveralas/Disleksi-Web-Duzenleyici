// Sağ click menü
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "dyslexia",
    title: "Disleksi Moduna Çevir",
    contexts: ["selection"]
  });
});

// Sağ click → seçili metin
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "dyslexia") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (selectedText) => {
        let selection = window.getSelection();
        if (selection.rangeCount > 0) {
          let range = selection.getRangeAt(0);
          let span = document.createElement("span");

          span.style.fontSize = "20px";
          span.style.lineHeight = "1.8";
          span.style.letterSpacing = "1px";
          span.style.backgroundColor = "#fdf6e3";

          span.textContent = selectedText;

          range.deleteContents();
          range.insertNode(span);
        }
      },
      args: [info.selectionText]
    });
  }
});

// TOGGLE SİSTEMİ
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {

      // aktif mi kontrol et
      const aktifMi = document.body.classList.contains("dyslexia-mode");

      if (aktifMi) {
        // KAPAT
        document.body.classList.remove("dyslexia-mode");

        document.querySelectorAll("*").forEach(el => {
          el.style.fontSize = "";
          el.style.lineHeight = "";
          el.style.letterSpacing = "";
        });

        document.body.style.backgroundColor = "";

      } else {
        // AÇ
        document.body.classList.add("dyslexia-mode");

        document.querySelectorAll("*").forEach(el => {
          el.style.fontSize = "20px";
          el.style.lineHeight = "1.8";
          el.style.letterSpacing = "1px";
        });

        document.body.style.backgroundColor = "#fdf6e3";
      }

    }
  });
});