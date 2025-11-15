document.addEventListener('DOMContentLoaded', function() {
  const settingsForm = document.getElementById('settings-form');
  const apiProviderSelect = document.getElementById('api-provider');
  const apiKeyInput = document.getElementById('api-key');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.local.get(['apiProvider', 'apiKey'], (result) => {
    if (result.apiProvider) {
      apiProviderSelect.value = result.apiProvider;
    }
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const apiProvider = apiProviderSelect.value;
    const apiKey = apiKeyInput.value;

    chrome.storage.local.set({ apiProvider, apiKey }, () => {
      statusDiv.textContent = 'Settings saved.';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    });
  });
});
