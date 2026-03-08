# Firebase Setup for Chat to Work

If messages don't send or receive, you need to set up Firebase Realtime Database:

## Steps

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Open your project (or create one)
3. Click **Build** → **Realtime Database** → **Create Database**
4. Choose a region (e.g. us-central1) → **Next**
5. Start in **test mode** (or use the rules from `database.rules.json`) → **Enable**
6. Copy the **database URL** (looks like `https://xxx-default-rtdb.firebaseio.com` or `https://xxx-default-rtdb.us-central1.firebasedatabase.app`)
7. In `index.html`, find `firebaseConfig` and replace `databaseURL` with your URL
8. In Firebase Console → Realtime Database → **Rules**, paste the rules from `database.rules.json` and **Publish**

## Test

Open the app, unlock with "liath", pick a card, send a message. If it works, the message appears and syncs to other devices.
