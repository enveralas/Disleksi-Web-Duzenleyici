let aktif = false;

// ================= MENU OLUŞTUR =================
chrome.runtime.onInstalled.addListener(() => {

  chrome.contextMenus.removeAll(() => {

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

    chrome.contextMenus.create({
      id: "ai_simplify",
      parentId: "root",
      title: "AI ile Sadeleştir",
      contexts: ["selection"]
    });

  });

});


// ================= AI =================
async function simplifyTextWithGemini(text) {

  const { geminiApiKey } = await chrome.storage.sync.get(["geminiApiKey"]);

  if (!geminiApiKey) {
    throw new Error("API key yok");
  }

  const prompt = `Aşağıdaki Türkçe metni disleksi bireyler için sadeleştir:
- Kısa cümleler kur
- Basit kelimeler kullan
- Anlamı bozma

Metin:
${text}`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: prompt }] }
        ]
      })
    }
  );

  const data = await response.json();

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sonuç alınamadı";
}


// ================= SAĞ CLICK =================
chrome.contextMenus.onClicked.addListener(async (info, tab) => {

  if (!tab?.id) return;

  // SEÇİLİ METİN
  if (info.menuItemId === "selected") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) => {

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);

        const span = document.createElement("span");
        span.style.backgroundColor = "#fdf6e3";
        span.style.fontSize = "20px";
        span.style.lineHeight = "2";
        span.style.letterSpacing = "1.5px";
        span.style.fontFamily = "Comic Sans MS, Arial";
        span.textContent = text;

        range.deleteContents();
        range.insertNode(span);

      },
      args: [info.selectionText]
    });
  }

  // TÜM SAYFA
  if (info.menuItemId === "all") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {

        if (document.getElementById("dyslexia-style")) return;

        const style = document.createElement("style");
        style.id = "dyslexia-style";
        style.innerHTML =
          "* { font-family: Comic Sans MS, Arial !important; line-height:2 !important; letter-spacing:1.5px !important; } body { background:#fdf6e3 !important; }";

        document.head.appendChild(style);

      }
    });
  }

  // SESLİ OKU
  if (info.menuItemId === "read") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) => {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = "tr-TR";
        speech.rate = 0.9;
        speechSynthesis.speak(speech);
      },
      args: [info.selectionText]
    });
  }

  // AI SADELEŞTİR
  if (info.menuItemId === "ai_simplify") {
    try {
      const simplified = await simplifyTextWithGemini(info.selectionText || "");

      chrome.tabs.sendMessage(tab.id, {
        action: "replaceSelectedText",
        simplifiedText: simplified
      });

    } catch (err) {
      chrome.tabs.sendMessage(tab.id, {
        action: "showError",
        message: err.message
      });
    }
  }

});


// ================= POPUP TOGGLE =================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "toggleFullPageStyle") {

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {

          const aktif = document.body.classList.contains("dyslexia-mode");

          if (aktif) {
            document.body.classList.remove("dyslexia-mode");
            document.querySelectorAll("*").forEach(el => {
              el.style.fontSize = "";
              el.style.lineHeight = "";
              el.style.letterSpacing = "";
              el.style.fontFamily = "";
              el.style.backgroundColor = "";
            });
          } else {
            document.body.classList.add("dyslexia-mode");
            document.querySelectorAll("*").forEach(el => {
              el.style.fontSize = "20px";
              el.style.lineHeight = "1.8";
              el.style.letterSpacing = "0.8px";
              el.style.fontFamily = "Comic Sans MS, Arial";
            });
            document.body.style.backgroundColor = "#fdf6e3";
          }

        }
      });

    });

  }

});