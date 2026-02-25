# Mesibo Open Source Messenger — Web

A WhatsApp-style messaging web app built on the [Mesibo JavaScript API](https://docs.mesibo.com/install/javascript/). Source code is also available for Android and iOS:

- [Android](https://github.com/mesibo/messenger-app-android)
- [iOS](https://github.com/mesibo/messenger-app-ios)
- [Web (this repo)](https://github.com/mesibo/messenger-javascript)

## Features

- One-to-one messaging, voice and video calls
- Group messaging
- Read receipts
- Forward, delete and resend messages
- Send files (images, video, audio, documents)
- Record and send live audio, video and pictures
- Link preview
- Multi-device synchronisation (requires Mesibo On-Premise)

## Getting Started

### Prerequisites

You need a Mesibo user token to use the messenger. There are two ways to obtain one:

1. **Use the login screen with OTP** — see [Logging in with OTP](#logging-in-with-otp) below.
2. **Hardcode a token in `config.js`** — see [Bypassing Login](#bypassing-login) below. This is the quickest way to get started.

If you are unfamiliar with Mesibo tokens, read the [Get Started guide](https://docs.mesibo.com/tutorials/get-started/) first.

### Running the App

The app is a static web app — no build step is required. Serve the files from any web server. For local development:

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8080` in a browser.

The entry point is `index.html` (login page). After login, `messenger.html` loads the main messaging UI.

### Configuration (`mesibo/config.js`)

| Variable | Description |
|---|---|
| `MESIBO_ACCESS_TOKEN` | User token. Set this to skip the login screen (see below). |
| `MESIBO_APP_ID` | App ID used when the token was created (default: `com.mesibo.jsdemo`). |
| `MESSENGER_API_URL` | Backend API URL. Change this if you self-host the Mesibo backend. |
| `isMessageSync` | Set `true` to sync message history across devices. |
| `isLinkPreview` | Set `true` to enable link previews in messages. |
| `POPUP_DESTINATION_USER` | Destination user for the popup demo variant. |

### Logging in with OTP

> **Important:** This is a demo app. It does **not** send OTP SMS messages. You must generate the OTP yourself from the [Mesibo Console](https://console.mesibo.com) as described below.

**Steps:**

1. Log in to the [Mesibo Console](https://console.mesibo.com), create an App as described in the tutorial or select an existing **App**, click on **OTP for Demo App** from the left menu.
2. Enter a phone number with the country code, e.g. `+1XXXXXXXXXX` (no spaces or dashes) and generate an OTP.
3. Open the app in a browser and go to the login screen.
4. Log in with this phone number and the OTP.
5. On success, the app saves the token to `localStorage` and opens the messenger. You will not need to log in again on the same browser.

### Bypassing Login

To skip the login screen entirely, create a user in the Mesibo Console and paste their token into `mesibo/config.js`.

**Steps:**

1. Log in to the [Mesibo Console](https://console.mesibo.com) and open your **App** (or create one — see the [tutorial](https://mesibo.com/documentation/tutorials/first-app/)).
2. Go to **Users**, create a new user, and note the **App ID** shown for your app (e.g. `com.mesibo.jsdemo`).
3. Copy the token generated for that user.
4. Open `mesibo/config.js` and set:

```js
var MESIBO_ACCESS_TOKEN = "your-token-here";
var MESIBO_APP_ID = "your-app-id";
```

5. Open the app — the login screen is skipped and the messenger loads directly.

If `MESIBO_ACCESS_TOKEN` is left empty, the app shows the login screen instead.

### Self-Hosting the Backend

By default the app connects to `https://messenger.mesibo.com` which in turn uses the Mesibo backend API. For deployment, you should download the messenger app backend code and host it on your own server, then change `MESSENGER_API_URL` in `config.js` to point to your server. See [messenger-app-backend](https://github.com/mesibo/messenger-app-backend) for the backend source.

## Support

- [Documentation](https://docs.mesibo.com)
- [Support](https://mesibo.com/support/)
