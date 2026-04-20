let aktif = false;

// ================== MENU ==================
function createMenus() {

  chrome.contextMenus.removeAll(() => {

    // ANA MENÜ
    chrome.contextMenus.create({
      id: "root",
      title: "Disleksi Modu",
      contexts: ["all"]
    });

    // SEÇİLİ METİN
    chrome.contextMenus.create({
      id: "selected",
      parentId: "root",
      title: "Seçili Metni Dönüştür",
      contexts: ["selection"]
    });

    // SESLİ OKU
    chrome.contextMenus.create({
      id: "read",
      parentId: "root",
      title: "Sesli Oku",
      contexts: ["selection"]
    });

    // AI
    chrome.contextMenus.create({
      id: "ai",
      parentId: "root",
      title: "AI ile Sadeleştir",
      contexts: ["selection"]
    });

    //  TÜM SAYFA
    chrome.contextMenus.create({
      id: "fullPage",
      parentId: "root",
      title: "Tüm Sayfayı Disleksi Moduna Çevir",
      contexts: ["all"]
    });

    console.log("MENÜ HAZIR ✅");
  });
}

createMenus();
chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);


// ================== GEMINI ==================
async function simplifyTextWithGemini(text) {

  const { geminiApiKey } = await chrome.storage.sync.get(["geminiApiKey"]);

  if (!geminiApiKey) {
    throw new Error("API key yok. Popup'tan gir.");
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text }] }]
      })
    }
  );

  const data = await response.json();

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Hata oluştu";
}


// ================== CLICK ==================
chrome.contextMenus.onClicked.addListener(async (info, tab) => {

  if (!tab?.id) return;

  // SEÇİLİ METİN
  if (info.menuItemId === "selected") {
    chrome.tabs.sendMessage(tab.id, {
      action: "replaceSelectedText",
      simplifiedText: info.selectionText
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

  // AI
  if (info.menuItemId === "ai") {
    try {
      const result = await simplifyTextWithGemini(info.selectionText);

      chrome.tabs.sendMessage(tab.id, {
        action: "replaceSelectedText",
        simplifiedText: result
      });

    } catch (err) {
      chrome.tabs.sendMessage(tab.id, {
        action: "showError",
        message: err.message
      });
    }
  }

  //  TÜM SAYFA
  if (info.menuItemId === "fullPage") {
    chrome.tabs.sendMessage(tab.id, {
      action: "toggleFullPageStyle"
    });
  }

});


// ================== ICON ==================
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {
    action: "toggleFullPageStyle"
  });
});