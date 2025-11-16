document.addEventListener('DOMContentLoaded', function() {
  const summarizeButton = document.getElementById('summarize-button');
  const summaryContainer = document.getElementById('summary-container');
  const summaryDiv = document.getElementById('summary');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const saveButton = document.getElementById('save-button');
  const saveStatusDiv = document.getElementById('save-status');

  summarizeButton.addEventListener('click', () => {
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    summaryContainer.style.display = 'none';
    summarizeButton.style.display = 'none';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          files: ['content.js'],
        },
        (injectionResults) => {
          if (chrome.runtime.lastError || !injectionResults || !injectionResults.length) {
            showError('Failed to inject content script.');
            return;
          }
          // The content script will send a message with the page content.
        }
      );
    });
  });

  saveButton.addEventListener('click', () => {
    const summary = summaryDiv.innerText;
    chrome.storage.local.get(['saveDestination'], (result) => {
      const saveDestination = result.saveDestination || 'summary.md';
      chrome.runtime.sendMessage(
        {
          action: 'saveSummary',
          summary: summary,
          filename: saveDestination,
        },
        (response) => {
          if (response.success) {
            saveStatusDiv.textContent = 'Saved!';
          } else {
            saveStatusDiv.textContent = 'Failed to save.';
          }
          setTimeout(() => {
            saveStatusDiv.textContent = '';
          }, 2000);
        }
      );
    });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showSummary') {
      loadingDiv.style.display = 'none';
      if (request.summary) {
        summaryDiv.innerText = request.summary;
        summaryContainer.style.display = 'block';
      } else {
        showError('Could not generate a summary.');
      }
    }
  });

  function showError(message) {
    loadingDiv.style.display = 'none';
    errorDiv.innerText = message;
    errorDiv.style.display = 'block';
    summarizeButton.style.display = 'block';
  }
});
