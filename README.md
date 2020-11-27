## Messenger-Javascript 
This repository contains the source code for the Mesibo Sample Web app using Mesibo Javascript API.
There are two sample applications:

- **messenger** - index.html
- **popup** - popup.html

> Please note that this is currently **under development** and will be continously updated. 

## Features:
- One-to-One messaging, Voice and Video Call
- Group Messaging
- Read receipts
- Sending Files
- Record and Send live audio from microphone
- Send photos captured live using Webcam
- Chat history
- Link Preview 
- Multi-Device Synchronization(*Supported if you are using mesibo On-Premise)

### Features under implementation
- Sending typing indicators and activity 
- Date header in message area
- Forwarding Messages
- Deleting Messages
- Reply to Messages
- File upload and download progress 

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

### Messenger Login
You can synchronize with the contacts on your phone, by logging on to Mesibo Messenger App for 
[Android](https://play.google.com/store/apps/details?id=com.mesibo.mesiboapplication) or [iOS](https://itunes.apple.com/us/app/mesibo-realtime-messaging-voice-video/id1222921751) and use the same phone number to login to mesibo messenger-javascript. Please note that you will be logged out of your account on your phone once you log-in on the web app.

To login to mesibo messenger web app, in the login screen provide the phone number along with country code starting with `+` For Example, If your country code is `91` and your ten digit phone number is `XXXXXXXXXX`, enter your phone number as `+91XXXXXXXXXX` (with out any spaces or special characters in between)

If you entered a valid phone number, an OTP(One Time Password) will be sent to your phone number. Enter the OTP to login. Mesibo will generate and store `MESIBO_ACCESS_TOKEN` if login is successful. 

Please note that you only need to login once as for later sessions your token will be stored in local storage.

If you DO NOT wish to login with your phone number, make sure you configure a valid `MESIBO_ACCESS_TOKEN` in  `config.js` and set `isLoginEnabled = false` 


### Syncing with contacts on Messenger 

To synchronize contacts set `isContactSync = true`

For best experience using the messenger app, make sure you have some contacts on your phone who are using Mesibo Messenger. These contacts will be displayed as a list of available users to whom you can send messages or make calls. Optionally, you can also manually provide a list of phone-numbers of contacts who are using mesibo in `MESIBO_PHONES_ARRAY`. 

For Example,
`MESIBO_PHONES_ARRAY = ['91XXXXXXXXXX','91XXXXXXXXXX', ...]`

If you do not wish to synchronize contacts set `isContactSync = false` and provide a list of local contacts that will be loaded as a list of available users. Set local contacts as follows in `config.js`
```
	var MESIBO_LOCAL_CONTACTS =[
	{	
		 'address' : '91XXXXXXXXX'
		,'groupid' : 0	 
		,'picture' : 'images/profile/default-profile-icon.jpg'
		,'name'    : 'Contact Name'
		,'status'  : 'Contact status'
	},
	
	{	 'address' : ''
		,'groupid' : 1234 	 
		,'picture' : 'images/profile/default-group-icon.jpg'
		,'name'    : 'Group Name'
	},

	]
``` 

## Popup
To launch popup demo you can configure the following for setting the displayed user avatar and destination user(to which all messages will be sent to) in `config.js` and launch `popup.html`

```javascript
const POPUP_DISPLAY_NAME = "xxxx"
const POPUP_DISPLAY_PICTURE = "images/profile/default-profile-icon.jpg"
const POPUP_DESTINATION_USER = 'xxxx';
```

## FAQ & Troubleshooting

### Getting `AUTHFAIL` with getcontacts API 
This means the token you have provided in `MESIBO_ACCESS_TOKEN` is not generated or validated with your phone number which is required for synchronizing contacts. 

To generate a token by validating your phone number, make sure you have set `isLoginEnabled = true`. A login screen will then appear during app start, where you can enter your phone number(Example +91XXXXXXXXXX), get an OTP and login.

If you do not wish to synchronize contacts, set `isContactSync = false`and provide a list of local contacts in `MESIBO_LOCAL_CONTACTS`. 

### I do not wish to use phone login, what should I do?
Set `isLoginEnabled = false` and make sure that you provide a valid `MESIBO_ACCESS_TOKEN`

### I do not want to synchronize with my phone contacts, how do I configure that?
If you do not wish to synchronize contacts, set `isContactSync = false`and provide a list of local contacts in `MESIBO_LOCAL_CONTACTS`.

### Do I need to login with my phone number every time I load the app?
No the first time you login with your phone number with a valid OTP the token will be stored in localStorage. In future loading of the app, token will be loaded from local storage. Or if you have provided a valid `MESIBO_ACCESS_TOKEN` in `config.js` that will be loaded.    

### Getting $scope.mesibo.X is not a function
Ensure that you perform a hard reload so that you have the latest Mesibo Javascript API

