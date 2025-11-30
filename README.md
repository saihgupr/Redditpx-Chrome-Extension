# Redditpx Chrome Extension

A Chrome extension designed to seamlessly redirect Reddit pages to your own [Redditpx](https://github.com/saihgupr/redditpx) instance.

Redditpx is a self-hosted Reddit image viewer that allows you to browse image-heavy subreddits in a grid layout. This extension bridges the gap between browsing Reddit and viewing content on your local or hosted Redditpx server.

## Features

*   **Seamless Redirects:** Instantly open the current subreddit, user profile, or domain page in Redditpx.
*   **Smart Handling:**
    *   Automatically appends `/top?t=all` when visiting a subreddit root for the best viewing experience.
    *   Redirects non-content pages to the `/multi` view.

*   **Dynamic Icon:** The extension icon automatically adapts to light or dark backgrounds for better visibility.
*   **Configurable:** Set your custom Redditpx instance URL (defaults to `http://redditpx:3000`).

## Installation

1.  **Download or Clone** this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** by toggling the switch in the top-right corner.
4.  Click the **Load unpacked** button.
5.  Select the directory where you downloaded/cloned this extension.

## Configuration

1.  Click the **Redditpx icon** in your browser toolbar.
    *   *Note: If the icon isn't visible, click the puzzle piece icon to find it.*
2.  A popup will appear asking for your **Target Base URL**.
3.  Enter the URL of your Redditpx instance (e.g., `http://localhost:3000` or `https://my-redditpx.com`).
4.  Click **Save & Open**.

Once configured, clicking the extension icon will immediately trigger the redirect action instead of opening the settings popup. To change the settings later, you can right-click the extension icon and select "Options" (if available) or clear the extension data.

## Usage

**Click Action:**
Navigate to any Reddit page (e.g., `https://www.reddit.com/r/pics`, `https://www.reddit.com/user/saihgupr`) and click the extension icon. You will be redirected to that subreddit or user page on your Redditpx instance.



## related Projects

*   **[Redditpx](https://github.com/saihgupr/redditpx):** The main project this extension is built for.
