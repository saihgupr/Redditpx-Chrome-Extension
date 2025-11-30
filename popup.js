document.addEventListener('DOMContentLoaded', () => {
  const baseUrlInput = document.getElementById('baseUrl');
  const saveBtn = document.getElementById('saveBtn');
  const goBtn = document.getElementById('goBtn');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.local.get(['redditpxBaseUrl'], (result) => {
    if (result.redditpxBaseUrl) {
      baseUrlInput.value = result.redditpxBaseUrl;
    } else {
      // Default
      baseUrlInput.value = 'https://redditpx.com';
    }
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const url = baseUrlInput.value.trim().replace(/\/$/, ''); // Remove trailing slash
    
    if (!url) {
      showStatus('Please enter a valid URL', false);
      return;
    }

    chrome.storage.local.set({ redditpxBaseUrl: url }, () => {
      showStatus('Settings saved!', true);
    });
  });

  // Open current page in target
  goBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab || !currentTab.url) return;

      chrome.storage.local.get(['redditpxBaseUrl'], (result) => {
        const baseUrl = result.redditpxBaseUrl || 'https://redditpx.com';
        
        try {
          const currentUrlObj = new URL(currentTab.url);
          const path = currentUrlObj.pathname + currentUrlObj.search + currentUrlObj.hash;
          const targetUrl = `${baseUrl}${path}`;
          
          chrome.tabs.update(currentTab.id, { url: targetUrl });
          window.close(); // Close popup
        } catch (e) {
          showStatus('Invalid current URL', false);
        }
      });
    });
  });

  function showStatus(text, success) {
    statusDiv.textContent = text;
    statusDiv.className = 'status ' + (success ? 'success' : 'error');
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 2000);
  }
});