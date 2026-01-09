# YouTube Sort by Date

A lightweight Google Chrome extension that restores the missing "Sort by Date" functionality in YouTube search results and video lists.

## Features
- Adds a neutral "Sort by Date" button to the YouTube interface.
- Reorders videos from newest to oldest based on upload time.
- Works on search results, channels, and home feed.
- Intelligent parsing of YouTube's relative dates (e.g., "2 hours ago", "5 days ago").

## Manual Installation (Chrome)

If you want to install this extension manually from source:

1. **Download the source code**: Clone this repository or download and extract the ZIP archive.
2. **Open Chrome Extensions**: In your browser, go to `chrome://extensions/`.
3. **Enable Developer Mode**: Toggle the switch in the top right corner.
4. **Load the extension**:
   - Click the **Load unpacked** button.
   - Navigate to the folder containing the extension files (the one with `manifest.json`).
   - Select the folder and click **Open/Select Folder**.
5. **Success!**: The extension is now active. Refresh your YouTube page to see the "Sort by Date" button.

## Important Note
For the date sorting to work accurately, ensure your **YouTube interface language is set to English**. The extension parses date strings like "ago", "hours", "days", etc.

