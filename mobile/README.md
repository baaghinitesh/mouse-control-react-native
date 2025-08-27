# Remote Touchpad Mobile (React Native)

A simple React Native app that turns your phone into a touchpad, sending mouse commands to the server over WebSocket.

## Quick Start (Expo)
1. Install Node.js 18+ and Git
2. Install Expo CLI:
   ```bash
   npm i -g expo
   ```
3. In `mobile/`:
   ```bash
   npm install
   npm start
   ```
4. Use the Expo Go app on your phone to open the project (or build a standalone APK later).

## Configure
- In the app, enter Host (PC IP), Port (default `8765`), and optional PIN, then Connect.

## Gestures
- 1 finger drag → mouse move
- Tap → left click
- 2-finger tap → right click
- 2-finger drag → scroll
- Double‑tap + hold → drag (mouse down); release → mouse up

my ip- 192.168.29.224
