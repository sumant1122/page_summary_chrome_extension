document.addEventListener('DOMContentLoaded', function() {
  const settingsForm = document.getElementById('settings-form');
  const apiProviderSelect = document.getElementById('api-provider');
  const apiKeyInput = document.getElementById('api-key');
  const saveDestinationInput = document.getElementById('save-destination');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.local.get(['apiProvider', 'apiKey', 'saveDestination'], (result) => {
    if (result.apiProvider) {
      apiProviderSelect.value = result.apiProvider;
    }
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.saveDestination) {
      saveDestinationInput.value = result.saveDestination;
    }
  });

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const apiProvider = apiProviderSelect.value;
    const apiKey = apiKeyInput.value;
    const saveDestination = saveDestinationInput.value;

    chrome.storage.local.set({ apiProvider, apiKey, saveDestination }, () => {
      statusDiv.textContent = 'Settings saved.';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    });
  });
});
