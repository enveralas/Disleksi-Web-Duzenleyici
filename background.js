chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "dyslexia_simplify",
    title: "Disleksi moduna çevir",
    contexts: ["selection"]
  });
});

// Gemini isteği (fallback destekli)
async function simplifyTextWithGemini(text) {
  const { geminiApiKey } = await chrome.storage.sync.get(["geminiApiKey"]);

  if (!geminiApiKey) {
    throw new Error("API key yok. Popup'tan gir.");
  }

  const prompt = `Aşağıdaki Türkçe metni disleksi bireyler için sadeleştir:
- Kısa cümleler kur
- Basit kelimeler kullan
- Anlamı bozma
- Sadece sonucu ver

Metin:
${text}`;

  // Fallback model listesi
  const models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash-001",
    "gemini-2.5-flash"
  ];

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
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        lastError = data?.error?.message;
        continue; // diğer modele geç
      }

      const output = data?.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        .join("\n")
        .trim();

      if (output) {
        return output;
      }

    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(lastError || "Hiçbir model çalışmadı.");
}

// Sağ tık işlemi
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "dyslexia_simplify" || !tab?.id) return;

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
});

// Tam sayfa modu
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleFullPageStyle" && sender.tab?.id) {

    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: () => {
        const aktif = document.body.classList.contains("dyslexia-mode");

        if (aktif) {
          document.body.classList.remove("dyslexia-mode");
          document.querySelectorAll("*").forEach(el => {
            el.style.fontSize = "";
            el.style.lineHeight = "";
            el.style.letterSpacing = "";
            el.style.backgroundColor = "";
          });
          return { active: false };
        }

        document.body.classList.add("dyslexia-mode");
        document.querySelectorAll("*").forEach(el => {
          el.style.fontSize = "20px";
          el.style.lineHeight = "1.8";
          el.style.letterSpacing = "0.8px";
        });
        document.body.style.backgroundColor = "#fdf6e3";

        return { active: true };
      }
    })
    .then(result => sendResponse(result?.[0]?.result || { active: false }))
    .catch(err => sendResponse({ error: err.message }));

    return true;
  }
});