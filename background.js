chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enabled: true,
    boost: 2.5
  });
});
