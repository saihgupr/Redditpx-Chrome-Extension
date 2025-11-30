// Theme detection and icon switching
const updateIcon = async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const tab = tabs[0];
      
      // Skip if it's a chrome:// or extension:// URL
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
        return;
      }
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Function to convert RGB to brightness value
          const getBrightness = (r, g, b) => {
            return (r * 299 + g * 587 + b * 114) / 1000;
          };
          
          // Function to parse color and get RGB values
          const parseColor = (color) => {
            if (!color || color === 'transparent') return null;
            
            // Handle rgb() format
            if (color.startsWith('rgb(')) {
              const values = color.match(/\d+/g);
              return values ? [parseInt(values[0]), parseInt(values[1]), parseInt(values[2])] : null;
            }
            
            // Handle rgba() format
            if (color.startsWith('rgba(')) {
              const values = color.match(/\d+/g);
              return values ? [parseInt(values[0]), parseInt(values[1]), parseInt(values[2])] : null;
            }
            
            // Handle hex format
            if (color.startsWith('#')) {
              const hex = color.replace('#', '');
              const r = parseInt(hex.substr(0, 2), 16);
              const g = parseInt(hex.substr(2, 2), 16);
              const b = parseInt(hex.substr(4, 2), 16);
              return [r, g, b];
            }
            
            return null;
          };
          
          // Get computed styles for various elements
          const bodyStyle = window.getComputedStyle(document.body);
          const htmlStyle = window.getComputedStyle(document.documentElement);
          
          // Check background colors
          const bodyBg = bodyStyle.backgroundColor;
          const htmlBg = htmlStyle.backgroundColor;
          
          // Parse colors and calculate brightness
          const bodyRgb = parseColor(bodyBg);
          const htmlRgb = parseColor(htmlBg);
          
          let isVeryLight = false;
          
          if (bodyRgb) {
            const brightness = getBrightness(bodyRgb[0], bodyRgb[1], bodyRgb[2]);
            // Use dark icon only for very light backgrounds (brightness > 240, close to pure white)
            isVeryLight = brightness > 240;
          } else if (htmlRgb) {
            const brightness = getBrightness(htmlRgb[0], htmlRgb[1], htmlRgb[2]);
            // Use dark icon only for very light backgrounds (brightness > 240, close to pure white)
            isVeryLight = brightness > 240;
          } else {
            // Fallback: check for very light theme indicators
            isVeryLight = document.documentElement.classList.contains('light') || 
                         document.body.classList.contains('light') ||
                         document.documentElement.getAttribute('data-theme') === 'light' ||
                         window.matchMedia('(prefers-color-scheme: light)').matches;
          }
          
          return isVeryLight;
        }
      });
      
      const isVeryLightBackground = results[0]?.result || false;
      const iconPath = isVeryLightBackground ? 'icon-dark.png' : 'icon-light.png';
      
      chrome.action.setIcon({
        path: {
          16: iconPath,
          32: iconPath,
          48: iconPath,
          128: iconPath
        }
      });
    }
  } catch (error) {
    console.error('Error updating icon:', error);
  }
};

// Set up theme change listener
const setupThemeListener = async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const tab = tabs[0];
      
      // Skip if it's a chrome:// or extension:// URL
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
        return;
      }
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Listen for system theme changes
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          mediaQuery.addEventListener('change', () => {
            chrome.runtime.sendMessage({ action: 'themeChanged' });
          });
          
          // Listen for document theme changes
          const observer = new MutationObserver(() => {
            chrome.runtime.sendMessage({ action: 'themeChanged' });
          });
          
          observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
          });
          
          observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
          });
        }
      });
    }
  } catch (error) {
    console.error('Error setting up theme listener:', error);
  }
};

// Listen for theme change messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'themeChanged') {
    updateIcon();
  }
});

// Helper: Transform URL
function getTransformedUrl(currentUrl, baseUrl) {
  try {
    const currentUrlObj = new URL(currentUrl);
    let path = currentUrlObj.pathname;
    const cleanBase = baseUrl.replace(/\/$/, '');

    // Check if it's a reddit content page (subreddit, user, domain)
    if (/^\/(r|u|user|domain)\//.test(path)) {
      // Check if it's a subreddit root (e.g., /r/funny or /r/funny/)
      // Matches /r/anything but not /r/anything/comments/...
      if (/^\/r\/[^/]+\/?$/.test(path)) {
         // Ensure no double slashes if path has trailing slash
         path = path.replace(/\/$/, '') + '/top?t=all';
      } else {
         path = path + currentUrlObj.search + currentUrlObj.hash;
      }
      return `${cleanBase}${path}`;
    } else {
      // Not a subreddit or user page -> Go to Multireddit
      return `${cleanBase}/multi`;
    }
  } catch (e) {
    console.error('Error transforming URL:', e);
    return null;
  }
}

// Manage Popup State
function updatePopupState() {
  chrome.storage.local.get(['redditpxBaseUrl'], (result) => {
    if (result.redditpxBaseUrl) {
      // URL is saved, disable popup to allow onClicked to fire
      chrome.action.setPopup({ popup: '' });
    } else {
      // URL not saved, show popup settings
      chrome.action.setPopup({ popup: 'popup.html' });
    }
  });
}

// Update icon when extension starts
chrome.runtime.onStartup.addListener(() => {
  updateIcon();
  setupThemeListener();
  updatePopupState();
});

chrome.runtime.onInstalled.addListener(() => {
  updateIcon();
  setupThemeListener();
  updatePopupState();
});

// Listen for storage changes to update popup state dynamically
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.redditpxBaseUrl) {
    updatePopupState();
  }
});

// Update icon when tab becomes active (user switches tabs)
chrome.tabs.onActivated.addListener(() => {
  updateIcon();
  setupThemeListener();
});

// Update icon when window focus changes
chrome.windows.onFocusChanged.addListener(() => {
  updateIcon();
  setupThemeListener();
});

// Handle click on icon (only fires if popup is '')
chrome.action.onClicked.addListener((tab) => {
  if (tab.url) {
    chrome.storage.local.get(['redditpxBaseUrl'], (result) => {
      if (result.redditpxBaseUrl) {
        const targetUrl = getTransformedUrl(tab.url, result.redditpxBaseUrl);
        if (targetUrl) {
          chrome.tabs.create({ url: targetUrl });
        }
      } else {
         // Should not happen if logic is correct, but fallback
         chrome.runtime.openOptionsPage(); 
      }
    });
  }
});

// Add this listener for commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'send-url-to-ha') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab?.url) {
         chrome.storage.local.get(['redditpxBaseUrl'], (result) => {
            const baseUrl = result.redditpxBaseUrl || 'http://redditpx:3000';
            const targetUrl = getTransformedUrl(currentTab.url, baseUrl);
            if (targetUrl) {
               chrome.tabs.create({ url: targetUrl });
            }
         });
      } else {
        console.error('No active tab URL found.');
      }
    });
  }
});