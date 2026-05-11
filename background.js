function createMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "root", title: "Disleksi Modu", contexts: ["all"] });
    chrome.contextMenus.create({ id: "selected", parentId: "root", title: "Seçili Metni Dönüştür", contexts: ["selection"] });
    chrome.contextMenus.create({ id: "read", parentId: "root", title: "Sesli Oku", contexts: ["selection"] });
    chrome.contextMenus.create({ id: "ai", parentId: "root", title: "AI ile Sadeleştir", contexts: ["selection"] });
    chrome.contextMenus.create({ id: "fullPage", parentId: "root", title: "Tüm Sayfayı Disleksi Moduna Çevir", contexts: ["all"] });
  });
}
chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);
createMenus();

async function simplifyTextWithGemini(text) {
  const { geminiApiKey } = await chrome.storage.sync.get(["geminiApiKey"]);
  if (!geminiApiKey) throw new Error("API key yok. Popup'tan gir.");

  const selectedText = (text || "").trim();
  if (!selectedText) throw new Error("Seçili metin bulunamadı.");

  const prompt = `Aşağıdaki Türkçe metni disleksi bireyler için daha kolay anlaşılır hale getir.

Kurallar:
- Metni kısalt ve özetle.
- Uzun cümleleri kısa cümlelere böl.
- Zor kelimeleri daha basit kelimelerle değiştir.
- Anlamı bozma.
- Gereksiz detayları çıkar.
- Açık, sade ve akıcı Türkçe kullan.
- Sadece düzenlenmiş metni ver, açıklama yazma.

Metin:
${selectedText}`;

  const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash-001"];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        lastError = data?.error?.message || `HTTP ${response.status}`;
        continue;
      }

      const output = data?.candidates?.[0]?.content?.parts?.map(part => part.text).join("\n").trim();
      if (output) return output;
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(lastError || "Hiçbir model çalışmadı.");
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === "selected") {
    chrome.tabs.sendMessage(tab.id, { action: "replaceSelectedText", simplifiedText: info.selectionText });
  }

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

  if (info.menuItemId === "ai") {
    try {
      const result = await simplifyTextWithGemini(info.selectionText);
      await chrome.tabs.sendMessage(tab.id, { action: "replaceSelectedText", simplifiedText: result });
    } catch (err) {
      chrome.tabs.sendMessage(tab.id, { action: "showError", message: err.message });
    }
  }

  if (info.menuItemId === "fullPage") {
    chrome.tabs.sendMessage(tab.id, { action: "toggleFullPageStyle" });
  }
});
