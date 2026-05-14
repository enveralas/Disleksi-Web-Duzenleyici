function createMenus() {
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
      id: "read",
      parentId: "root",
      title: "Sesli Oku",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "ai",
      parentId: "root",
      title: "AI ile Sadeleştir",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "fullPage",
      parentId: "root",
      title: "Tüm Sayfayı Disleksi Moduna Çevir",
      contexts: ["all"]
    });

  });
}

chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);

createMenus();

function cleanText(text) {

  if (!text) return "";

  return text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

function ensureCompleteSentence(text) {

  if (!text) return "";

  let cleaned = text.trim();

  const lastChar =
    cleaned[cleaned.length - 1];

  if (
    ![".", "!", "?"].includes(lastChar)
  ) {
    cleaned += ".";
  }

  return cleaned;
}

async function callGemini(
  model,
  geminiApiKey,
  prompt
) {

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
        "x-goog-api-key":
          geminiApiKey
      },

      body: JSON.stringify({

        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],

        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192
        }

      })
    }
  );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data?.error?.message ||
      `HTTP ${response.status}`
    );
  }

  const output =
    data?.candidates?.[0]
      ?.content?.parts
      ?.map(part => part.text)
      .join(" ")
      .trim();

  return output;
}

async function simplifyTextWithGemini(text) {

  const { geminiApiKey } =
    await chrome.storage.sync.get([
      "geminiApiKey"
    ]);

  if (!geminiApiKey) {
    throw new Error(
      "API key yok. Popup'tan gir."
    );
  }

  const selectedText =
    cleanText(text);

  if (!selectedText) {
    throw new Error(
      "Seçili metin bulunamadı."
    );
  }

 const prompt = `
Sen disleksi bireyler için Türkçe metin sadeleştiren bir asistansın.

Görevin:
Verilen metni kısa, açık ve kolay okunur hale getirmek.

Kurallar:
- Sadece en önemli bilgileri koru.
- Gereksiz detayları çıkar.
- Metni mümkün olduğunca kısalt.
- Kısa ve net cümleler kullan.
- Anlamı bozma.
- Zor kelimeleri basitleştir.
- Uzun cümleleri böl.
- Akıcı ve doğal Türkçe kullan.
- Cümleyi yarıda bırakma.
- Sadece düzenlenmiş metni yaz.

Örnek:
Girdi:
"Teknolojinin hızlı gelişmesi sayesinde insanlar artık bilgiye çok daha kısa sürede ulaşabiliyor."

Çıktı:
"Teknoloji gelişti. İnsanlar bilgiye daha hızlı ulaşıyor."

Metin:
${selectedText}
`;

  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-001"
  ];

  let lastError = null;

  for (const model of models) {

    try {

      const result =
        await callGemini(
          model,
          geminiApiKey,
          prompt
        );

      if (result) {

        return ensureCompleteSentence(
          cleanText(result)
        );
      }

    } catch (err) {

      lastError = err.message;

    }
  }

  throw new Error(
    lastError ||
    "Hiçbir model çalışmadı."
  );
}

chrome.contextMenus.onClicked.addListener(
  async (info, tab) => {

    if (!tab?.id) return;

    if (
      info.menuItemId === "selected"
    ) {

      chrome.tabs.sendMessage(
        tab.id,
        {
          action:
            "replaceSelectedText",
          simplifiedText:
            info.selectionText
        }
      );
    }

    if (
      info.menuItemId === "read"
    ) {

      chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },

        func: (text) => {

          const speech =
            new SpeechSynthesisUtterance(
              text
            );

          speech.lang = "tr-TR";
          speech.rate = 0.9;

          speechSynthesis.speak(
            speech
          );
        },

        args: [info.selectionText]
      });
    }

    if (
      info.menuItemId === "ai"
    ) {

      try {

        const result =
          await simplifyTextWithGemini(
            info.selectionText
          );

        chrome.tabs.sendMessage(
          tab.id,
          {
            action:
              "replaceSelectedText",
            simplifiedText:
              result
          }
        );

      } catch (err) {

        chrome.tabs.sendMessage(
          tab.id,
          {
            action: "showError",
            message: err.message
          }
        );

      }
    }

    if (
      info.menuItemId === "fullPage"
    ) {

      chrome.tabs.sendMessage(
        tab.id,
        {
          action:
            "toggleFullPageStyle"
        }
      );
    }
  }
);