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
      console.log('Sending saveSummary message to background script.');
      chrome.runtime.sendMessage(
        {
          action: 'saveSummary',
          summary: summary,
          filename: saveDestination,
        },
        (response) => {
          console.log('Received response from background script:', response);
          if (response && response.success) {
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
        renderMarkdownSummary(request.summary);
        summaryContainer.style.display = 'block';
        summarizeButton.style.display = 'block';
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

  function renderMarkdownSummary(markdownText) {
    summaryDiv.textContent = '';
    const fragment = document.createDocumentFragment();
    const lines = markdownText.split(/\r?\n/);
    let currentList = null;
    let listType = null;

    const closeList = () => {
      currentList = null;
      listType = null;
    };

    const ensureList = (type) => {
      if (currentList && listType === type) {
        return currentList;
      }
      currentList = document.createElement(type);
      listType = type;
      fragment.appendChild(currentList);
      return currentList;
    };

    const appendInline = (element, text) => {
      const tokens = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`|!\[[^\]]+?\]\([^)]+?\)|\[[^\]]+?\]\([^)]+?\))/g);
      tokens.forEach((token) => {
        if (!token) return;
        if (token.startsWith('**') && token.endsWith('**')) {
          const strong = document.createElement('strong');
          strong.textContent = token.slice(2, -2);
          element.appendChild(strong);
        } else if (token.startsWith('*') && token.endsWith('*')) {
          const em = document.createElement('em');
          em.textContent = token.slice(1, -1);
          element.appendChild(em);
        } else if (token.startsWith('`') && token.endsWith('`')) {
          const code = document.createElement('code');
          code.textContent = token.slice(1, -1);
          element.appendChild(code);
        } else if (token.startsWith('![')) {
          const match = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          if (match) {
            const img = document.createElement('img');
            img.alt = match[1];
            img.src = match[2];
            element.appendChild(img);
          }
        } else if (token.startsWith('[')) {
          const match = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (match) {
            const link = document.createElement('a');
            link.textContent = match[1];
            link.href = match[2];
            link.target = '_blank';
            link.rel = 'noreferrer noopener';
            element.appendChild(link);
          }
        } else {
          element.appendChild(document.createTextNode(token));
        }
      });
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        closeList();
        return;
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        closeList();
        const level = headingMatch[1].length;
        const heading = document.createElement(level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5');
        heading.textContent = headingMatch[2];
        fragment.appendChild(heading);
        return;
      }

      const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/);
      if (unorderedMatch) {
        const list = ensureList('ul');
        const li = document.createElement('li');
        appendInline(li, unorderedMatch[1]);
        list.appendChild(li);
        return;
      }

      const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
      if (orderedMatch) {
        const list = ensureList('ol');
        const li = document.createElement('li');
        appendInline(li, orderedMatch[1]);
        list.appendChild(li);
        return;
      }

      closeList();
      const paragraph = document.createElement('p');
      appendInline(paragraph, trimmed);
      fragment.appendChild(paragraph);
    });

    closeList();
    summaryDiv.replaceChildren(fragment);
  }
});
