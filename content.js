// FONTLARI YÜKLE
if (!document.getElementById("dyslexic-fonts")) {
  const link1 = document.createElement("link");
  link1.href = "https://cdn.jsdelivr.net/gh/antijingoist/open-dyslexic/web/OpenDyslexic-Regular.css";
  link1.rel = "stylesheet";

  const link2 = document.createElement("link");
  link2.href = "https://fonts.googleapis.com/css2?family=Lexend&display=swap";
  link2.rel = "stylesheet";

  document.head.appendChild(link1);
  document.head.appendChild(link2);
}


// STATE
let aktif = false;
let currentFont = "OpenDyslexic";
let currentSize = 20;


// STYLE (TEK SEFER)
if (!document.getElementById("dyslexia-style")) {
  const style = document.createElement("style");
  style.id = "dyslexia-style";

  style.innerHTML = `
    body.dyslexia-active {
      background-color: #fdf6e3 !important;
    }

    body.dyslexia-active p,
    body.dyslexia-active li,
    body.dyslexia-active h1,
    body.dyslexia-active h2,
    body.dyslexia-active h3,
    body.dyslexia-active h4,
    body.dyslexia-active h5,
    body.dyslexia-active h6 {
      font-family: var(--d-font) !important;
      font-size: var(--d-size) !important;
      line-height: 1.8 !important;
      letter-spacing: 0.5px !important;
      background-color: #fdf6e3 !important;
      padding: 2px 4px;
      border-radius: 4px;
    }

    body.dyslexia-active a {
      font-family: var(--d-font) !important;
    }
  `;

  document.head.appendChild(style);
}


// APPLY (VARIABLE SET)
function applyMode() {
  document.body.classList.add("dyslexia-active");

  document.body.style.setProperty("--d-font", currentFont);
  document.body.style.setProperty("--d-size", currentSize + "px");
}


// REMOVE
function removeMode() {
  document.body.classList.remove("dyslexia-active");
}


// İLK AYAR
chrome.storage.sync.get(["fontFamily", "fontSize"], (res) => {
  if (res.fontFamily) currentFont = res.fontFamily;
  if (res.fontSize) currentSize = parseInt(res.fontSize);
});


// SEÇİM
let lastRange = null;

document.addEventListener("mouseup", () => {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    lastRange = sel.getRangeAt(0).cloneRange();
  }
});

function replaceSelectedText(text) {
  if (!lastRange) return;

  const span = document.createElement("span");

  span.style.background = "#fdf6e3";
  span.style.fontFamily = currentFont;
  span.style.fontSize = currentSize + "px";

  span.textContent = text;

  lastRange.deleteContents();
  lastRange.insertNode(span);
}


// MESAJ
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

  if (req.action === "toggleFullPageStyle") {
    aktif = !aktif;

    if (aktif) applyMode();
    else removeMode();
  }

  if (req.action === "updateStyle") {

    if (req.font) currentFont = req.font;
    if (req.size) currentSize = req.size;

    applyMode(); //  ANLIK
    aktif = true;
  }

  if (req.action === "replaceSelectedText") {
    replaceSelectedText(req.simplifiedText);
  }

  sendResponse({ ok: true });
  return true;
});