chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  if (request && request.action === 'saveSummary') {
    const summary = request.summary;
    const filename = request.filename;

    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    console.log('Calling chrome.downloads.download with filename:', filename);
    chrome.downloads.download(
      {
        url: url,
        filename: filename,
        saveAs: true,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError.message);
          sendResponse({ success: false });
        } else {
          console.log('Download initiated with ID:', downloadId);
          sendResponse({ success: true });
        }
      }
    );
    // Return true to indicate that the response will be sent asynchronously.
    return true;
  }
});
