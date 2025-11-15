(function() {
  const pageContent = document.body.innerText;
  
  chrome.storage.local.get(['apiKey', 'apiProvider'], (result) => {
    const { apiKey, apiProvider } = result;

    if (!apiKey || !apiProvider) {
      chrome.runtime.sendMessage({ action: 'showSummary', summary: null });
      return;
    }

    let apiUrl, body;

    switch (apiProvider) {
      case 'openai':
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        body = {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that summarizes web pages.' },
            { role: 'user', content: `Summarize the following content:\n\n${pageContent}` }
          ]
        };
        break;
      case 'openrouter':
        apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        body = {
          model: 'google/gemini-flash-1.5', // Or another model supported by OpenRouter
          messages: [
            { role: 'system', content: 'You are a helpful assistant that summarizes web pages.' },
            { role: 'user', content: `Summarize the following content:\n\n${pageContent}` }
          ]
        };
        break;
      case 'gemini':
      default:
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        body = {
          contents: [{
            parts: [{
              text: `Summarize the following content:\n\n${pageContent}`
            }]
          }]
        };
        break;
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (apiProvider === 'openai' || apiProvider === 'openrouter') {
      headers.Authorization = `Bearer ${apiKey}`;
    }
     if (apiProvider === 'openrouter') {
      headers['HTTP-Referer'] = 'http://localhost:3000'; // Replace with your extension's ID
      headers['X-Title'] = 'Page Summarizer';
    }


    fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
      let summary;
      switch (apiProvider) {
        case 'openai':
        case 'openrouter':
          summary = data.choices[0].message.content;
          break;
        case 'gemini':
        default:
          summary = data.candidates[0].content.parts[0].text;
          break;
      }
      chrome.runtime.sendMessage({ action: 'showSummary', summary: summary });
    })
    .catch(error => {
      console.error('Error:', error);
      chrome.runtime.sendMessage({ action: 'showSummary', summary: null });
    });
  });
})();
