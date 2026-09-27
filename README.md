# Discord Guard Plugin

<img width="1376" height="768" alt="image" src="https://github.com/user-attachments/assets/f5be555d-0935-4f73-8e4a-f870aafd4aec" />

A robust anti-hacker and anti-raid plugin built with `discord.js` v14 to secure Discord communities from malicious actions, rogue staff, and phishing links.

## Features
- **Anti-Phishing / Anti-Link:** Deletes unauthorized external links and Discord server invites instantly.
- **Anti-Nuke Protection:** Detects mass channel deletions within a specific timeframe, strips the offender's roles, and applies an automatic timeout.
- **Security Logging:** Sends real-time security alerts to a designated staff log channel.

## Installation

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Discord Bot Token:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   ```
4. Configure the settings inside `src/config.json` with your server's Role and Channel IDs.

## Running the Bot
```bash
npm start
```
