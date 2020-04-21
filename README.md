## Messenger-Javascript 
This repository contains the source code for the Mesibo Sample Web app using Mesibo Javascript API.
There are two sample applications:

- **messenger** - index.html
- **popup** - popup.html

> Please note that this is currently **under development** and will be continously updated. 

## Features:
- One-to-One messaging, Voice and Video Call
- Typing indicators and Online status
- Read receipts
- Sending Files 
- Chat history

## Instructions

## Messenger
Edit `config.js` and provide the `AUTH TOKEN` & `APP ID`. 

You can obtain the `AUTH TOKEN` and `APP ID` for a user from [Mesibo Console](https://mesibo.com/console/). You can also generate the token for the Web app from [Mesibo Demo App Token Geneartor](https://app.mesibo.com/gentoken/). Provide `APP ID` as `console`. 

Refer to the [Preparation Guide](https://mesibo.com/documentation/tutorials/first-app/#preparation) to learn about basic of mesibo.

To open messenger demo launch `index.html` 

```javascript
const MESIBO_ACCESS_TOKEN = "xxxxxxx";
const MESIBO_APP_ID = "xxxx";
const MESIBO_API_URL = "https://app.mesibo.com/api.php"
```
If you are hosting mesibo-backend on your own server, you need to change the API url to point to your server.  

## Popup

To launch popup demo you can configure the following for setting the displayed user avatar and destination user(to which all messages will be sent to) in `config.js` and launch `popup.html`

```javascript
const POPUP_DISPLAY_NAME = "xxxx"
const POPUP_DISPLAY_PICTURE = "images/profile/default-profile-icon.jpg"
const POPUP_DESTINATION_USER = 'xxxx';
```

