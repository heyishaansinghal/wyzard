document.getElementById("letsGoButton").addEventListener("click", () => {
  chrome.tabs.create({ url: "hr.html" });
});
