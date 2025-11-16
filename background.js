function getFilenameFromPath(path) {
  const parts = path.split(/[/\\]/); // Split by / or \
  return parts[parts.length - 1];
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  if (request && request.action === 'saveSummary') {
    const summary = request.summary;
    const suggestedPath = request.filename; // This is the path from settings

    const filename = getFilenameFromPath(suggestedPath); // Extract just the filename

    const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(summary);

    console.log('Calling chrome.downloads.download with filename:', filename);
    chrome.downloads.download(
      {
        url: dataUrl,
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
