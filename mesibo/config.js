// config.js

/** Copyright (c) 2020 Mesibo
 * https://mesibo.com
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the terms and condition mentioned
 * on https://mesibo.com as well as following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions, the following disclaimer and links to documentation and
 * source code repository.
 *
 * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * Neither the name of Mesibo nor the names of its contributors may be used to
 * endorse or promote products derived from this software without specific prior
 * written permission.
 *
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 * Documentation
 * https://mesibo.com/documentation/
 *
 * Source Code Repository
 * https://github.com/mesibo/messenger-javascript
 *
 *
 */

/* Refer following tutorial and API documentation to know how to create a user token
 * https://mesibo.com/documentation/tutorials/first-app/
 *
 * Note, that if you are using logging in with your phone, Mesibo will generate the token.
 * In that case, there is no need to configure token here
 * 
 */
var MESIBO_ACCESS_TOKEN = ""; 

/* App ID used to create a user token. */
var MESIBO_APP_ID = "web";

/* If you are hosting Mesibo backend on your own server, change this accordingly.
 * Refer https://github.com/mesibo/messenger-app-backend
 */
const MESIBO_API_URL = "https://app.mesibo.com/messenger/api.php";

/* Default images */
const MESIBO_DEFAULT_PROFILE_IMAGE = "images/profile/default-profile-icon.jpg";
const MESIBO_DEFAULT_GROUP_IMAGE = "images/profile/default-group-icon.jpg";

/* File url sources */
var MESIBO_DOWNLOAD_URL = "https://appimages.mesibo.com/";
var MESIBO_UPLOAD_URL = "https://s3.mesibo.com/api.php";

/************************ Messenger Config Start *****************************/

/* Toggle for using phone Login*/
var isLoginEnabled = true;

/* Toggle for synchronizing contacts*/
var isContactSync = true;

/* Toggle for synchronizing messages
*  See https://mesibo.com/documentation/tutorials/get-started/synchronization/
*/
var isMessageSync = false;

/* (Optional) You can provide a list of contacts/groups,
* for displaying a list of users to chat with and contact synchronization 

For example:
var MESIBO_LOCAL_CONTACTS =[

{	
	"address" : "18885551001",
	"groupid" : 0,
	"picture" : "images/profile/default-profile-icon.jpg",
	"name"    : "MesiboTest",
	"status"  : "Let's Chat.."
},

{	
	"groupid" : 104661,	 
	"picture" : "images/profile/default-group-icon.jpg",
	"name"    : "Mesibo Group",
	"members" : "1:123,456,789"		//Members list. Add 1: to mark as admin
},

]
**/
MESIBO_LOCAL_CONTACTS = [];

/*Optional link preview*/
const isLinkPreview = false; //Set to false if link preview not required
const LINK_PREVIEW_SERVICE = "http://api.linkpreview.net/";
const LINK_PREVIEW_KEY = ""; // Access Key
const LINK_DEFAULT_IMAGE = "images/file/default-link-icon.jpg"

/************************ Messenger Config End *****************************/

/************************ Popup Config Start *****************************/

/* Set Display Avatar and destination address for popup */
const POPUP_DISPLAY_NAME = "Mesibo"
const POPUP_DISPLAY_PICTURE = "images/profile/default-profile-icon.jpg"
/* A destination where the popup demo app will send message or make calls */
const POPUP_DESTINATION_USER = "xxx" 

/************************ Popup Config End *****************************/


/* Debug Mode Configuration */
isDebug = true ;// toggle this to turn on / off for global control
if (isDebug) var MesiboLog = console.log.bind(window.console);
else var MesiboLog = function() {}

var ErrorLog = console.log.bind(window.console);
