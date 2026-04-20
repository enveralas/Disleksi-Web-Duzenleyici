let lastRange = null;

function saveSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
  lastRange = selection.getRangeAt(0).cloneRange();
}

document.addEventListener("mouseup", saveSelection);
document.addEventListener("keyup", saveSelection);

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    lastRange = selection.getRangeAt(0).cloneRange();
  }
});

function replaceSelectedText(simplifiedText) {
  if (!lastRange) {
    alert("Metin seçimi bulunamadı. Lütfen metni tekrar seç.");
    return;
  }

  const span = document.createElement("span");
  span.style.backgroundColor = "#fdf6e3";
  span.style.fontSize = "22px";
  span.style.lineHeight = "2";
  span.style.letterSpacing = "1px";
  span.style.padding = "2px 4px";
  span.style.borderRadius = "4px";
  span.textContent = simplifiedText;

  lastRange.deleteContents();
  lastRange.insertNode(span);

  const selection = window.getSelection();
  selection.removeAllRanges();
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "replaceSelectedText") {
    replaceSelectedText(request.simplifiedText);
  }

  if (request.action === "showError") {
    alert(request.message);
  }
});
