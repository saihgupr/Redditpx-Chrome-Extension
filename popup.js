document.addEventListener('DOMContentLoaded', () => {
  const baseUrlInput = document.getElementById('baseUrl');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.local.get(['redditpxBaseUrl'], (result) => {
    if (result.redditpxBaseUrl) {
      baseUrlInput.value = result.redditpxBaseUrl;
    } else {
      baseUrlInput.value = 'https://redditpx.com';
    }
  });

  // Save and Open
  saveBtn.addEventListener('click', () => {
    const url = baseUrlInput.value.trim().replace(/\/$/, ''); // Remove trailing slash
    
    if (!url) {
      showStatus('Please enter a valid URL', false);
      return;
    }

    chrome.storage.local.set({ redditpxBaseUrl: url }, () => {
      showStatus('Saved!', true);
      
      // Perform the redirect action
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (!currentTab || !currentTab.url) return;

        try {
          const currentUrlObj = new URL(currentTab.url);
          let path = currentUrlObj.pathname;
          
          // Check if it's a subreddit root (e.g., /r/funny or /r/funny/)
          // Matches /r/anything but not /r/anything/comments/...
          if (/^\/r\/[^/]+\/?$/.test(path)) {
             // Ensure no double slashes if path has trailing slash
             path = path.replace(/\/$/, '') + '/top?t=all';
          } else {
             path = path + currentUrlObj.search + currentUrlObj.hash;
          }

          const targetUrl = `${url}${path}`;
          
          chrome.tabs.create({ url: targetUrl });
          window.close();
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