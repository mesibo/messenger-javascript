//controller.js

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

const MAX_MESSAGES_READ_SUMMARY = 100;

//The number of messages loaded into the message area in one read call
const MAX_MESSAGES_READ = 10;


angular.module('MesiboWeb', [])
	.controller('AppController', ['$scope', '$window', '$anchorScroll', function ($scope, $window, $anchorScroll) {

		$scope.summarySession = {};
		$scope.messageSession = {};
		$scope.msg_read_limit_reached = false;
		$scope.scrollMessages = null;

		$scope.mesibo_user_messages = [];

		$scope.available_users =  [];
		$scope.selected_user = {};
		$scope.selected_user_count = 0; 
		$scope.self_user = {};

		$scope.mesibo = {}; 

		//Main UI
		$scope.profile_settings_show = false;
		$scope.users_panel_show = false;
		$scope.message_area_show = false;

		//Input Area
		$scope.input_message_text ="";
		$scope.link_preview = null

		//Calls  
		$scope.is_answer_call = false;
		$scope.is_video_call = false;
		$scope.is_voice_call = true;
		$scope.call_status = "Call Status: ";
		$scope.call_alert_message = "";

		//Files
		$scope.selected_file = {};
		$scope.input_file_caption = "";

		//Recorder
		$scope.recorder = null;

		$scope.refresh = function(){
			$scope.$applyAsync();
		}

		$scope.scrollToLastMsg = function() {
			$scope.$$postDigest(function () {
				$anchorScroll("messages_end");
			});
		}
		

		angular.element(document.getElementById('messages')).bind('scroll', function(e){
			//MesiboLog("scrolling");
			$scope.checkScrollTop(e);	
		})

		$scope.checkScrollTop = function(e) {
			const scroll = e.target.scrollTop;
			if($scope.msg_read_limit_reached)
				return;
			
		
			//MesiboLog("checkScrollTop", scroll);
			if(scroll == 0 && $scope.messageSession 
				&& $scope.messageSession.read){
				MesiboLog("Scrolled to top!");
				$scope.scrollMessages = e.target;
				$scope.messageSession.read(MAX_MESSAGES_READ);
			}
		}


		$scope.getMesibo = function(){
			return $scope.mesibo;
		}

		$scope.showAvailableUsers = function() {
			MesiboLog('showAvailableUsers');
			$scope.users_panel_show = true;
			$scope.refresh();   
		}

		$scope.hideAvailableUsers = function() {
			MesiboLog('hideAvailableUsers');
			$scope.users_panel_show = false;
			$scope.refresh();
		}

		$scope.setAvailableUsers = function(user_list) {
			$scope.available_users = user_list;
			$scope.refresh();
		}

		$scope.showProfileSettings = function() {
			MesiboLog("showProfileSettings");
			$scope.profile_settings_show = true;
			$scope.refresh();
		};

		$scope.hideProfileSettings = function() {
			MesiboLog("hideProfileSettings");
			$scope.profile_settings_show = false;
			$scope.refresh();
		};


		$scope.isSent = function(msg){
			return isSentMessage(msg.status);
		}

		$scope.isReceived = function(msg){
			return !isSentMessage(msg.status);
		}

		$scope.displayMessageArea = function(){
			MesiboLog('displayMessageArea');
			$scope.message_area_show = true;
			$scope.refresh();
		}

		/** At the start, load a certain number of messages from history 
		 * Update accordingly while scrolling to top
		 **/
		$scope.initMessageArea = function(user, msg_count){
			if(!isValid(user))
				return -1;

			// MesiboLog("initMessageArea", user);
			$scope.resetMessageSession();
			$scope.selected_user = user; 
			$scope.sessionReadMessages(user, msg_count);


		}

		$scope.generateMessageArea = function(contact){
			MesiboLog(contact);
			if(!isValid(contact))
				return -1;

			if(isValid($scope.selected_user)){
				var same_selection = false; 
				if(isGroup(contact))
					same_selection = ($scope.selected_user.groupid == contact.groupid);
				else
					same_selection = ($scope.selected_user.address == contact.address);

				if(same_selection)
					return 0;
			}

			$scope.selected_user = contact;

			// MesiboLog($scope.selected_user);
			$scope.initMessageArea($scope.selected_user, MAX_MESSAGES_READ);
			$scope.displayMessageArea();
		}


		$scope.resetMessageSession = function(){
			$scope.messageSession = {};
			$scope.refresh();
		}

		$scope.setSelectedUser = function(user){
			$scope.selected_user = user;
			$scope.refresh()
		}

		$scope.onKeydown = function(event) {
			console.log(event);
		}

		$scope.isGroup = function(user) {
			return isGroup(user);
		}


		$scope.getUserPicture = function(user){
			// MesiboLog(user);

			if(!isValid(user) || (undefined == user.picture)){
				picture = $scope.isGroup(user) ? MESIBO_DEFAULT_GROUP_IMAGE:MESIBO_DEFAULT_PROFILE_IMAGE; 
				return picture;
			}

			var picture = user.picture;

			if(!isValidImage(picture)){
				picture = $scope.isGroup(user) ? MESIBO_DEFAULT_GROUP_IMAGE:MESIBO_DEFAULT_PROFILE_IMAGE;
				return picture; 
			}

			if(isValidString(picture) && isValidImage(picture) && isValidString(MESIBO_DOWNLOAD_URL)){
				if((picture!= MESIBO_DEFAULT_PROFILE_IMAGE) && (picture!=MESIBO_DEFAULT_GROUP_IMAGE))
					picture = MESIBO_DOWNLOAD_URL + picture;
			}

			return picture; 
		} 

		$scope.getUserName = function(user){
			// MesiboLog("getUserName", user);
			if(!isValid(user))
				return "";

			var name = user.name;
			if(!isValidString(name)){
				name = "Invalid name";
				if($scope.isGroup(user))
					name = "Group_"+user.groupid ;
				else
					if(isValidString(user.address))
						name = user.address;
			}

			return name;
		}

		$scope.getUserLastMessage = function(user){
			if(!isValid(user))
				return "";

			var lastMessage = user.lastMessage;
			if(!isValid(lastMessage))
				return "";

			if(lastMessage.filetype)
				return getFileTypeDescription(lastMessage);

			var message = lastMessage.message;
			if(!isValidString(message))
				return "";

			return message;
		}

		$scope.getUserLastMessageTime = function(user){
			if(!isValid(user))
				return "";

			var lastMessage = user.lastMessage;
			if(!isValid(lastMessage))
				return "";

			var date = lastMessage.date;
			if(!isValid(lastMessage.date))
				return "";

			var date_ = date.date;
			if(!isValidString(date_))
				return "";

			var time = date.time;
			if(!isValidString(time))
				return "";

			if(date_ != 'Today')
				time = date_;

			return time;
		}

		$scope.getMessageStatusClass = function(m){
			if(!isValid(m))
				return "";

			if($scope.isReceived(m)){
				return "";
			}

			var status = m.status;
			var status_class = getStatusClass(status);
			if(!isValidString(status_class))
				return -1;

			return status_class;
		}

		$scope.setLinkPreview = function(lp){
			$scope.link_preview = lp;
			$scope.refresh();
		}

		$scope.closeLinkPreview = function(){
			$scope.link_preview = null;
			$scope.refresh();
		}

		$scope.inputTextChanged = async function(){
			MesiboLog('inputTextChanged');
			//if enabled config isLinkPreview
			if(isLinkPreview){
				//xx Bug xx: If link_preview is already present doesn't update
				if(isValid($scope.link_preview) && isValidString($scope.link_preview.url)){
					var newUrl = getUrlInText($scope.input_message_text);
					if(newUrl == $scope.link_preview.url)
						return; //Make no changes to existing preview
				}

				var urlInMessage = getUrlInText($scope.input_message_text);
				if(isValidString(urlInMessage)){
					MesiboLog("Fetching preview for", urlInMessage)
					var lp = await $scope.file.getLinkPreviewJson(urlInMessage, LINK_PREVIEW_SERVICE, LINK_PREVIEW_KEY);
					// var lp = getSampleLinkPreview(); /*For testing */
					if(isValid(lp)){
						MesiboLog(lp);
						$scope.setLinkPreview(lp);
						$scope.refresh();
					}
				}
				else
					$scope.link_preview = null;
			}
		}



		$scope.getMessageStatusColor = function(m){
			// MesiboLog("getMessageStatusColor", m);
			if(!isValid(m))
				return "";

			if($scope.isReceived(m))
				return "";

			var status = m.status;
			var status_color = getStatusColor(status);
			if(!isValidString(status_color))
				return "";

			return status_color;
		}

		$scope.logout = function(){
			$('#logoutModal').modal("show");
			if(deleteTokenInStorage)
				deleteTokenInStorage();
		}

		$scope.getFileIcon = function(f){
			return getFileIcon(f);
		}

		$scope.sessionReadSummary = function(){
			$scope.summarySession = $scope.mesibo.readDbSession(null, 0, null, 
				function on_read(result) {
					// Read handler
					// Provides a list of users that you have had conversations with
					// Along with their lastMessage
					MesiboLog("==> on_read summarySession", result);
					if(result == undefined || result == null)
						return;
					
					if(this.readCount && result < this.readCount){
						MesiboLog("Run out of users to display. Syncing..");
						$scope.syncMessages(this, this.readCount - result);
					}

					let users = this.getMessages();
					if(users && users.length > 0){
						let init_user = users[0];
						$scope.generateMessageArea(init_user);
						$scope.selected_user = init_user;
					}  
					$scope.refresh()
				});
			
			if(!$scope.summarySession){
				MesiboLog("Invalid summarySession");
				return -1;
			}
			
			$scope.summarySession.enableSummary(true);
			$scope.summarySession.readCount = MAX_MESSAGES_READ_SUMMARY;
			$scope.summarySession.read(MAX_MESSAGES_READ_SUMMARY);
		}

		
		$scope.syncMessages = function(readSession, count, type){
			if(!(readSession && count && readSession.sync)){
				MesiboLog("syncMessages", "Invalid Input", readSession, count);
				return;
			}

			MesiboLog("syncMessages called \n", readSession, count);	
			
			readSession.sync(count,
				function on_sync(i){
					MesiboLog("on_sync", i);
					if(i>0){
						MesiboLog("Attempting to read "+ i + " messages");
						let rCount = this.read(i);
						MesiboLog("Read "+ rCount + " messages");
						if(type && rCount)
							$scope.msg_read_limit_reached = false;
					}
				});
		}

		$scope.sessionReadMessages = function(user, count){
			MesiboLog("sessionReadMessages", user);
			var peer = user.address;
			var groupid = user.groupid;

			MesiboLog("readMessages "+ peer+ " "+" groupid "+ groupid+ " "+ count);

			$scope.messageSession =  $scope.mesibo.readDbSession(peer, groupid, null, 
				function on_read(result) {
					// Read handler
					// result will be equal to the number of messages read
					MesiboLog("==> on_read messageSession", result);
					
					if(result == undefined || result == null || result == NaN)
						return;
					
					if(this.readCount && result < this.readCount){
						MesiboLog("Run out of messages to display. Syncing..");
						$scope.msg_read_limit_reached = true;
						$scope.syncMessages(this, this.readCount - result, 1);
					}
					
					var msgs = this.getMessages();
					$scope.mesibo_user_messages = msgs;

					$scope.refresh();
					if($scope.scrollMessages){
						$scope.scrollMessages.scrollTop = result*5;
					}
					else
						$scope.scrollToLastMsg();
				});


			if(!$scope.messageSession){
				MesiboLog("Invalid messageSession");
				return -1;
			}

			$scope.messageSession.enableReadReceipt(true);
			$scope.messageSession.readCount = count;
			$scope.messageSession.read(count);
			

		}


		$scope.Mesibo_OnMessage = async function(m, data) {
			MesiboLog("$scope.prototype.OnMessage", m, data);
                        if(!m.id || m.presence)
                                return;
			
                        for (var i = $scope.mesibo_user_messages.length - 1; i >= 0; i--) {
                                if($scope.mesibo_user_messages[i].id == m.id)
                                        return;
                        }
                        $scope.mesibo_user_messages.push(m);

			// If you get a message from a new contact, the name will be ""
			// So, you need to add it as a contact and synchronize with backend
			// var user = m.user;
			// if(isValid(user) && isContactSync){
			//     var uname = user.name;
			//     if("" == uname){
			//         if(!isGroup(user))
			//             $scope.app.fetchContacts(MESIBO_ACCESS_TOKEN, 0, [m.address]);
			//     }

			// }

			//Update profile details
			if (1 == m.type) {
				if(m.message == "")
					return -1;

				var updated_user = JSON.parse(m.message);
				if(!isValid(data))
					return -1;
				MesiboLog("Update contact", updated_user);
				var c = {};
				c.address = updated_user.phone;
				c.groupid = parseInt(updated_user.gid);
				c.picture = updated_user.photo;
				c.name = updated_user.name;
				c.status = updated_user.status;
				c.ts = parseInt(updated_user.ts);

				MesiboLog("Update contact", c);
				var rv = $scope.mesibo.setContact(c);
				$scope.refresh();

				return 0;
			}

			$scope.refresh();
			$scope.scrollToLastMsg();

			return 0;
		};

		function getCurrentDate(){
                        let d = {};
                        const date = new Date();
                        let h = date.getHours() + "";
                        let m = date.getMinutes() + "";
                        if(h.length < 2)
                                h = "0" + h;
                        if(m.length < 2)
                                m = "0" + m;
                        d.time = h + ":" + m;
                        d.yd = "Today";

                        return d;
                }

                $scope.onKeydown = function(event){
                        MesiboLog("onKeydown". event);
                        event.preventDefault();
                }

		//Send text message to peer(selected user) by reading text from input area
		$scope.sendMessage = function() {
			MesiboLog('sendMessage');

			var value = $scope.input_message_text;
			if(!value)	
				return -1;

			MesiboLog($scope.selected_user);
			var messageParams = {}
			messageParams.id = $scope.mesibo.random();
			messageParams.peer = $scope.selected_user.address; 
			messageParams.groupid = $scope.selected_user.groupid;
			messageParams.flag = MESIBO_FLAG_DEFAULT;
			messageParams.message = value;

			if(isLinkPreview && isValid($scope.link_preview)){
				//If link preview is enabled in configuration
				var urlInMessage = getUrlInText(messageParams.message);
				if(isValidString(urlInMessage)){
					$scope.file.sendMessageWithUrlPreview($scope.link_preview, messageParams);
				}
			}
			else{
				$scope.mesibo.sendMessage(messageParams, messageParams.id, messageParams.message);
			}
			
			//$scope.mesibo_user_messages.push(messageParams);
			$scope.input_message_text = "";
			$scope.refresh();
			$scope.scrollToLastMsg();
			return 0;
		}

		$scope.makeVideoCall = function(){
			$scope.is_video_call = true;
			$scope.call.videoCall();
			$scope.refresh();
		}

		$scope.makeVoiceCall = function(){
			$scope.is_voice_call = true;
			$scope.call.voiceCall();
			$scope.refresh();
		}

		$scope.hangupCall = function(){
			$('#answerModal').modal("hide");
			$scope.mesibo.hangup(0);
			$scope.is_answer_call = false;
			$scope.refresh();   
		}

		$scope.answerCall = function(){
			$scope.is_answer_call = true;
			$scope.call.answer();
			$scope.refresh();   
		}

		$scope.showRinging = function(){
			$('#answerModal').modal({
				show: true
			});
		}

		$scope.hangupVideoCall = function(){
			$('#videoModal').modal("hide");
			$scope.is_video_call = false;
			$scope.call.hangup();
			$scope.refresh();
		}

		$scope.hangupAudioCall = function(){
			$('#voiceModal').modal("hide");
			$scope.is_voice_call = false;
			$scope.call.hangup();
			$scope.refresh();
		}

		$scope.showVideoCall = function(){
			$('#videoModal').modal("show");
			$scope.is_video_call = true;
			$scope.refresh();
		}

		$scope.showVoiceCall = function(){
			$('#voiceModal').modal("show");
			$scope.is_voice_call = true;
			$scope.refresh();
		}

		$scope.clickUploadFile = function(){
			setTimeout(function () {
				angular.element('#upload').trigger('click');
			}, 0);
		}

		$scope.onFileSelect = function(element){
			$scope.$apply(function(scope) {
				var file = element.files[0];
				if(!isValid(file)){
					MesiboLog("Invalid file");
					return -1;
				}

				MesiboLog("Selected File =====>", file);

				$scope.selected_file = file;
				$scope.showFilePreview(file);
				MesiboLog('Reset', element.value);
				element.value = '';

			});
		}

		$scope.showFilePreview = function(f) {
			var reader = new FileReader();
			$('#image-preview').attr('src', "");
			$('#video-preview').attr('src', "");
			$('#video-preview').hide();

			reader.onload = function(e) {
				if(isValidFileType(f.name, 'image'))
					$('#image-preview').attr('src', e.target.result);
				else if(isValidFileType(f.name, 'video')){
					$('#video-preview').attr('src', e.target.result);
					$('#video-preview').show();
				}
			}

			reader.readAsDataURL(f);

			var s = document.getElementById("fileModalLabel");
			if (s) {
				s.innerText = "Selected File " + f.name;
			}

			$('#fileModal').modal("show");
		}

		$scope.openAudioRecorder = function(){
			$('#recorderModal').modal("show");
			$scope.recorder = new MesiboRecorder($scope, "audio");
			$scope.recorder.initAudioRecording();
		}

		$scope.openPictureRecorder = function(){
			$('#recorderModal').modal("show");
			$scope.recorder = new MesiboRecorder($scope, "picture");
			$scope.recorder.initPictureRecording();
		}

		$scope.closeRecorder = function(){
			MesiboLog("Closing recorder.., shutting down streams.", $scope.recorder);
			$('#recorderModal').modal("hide");
			if(!$scope.recorder)
				return;
			$scope.recorder.close();
			$scope.recorder = null;			
		}

		$scope.closeFilePreview = function() {
			$('#fileModal').modal("hide");
			//Clear selected file button attr
		}

		$scope.sendFile = function(){
			$scope.file.uploadSendFile();
		}

		$scope.isFileMsg = function(m){
			return isValid(m.filetype);
		}

		$scope.hostnameFromUrl = function(pUrl){
			if(!isValidString(pUrl))
				return "";
			var hostname = pUrl.replace('http://','').replace('https://','').split(/[/?#]/)[0];
			if(!isValidString(hostname))
				return "";

			return hostname;
		}

		//Message contains URL Preview
		$scope.isUrlMsg = function(m){
			return ($scope.isFileMsg(m) && !isValidString(m.fileurl));
		}

		$scope.isImageMsg = function(m){
			if(!$scope.isFileMsg(m))
				return false;
			return (MESIBO_FILETYPE_IMAGE == m.filetype);
		}

		$scope.isVideoMsg = function(m){
			if(! $scope.isFileMsg(m))
				return false;
			return (MESIBO_FILETYPE_VIDEO == m.filetype);
		}


		$scope.isAudioMsg = function(m){
			if(! $scope.isFileMsg(m))
				return false;
			return (MESIBO_FILETYPE_AUDIO == m.filetype);
		}

		$scope.isOtherMsg = function(m){
			if(! $scope.isFileMsg(m))
				return false;
			return (m.filetype >= MESIBO_FILETYPE_LOCATION);
		}

		$scope.Mesibo_OnConnectionStatus = function(status){
			MesiboLog("MesiboNotify.prototype.Mesibo_OnConnectionStatus: " + status);	
			if(MESIBO_STATUS_SIGNOUT == status)
				$scope.logout();

			var s ="";
			switch(status){
				case MESIBO_STATUS_ONLINE:
					s = "";
					break;
				case MESIBO_STATUS_CONNECTING:
					s = "Connecting..";
					break;
				default: 
					s = "Not Connected";
			}

			$scope.self_user.connection_status = s;
			$scope.refresh();
		}

		$scope.Mesibo_OnMessageStatus = function(m){
			MesiboLog("MesiboNotify.prototype.Mesibo_OnMessageStatus: from " + m.peer +
		" status: " + m.status);
			MesiboLog("OnMessageStatus", m);
			$scope.refresh();
		}

		$scope.Mesibo_OnCall = function(callid, from, video){
			if(video){
				$scope.is_video_call = true;
				$scope.mesibo.setupVideoCall("localVideo", "remoteVideo", true);
			}
			else{
				$scope.is_voice_call = true;
				$scope.mesibo.setupVoiceCall("audioPlayer");
			}

			$scope.call_alert_message = "Incoming "+(video ? "Video" : "Voice")+" call from: "+from;
			$scope.is_answer_call = true;

			$scope.showRinging();
		}

		$scope.Mesibo_OnCallStatus = function(callid, status){

			var s = "";

			switch (status) {
				case MESIBO_CALLSTATUS_RINGING:
					s = "Ringing";
					break;

				case MESIBO_CALLSTATUS_ANSWER:
					s = "Answered";
					break;

				case MESIBO_CALLSTATUS_BUSY:
					s = "Busy";
					break;

				case MESIBO_CALLSTATUS_NOANSWER:
					s = "No Answer";
					break;

				case MESIBO_CALLSTATUS_INVALIDDEST:
					s = "Invalid Destination";
					break;

				case MESIBO_CALLSTATUS_UNREACHABLE:
					s = "Unreachable";
					break;

				case MESIBO_CALLSTATUS_OFFLINE:
					s = "Offline";
					break;      
				
				case MESIBO_CALLSTATUS_COMPLETE:
					s = "Complete";
					break;      
			}
			
			if(s)
				$scope.call_status = "Call Status: " + s;
			$scope.refresh();

			if (status & MESIBO_CALLSTATUS_COMPLETE) {
				if ($scope.is_video_call)
					$scope.hangupVideoCall();
				else
					$scope.hangupAudioCall();
			}
		}

		$scope.init_messenger = function(){
			MesiboLog("init_messenger called"); 
			$scope.sessionReadSummary();     
			$scope.app = new MesiboApp($scope);
			$scope.call = new MesiboCall($scope);
			$scope.file = new MesiboFile($scope);
			if(isContactSync)
				$scope.app.fetchContacts(MESIBO_ACCESS_TOKEN, 0, MESIBO_PHONES_ARRAY);
			else
				$scope.setAvailableUsers(MESIBO_LOCAL_CONTACTS);
		}

		$scope.init_popup = function(){ 
			MesiboLog("init_popup called"); 
			$scope.selected_user.name = POPUP_DISPLAY_NAME; 
			$scope.selected_user.picture = POPUP_DISPLAY_PICTURE; 
			$scope.selected_user.address = POPUP_DESTINATION_USER; 
			$scope.selected_user.groupid = 0; 
			$scope.selected_user.activity = ""; 

			$scope.call = new MesiboCall($scope);
			$scope.file = new MesiboFile($scope);

			$scope.sessionReadMessages($scope.selected_user, MAX_MESSAGES_READ); 
		} 

		$scope.initMesibo = function(demo_app_name){
			$scope.mesibo = new Mesibo();
			$scope.mesiboNotify = $scope;

			//Initialize Mesibo
			$scope.mesibo.setAppName(MESIBO_APP_ID);
			$scope.mesibo.setCredentials(MESIBO_ACCESS_TOKEN);
			$scope.mesibo.setListener($scope.mesiboNotify);
			$scope.mesibo.setDatabase("mesibodb");
			$scope.mesibo.start();           

			//Initialize Application
			if(demo_app_name == "messenger")
				$scope.init_messenger();

			if(demo_app_name == "popup"){
				//Contact synchronization is not required for popup
				isContactSync = false;
				$scope.init_popup();
			}
		}

	}]);


