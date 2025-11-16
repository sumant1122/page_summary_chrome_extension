chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveSummary') {
    const summary = request.summary;
    const filename = request.filename;

    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download(
      {
        url: url,
        filename: filename,
        saveAs: true, // This will always prompt the user to choose a location.
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false });
        } else {
          sendResponse({ success: true });
        }
      }
    );
    // Return true to indicate that the response will be sent asynchronously.
    return true;
  }
});
