let lastSelection = null;

// kullanıcı seçim yapınca kaydet
document.addEventListener("mouseup", () => {
  let selection = window.getSelection();
  if (selection.rangeCount > 0) {
    lastSelection = selection.getRangeAt(0);
  }
});

// popup’tan mesaj gelince çalış
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "applyStyle" && lastSelection) {

    let span = document.createElement("span");

    span.style.backgroundColor = "#fdf6e3";
    span.style.fontSize = "22px";
    span.style.lineHeight = "2.2";
    span.style.letterSpacing = "2px";

    span.textContent = lastSelection.toString();

    lastSelection.deleteContents();
    lastSelection.insertNode(span);
  }
});