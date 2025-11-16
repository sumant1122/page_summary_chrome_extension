chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received a message.');
  console.log('Request:', request);
  console.log('Sender:', sender);

  // Send a simple, immediate response to prevent port-closed error.
  sendResponse({ success: true, message: 'Message received' });
});
