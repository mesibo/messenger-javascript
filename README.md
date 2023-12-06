## Messenger-Javascript 
This repository contains the source code for the Mesibo Sample Web apps built using Mesibo Javascript API.

- **messenger** - A Whatsapp like messaging app that loads a list of users on the left and messages on the right 
 
> Please note that this is currently **under development** and will be continuously updated. 

## Features:
- One-to-One Messaging, Voice and Video Call
- Group Messaging
- Read receipts
- Forward, Delete & Resend 
- Sending Files
- Record and Send live audio, video & picture 
- Link Preview 
- Multi-Device Synchronization(*Supported if you are using mesibo On-Premise*)
- Multi-Tab popup

### Features under implementation
- Date header in the message area

## Instructions
All these demos require a mesibo user token which you can configure in `config.js` or use login screen to generate it. 

If you do not know what is mesibo user token, refer to the [Get-Started Guide](https://mesibo.com/documentation/tutorials/get-started) to learn about the basics of mesibo before continuing further. 

Refer to the `config.js` for configuration and instructions. 

### Login
The login code is completely independent of demos which makes it easier for you to rebrand. Login code generates token and saves into local storage and launches messenger (you can change this). The messenger/popup code reads token from either `config.js` (if configured) or local storage.

To login, in the login screen provide the phone number along with country code starting with `+` For Example, If your country code is `1 (United States)` and your ten-digit phone number is `XXXXXXXXXX`, enter your phone number as `+1XXXXXXXXXX` (without any spaces or special characters in between)

You need to log in to your mesibo account to generate OTP. 

## Support
Refer to following links before raising any support requests

- https://mesibo.com/documentation/faq/support/#what-information-should-i-provide-when-requesting-technical-support 

- https://mesibo.com/documentation/faq/support/#can-you-help-with-messenger-whatsapp-clone-demo-and-ui-modules



