const GEMINI_API_KEY = "AIzaSyBApoUxNFepLSAsviRoVzffHIxpaNguSM8";

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

function cleanText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function finishSentence(text) {
  let cleaned = cleanText(text);
  if (!cleaned) return "";
  if (!/[.!?]$/.test(cleaned)) cleaned += ".";
  return cleaned;
}

async function simplifyTextWithGemini(text) {
  const geminiApiKey = GEMINI_API_KEY;

  const selectedText = cleanText(text);

  if (!selectedText) {
    throw new Error("Seçili metin bulunamadı.");
  }

  const prompt = `
Aşağıdaki Türkçe metni disleksi bireyler için daha kolay okunur hale getir.

Kurallar:
- En önemli bilgileri koru.
- Ana anlamı değiştirme.
- Gereksiz detayları ve tekrarları kaldır.
- Tarih, sayı, yaş ve kritik bilgileri koru.
- Metni biraz daha kısa hale getir.
- Zor kelimeleri daha basit kelimelerle değiştir.
- Daha az kelime kullan.
- Çok fazla cümleye bölme.
- Yeni bilgi ekleme.
- Cümleyi yarıda bırakma.
- Sadece düzenlenmiş metni yaz.

Örnek:

Girdi:
"Yarışmaya Türkiye ve yurt dışında eğitim gören 14-30 yaş arası lise, ön lisans, lisans ve yüksek lisans öğrencileri katılabilir."

Çıktı:
"Yarışmaya Türkiye ve yurt dışında eğitim gören 14-30 yaş arası öğrenciler katılabilir."

Metin:
${selectedText}
`;

  const models = ["gemini-2.0-flash", "gemini-2.5-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiApiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        lastError = data?.error?.message || `HTTP ${response.status}`;
        continue;
      }

      const output = data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text)
        .join(" ")
        .trim();

      if (output) return finishSentence(output);

    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(lastError || "Hiçbir model çalışmadı.");
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === "selected") {
    chrome.tabs.sendMessage(tab.id, {
      action: "replaceSelectedText",
      simplifiedText: info.selectionText || ""
    });
  }

  if (info.menuItemId === "ai") {
    try {
      const simplifiedText = await simplifyTextWithGemini(info.selectionText || "");

      await chrome.tabs.sendMessage(tab.id, {
        action: "replaceSelectedText",
        simplifiedText
      });

    } catch (error) {
      await chrome.tabs.sendMessage(tab.id, {
        action: "showError",
        message: error.message
      });
    }
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
      args: [info.selectionText || ""]
    });
  }

  if (info.menuItemId === "fullPage") {
    chrome.tabs.sendMessage(tab.id, {
      action: "toggleFullPageStyle"
    });
  }
});