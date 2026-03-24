Notes for Reviewer / Testing Instructions
1. Authentication Details

No Extension Account Required: This extension does not require any standalone account, password, or third-party login. All features are available immediately upon installation.

Target Websites for Testing: To trigger the extension's features, reviewers need to visit a supported AI chat platform (e.g., Google Gemini, DeepSeek). These are public AI services. Reviewers can use their own existing test accounts (such as a personal Google account) to log in to https://gemini.google.com/ for standard chat testing. No specific in-app test accounts are required from our side.

2. Environment Setup

Install and enable the AIchat2doc extension.

(Optional) Obsidian Client: To fully test the "Save to Obsidian" feature, the Obsidian desktop application needs to be pre-installed on the testing device. If Obsidian is not installed in the testing environment, reviewers can still verify the core parsing and export functionality by testing the "Download Markdown" button.

3. Step-by-Step Testing Guide

Open Target Website: Navigate to a supported AI platform in the browser, such as https://gemini.google.com/.

Generate a Conversation: After logging in, send any prompt to the AI in the input box (e.g., request a text generation containing a code block and a list), and wait for the AI to complete its response.

Locate Injected Buttons: At the bottom of the AI's response area, locate the native action bar (which usually contains icons like "Copy" or "Like"). You will see the new buttons injected by the extension here: "Download Markdown" and "Save to Obsidian".

Test Download Feature: Click the "Download Markdown" button. The browser should immediately download a file with a .md extension. Open this file to verify that the content has been correctly converted to Markdown format.

Test Obsidian Trigger: Click the "Save to Obsidian" button. The browser should attempt to launch the local Obsidian application via a custom URL scheme and pass the conversation content to the app to create a new note.

4. Permissions & Privacy Verification

The extension only requests the activeTab permission, strictly following the principle of least privilege.

The extension extracts the text and HTML structure of the AI conversation by reading the DOM elements of the currently active tab.

All HTML-to-Markdown conversion logic is performed locally within the browser. The extension does not send network requests to any external servers and performs no background data collection.