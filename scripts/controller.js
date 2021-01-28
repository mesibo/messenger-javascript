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



//The number of messages loaded into the message area in one read call
const MAX_MESSAGES_READ = 10;

//The number of users to be loaded (summary)
const MAX_MESSAGES_READ_SUMMARY = 10;

const MAX_FILE_SIZE_SUPPORTED = 10000000;




var mesiboWeb = angular.module('MesiboWeb', []);

mesiboWeb.directive('imageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
        	if(!scope.$last)
        		return;

    		element.bind('load', function() {
    			MesiboLog("image load")
	            scrollToEnd(true);
            });

            element.bind('error', function(){
                ErrorLog('Error loading image');
            });                                   
        }
    };
});

mesiboWeb.directive('videoonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
        	if(!scope.$last)
        		return;

    		element.bind('loadeddata', function() {
    			MesiboLog("video loadeddata");
	            scrollToEnd(true);
            });

            element.bind('error', function(){
                ErrorLog('Error loading video');
            });                                   
        }
    };
});


mesiboWeb.directive('onFinishRender', function($timeout) {
        return {
                link: function(scope, element, attr) {
                        if (scope.$last === true) {
                                $timeout(function() {
                                        scope.$emit(attr.onFinishRender);
                                });
                        }
                }
        };
});


mesiboWeb.controller('AppController', ['$scope', '$window', '$anchorScroll', function ($scope, $window, $anchorScroll) {

		$scope.summarySession = {};
		$scope.messageSession = {};
		$scope.msg_read_limit_reached = false;
		$scope.scroll_messages = null;
		$scope.is_shared = false;

		$scope.mesibo_user_messages = [];

		$scope.available_users =  [];
		$scope.available_groups = [];
		$scope.available_phones = [];
		$scope.last_sync_ts = 0;

		$scope.selected_user = {};
		$scope.selected_user_count = 0; 
		$scope.self_user = {};

		$scope.forward_message = null;

		$scope.mesibo = {}; 

		//Main UI
		$scope.display_profile = null;
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

		$scope.MAX_MEDIA_WIDTH = '320px';
		$scope.MAX_MEDIA_HEIGHT = '240px';

		$scope.MIN_MEDIA_WIDTH = '160px';
		$scope.MIN_MEDIA_HEIGHT = '120px';

		$scope.refresh = function(){
			$scope.$applyAsync();
		}

		$scope.scrollToLastMsg = function() {
			$scope.$$postDigest(function () {
				//$anchorScroll("messages_end");
				scrollToEnd(false);
			});
		}

		$scope.updateMessagesScroll = function(){

		}

		 $scope.$on('onMessagesRendered', function(e) {
			 MesiboLog("onMessagesRendered");
		 	 if($scope.scroll_messages && 
				 $scope.scroll_messages.scrollTop == 0
			 	&& $scope.messageSession
			 	&& $scope.messageSession.getMessages().length){
		 	 	  MesiboLog('onMessagesRendered');
			 }

			$scope.scrollToLastMsg();
			 
		 });
		

		angular.element(document.getElementById('messages')).bind('scroll', function(e){
			//MesiboLog("scrolling");
			$scope.checkScroll(e);	
		})


		$scope.checkScroll = function(e) {
			if(!(e && e.target))
				return;

			$scope.scroll_messages = e.target;
			
			if($scope.scroll_messages.scrollTop == 0){
				if(!($scope.messageSession 
					&& $scope.messageSession.getMessages)){
					return;
				}

				var m = $scope.messageSession.getMessages().length;
				if(m == 0){
					return;
				}

				MesiboLog("checkScroll: Scrolled to top!");
				//Load more messages
				$scope.messageSession.read(MAX_MESSAGES_READ);
			}
				
		}


		$scope.getMesibo = function(){
			return $scope.mesibo;
		}

		$scope.showAvailableUsers = function() {
			MesiboLog('showAvailableUsers');
			$scope.users_panel_show = true;

			//prompt to add a contact if no contacts available
			if(!($scope.available_users && $scope.available_users.length))
				$scope.showContactForm();

			$scope.refresh();   
		}

		$scope.hideAvailableUsers = function() {
			MesiboLog('hideAvailableUsers');
			$scope.users_panel_show = false;
			$scope.refresh();
		}

		$scope.getContact = function(address, groupid){
			if(!(address || groupid))
				return null;

			for (var i = $scope.available_users.length - 1; i >= 0; i--) {
				if($scope.available_users[i] 
					&& $scope.available_users[i].address == address
					&& $scope.available_users[i].groupid == groupid)

					return $scope.available_users[i];				
			
			}
			return null;
		}




		$scope.createGroup = function(g){
			if(!(g && $scope.isGroup(g)))
				return;

			var gg = g;
			var members = g.members;

			if(!members)
				return;

			//TBD: In case of multiple admins, this is incomplete
			if(members.slice(0,2) == "1:")
				gg.membersString = members.slice(2);

			members = members.split(","); // list of members is a comma seperated addresses of group members		

			for (var i = 0; i < members.length; i++) {
				//In the members list if the element is the admin it is marked by "1:"
				//Example: 1:91xxxxxxxxxx
				//TBD: If only member in group?
				if(members[i].slice(0,2) == "1:")
					members[i] = members[i].slice(2);				

				var c = $scope.getContact(members[i]);
				if(c)
					members[i] = c;
				else{
					var u = {};
					u.name = members[i];
					u.address = members[i];
					members[i] = $scope.createContact(u);
				}
			}
			gg.membersList = members;
			return gg;

		}

		$scope.createContact = function(u){
			if(!u)
				return;

			if(!u.address)
				return;

			var c = null;
			c = $scope.getContact(u.address);
			if(c && c.name)
				u.name = c.name;

			if(!u.name)
				u.name = u.address;

			if(!u.picture)
				u.picture = MESIBO_DEFAULT_PROFILE_IMAGE;

			return u;
			
		}


		$scope.createGroups = function(user_list){
			MesiboLog("createGroups");
			if(!user_list)
				user_list = $scope.available_groups;

			//TBD: Instead keep adding to this list or make a map
			$scope.available_groups = [];


		}

		$scope.removeIfExisting = function(u){
			MesiboLog("removeIfExisting", u, $scope.available_users);
			if(!(u && !$scope.available_users))
				return;

			if(!($scope.available_users && $scope.available_users.length))
				return;

			// TBD: Not effecient
			// Worst case if there are N new contacts, with existing N contacts then, N^2 comparisons

			var c = [];
			for (var i = 0 ; i < $scope.available_users.length; i--) {
				// MesiboLog($scope.available_users);
				var au = $scope.available_users[i]; 
				if(!au)
					return; //Bad data

				if( (au.address && au.address == u.address)){
					$scope.available_users = $scope.available_users.splice(i, 1);
					return;
				}
			}

			return $scope.available_users;
		}

		$scope.storeContacts = function(contacts){
			if(!(contacts && contacts.length))
				return;

			if(!($scope.mesibo && $scope.mesibo.getUid))
				return;

			var uid = $scope.mesibo.getUid();
			if(!uid)
				return;

			localStorage.setItem("MESIBO_CONTACTS_"+uid, JSON.stringify(contacts))
		}

		$scope.updateExistingContact = function(u){
			if(!(u && u.address))
				return;

			for (var i = 0; i < $scope.available_users.length; i++) {
				if($scope.available_users[i].address == u.address){
					$scope.available_users[i] = u;
					$scope.mesibo.setContact($scope.available_users[i]);
					if(u.address == $scope.selected_user.address){
						MesiboLog("Update Message Area", u);
						$scope.selected_user.name = u.name;
						$scope.selected_user.picture = u.picture;
					}
					//Contact matched and updated. 
					$scope.refresh();
					return;
				}						
			}
		}

		$scope.setAvailableUsers = function(user_list) {
			MesiboLog("setAvailableUsers", user_list);
			if(!(user_list && user_list.length))
				return


			var ul = [];
			var hasGroup = false;
			var hasExisting = false;

			if($scope.available_users && $scope.available_users.length)
				hasExisting = true;
			
			for (var i = 0; i < user_list.length; i++) {
				MesiboLog("setAvailableUsers", "Update user:", user_list[i]);
				var u = user_list[i];
				u = $scope.createContact(u);															

				if($scope.isGroup(user_list[i]))
					u = $scope.createGroup(user_list[i]);

				MesiboLog("Updated contact", u);

				if(!u){
					ErrorLog("Invalid contact", u);
					return;
				}


				$scope.mesibo.setContact(u);
				
				if(!hasExisting){
					$scope.available_users.push(u); 
				}
				else {
					//Update existing contact if address already present					
					$scope.updateExistingContact(u);
				}				
			}
			

			if($scope.summarySession && $scope.summarySession.getMessages){
					var ul = $scope.summarySession.getMessages();
					if(ul && ul.length){
						for (var i = 0; i < ul.length; i++) {
							var u = ul[i];
							var c = $scope.getContact(u.address, u.groupid);
							if(!c)
								$scope.syncContact(u);
						}
					}
			}

			$scope.storeContacts($scope.available_users);
			MesiboLog("Set available users....", $scope.available_users);

			$scope.refresh();
			
		}

		$scope.showProfile = function(p) {
			MesiboLog("showProfile");
			if(!p)
				return;
			$scope.display_profile = p; 
			$scope.refresh();
		};

		$scope.hideProfileSettings = function() {
			MesiboLog("hideProfileSettings");
			$scope.display_profile = null; 
			$scope.refresh();
		};

		$scope.hideForwardList = function() {
			MesiboLog("hideForwardList");
			$scope.forward_message = null; 
			$scope.refresh();
		};

		//fm is the message to be forwarded
		$scope.showForwardList = function(fm){
			if(!fm)
				return;

			$scope.forward_message = fm;
			$scope.refresh();
		}


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
			$scope.scroll_messages = null;
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
			$scope.scrollToLastMsg();
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

		$scope.showContactForm = function(){
			$('#ModalContactForm').modal("show");
		}

		$scope.promptAddContact = function(){
			$('#promptAddContact').modal("show");
		}

		$scope.closePromptAddContact = function(){
			$('#promptAddContact').modal("hide");
		}

		$scope.hideContactForm = function(){
			$('#ModalContactForm').modal("hide");
			if(document.getElementById('contact-address'))
				document.getElementById('contact-address').value = "";

			if(document.getElementById('contact-name'))
				document.getElementById('contact-name').value = "";

		}

		$scope.createUser = function(name, address){
			if(!(name && address))
				return;

			var u = {};
			u.name = name;
			u.address = address;
			u.groupid = 0;
			u.picture = "images/profile/default-profile-icon.jpg";
			u.status = "";

			return u;
		}

		$scope.syncContact = function(c){
			MesiboLog("syncContact", c, $scope.available_users);
			if(!c)
				return;


			for (var i = 0; i < $scope.available_users.length; i++) {
				var a = $scope.available_users[i];
				if( a.address && a.address == c.address){
					MesiboLog("Update existing");
					$scope.available_users[i].name = c.name;
					$scope.mesibo.setContact($scope.available_users[i]);
					
					if(a.address == $scope.selected_user.address){
						MesiboLog("Update Message Area", a);
						$scope.selected_user.name = a.name;
					}

					$scope.storeContacts($scope.available_users);
					return $scope.available_users[i];
				}
			}

			MesiboLog("......", $scope.available_users);
			c = $scope.createContact(c);
			$scope.available_users.unshift(c);
			$scope.storeContacts($scope.available_users);

			//Synchronize with backend
			var available_addr = [];
			for (var i = $scope.available_users.length - 1; i >= 0; i--) {
				if($scope.available_users[i] && $scope.available_users[i].address)
					available_addr.push($scope.available_users[i].address);
			}
			

			if(isContactSync){				
				$scope.app.fetchContacts(MESIBO_ACCESS_TOKEN, 0, available_addr);
			}

			$scope.refresh();
			return c;

		}

		$scope.addContact = function(){
			MesiboLog("Add Contact");			
			var cName = "New User";
			var cAddress = null;

			if(!document.getElementById('contact-address'))
				return;

			cAddress = document.getElementById('contact-address').value;
			if(!cAddress){
				alert("Enter valid phone number / address");	
				return;
			}

			if(cAddress[0]== "+")
				cAddress = cAddress.slice(1);

			if(document.getElementById('contact-name') && document.getElementById('contact-name').value)
				cName = document.getElementById('contact-name').value;

			if(!cName)
				cName = "New User";

			var nUser = $scope.createUser(cName, cAddress);
			if(!nUser)
				return;


			$scope.hideContactForm();

			if(!$scope.available_users)
				$scope.available_users = [];

			
			var c = $scope.syncContact(nUser);

			MesiboLog("Added contact", nUser);
			MesiboLog("AVAILABLE USERS", $scope.available_users);			
			
			
			//TBD: After adding new contact, select that
			MesiboLog("====> generateMessageArea for", c);
			$scope.generateMessageArea(c);

			$scope.refresh();
		}


		$scope.isValidPreview = function(type){
			MesiboLog("isValidPreview", type);

			if(type == "image"){
				var e = document.getElementById("image-preview");
				if(!e)
					return;

				MesiboLog(e);
				var fname = e.src;

				MesiboLog(fname);
				if(!fname)
					return;

				return isValidImage(fname);
			}

			if(type == "video"){
				var e = document.getElementById("video-preview");
				if(!e)
					return;

				var fname = e.src;
				if(!fname)
					return;

				return isValidVideo(fname);

			}

			return false;
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
			if(!user)
				return "";

			var name = user.name;
			if(!name){
				name = "";
				if($scope.isGroup(user))
					name = "Group_"+user.groupid ;
				else
					if(user.address)
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

		$scope.getFileName = function(m){
			if(!m)
				return;

			if(m.title)
				return m.title;

			var fileUrl = m.fileurl;
		    if(!fileUrl)
		        return;

		    var f = fileUrl.split("/");
		    if(!(f && f.length))
		        return;

		    var fname = f[f.length - 1];
		    return fname;
		}

		$scope.getVideoWidth = function(e){
			MesiboLog("getVideoWidth", e);
		}

		$scope.getVideoHeight = function(e){
			MesiboLog("getVideoHeight", e);
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

		$scope.deleteTokenInStorage = function(){
		   localStorage.removeItem("MESIBO_MESSENGER_TOKEN");
		}
		$scope.logout = function(){
			$('#logoutModal').modal("show");
			$scope.deleteTokenInStorage();
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
					
					if(isMessageSync && this.readCount && result < this.readCount){
						MesiboLog("Run out of users to display. Syncing..");
						$scope.syncMessages(this, this.readCount - result);
					}

					var users = this.getMessages();
					if(users && users.length > 0){
						var init_user = users[0];
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
						var rCount = this.read(i);
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
					
					if(isMessageSync && this.readCount && result < this.readCount){
						MesiboLog("Run out of messages to display. Syncing..");
						$scope.msg_read_limit_reached = true;
						$scope.syncMessages(this, this.readCount - result, 1);
						return;
					}
					
					var msgs = this.getMessages();

					if(msgs && msgs.length){
						$scope.mesibo_user_messages = msgs;
					}
					
					if($scope.scroll_messages 
						&& $scope.scroll_messages.scrollTop == 0
						&& msgs.length){
						$scope.scroll_messages.scrollTop = result * 10; 
					}
					else{
						$scope.scrollToLastMsg();
					}

					$scope.refresh();
				});


			if(!$scope.messageSession){
				MesiboLog("Invalid messageSession");
				return -1;
			}

			$scope.messageSession.enableReadReceipt(true);
			$scope.messageSession.readCount = count;
			$scope.messageSession.read(count);
			

		}

        $scope.readMessages = function(userScrolled){

            if($scope.messageSession)
                    $scope.messageSession.read(MAX_MESSAGES_READ);
            else
                    $scope.sessionReadMessages($scope.selected_user, MAX_MESSAGES_READ);
	    }

	    $scope.update_read_messages = function(m, rid){
            $scope.messageSession.getMessages = function(){
                    return m;
            }

            $scope.$applyAsync(function()  {
                    if($scope.scroll_messages){
                            if($scope.mesibo_user_messages &&
                                    $scope.mesibo_user_messages.length == m.length)
                                    return;
                            $scope.scroll_messages.scrollTop = 50;
                    }
                    else
                            $scope.scrollToLastMsg();

            });

            $scope.mesibo_user_messages = m;
            MesiboLog("scope.update_read_messages", $scope.messageSession.getMessages());
            $scope.refresh();
	    }

	    $scope.deleteSelectedMessage = function(m){
	    	MesiboLog("deleteSelectedMessage", m);
	    	if(!m)
	    		return;

	    	var id = m.id;
	    	if(!id)
	    		return;

	    	if($scope.mesibo && $scope.mesibo.deleteMessage){
	    		MesiboLog("deleteSelectedMessage with id: ", id);	    		
	    		$scope.messageSession.deleteMessage(id);
	    		$scope.mesibo.deleteMessage(id);		
	    	}

	    	$scope.refresh();
	    }

	    $scope.forwardMessageTo = function(to){
	    	MesiboLog("forwardMessageTo", to);
	    	if(!to)
	    		return;

	    	var m = $scope.forward_message;
	    	MesiboLog(m, $scope.forward_message);
	    	if(!m)
	    		return;

	    	$scope.forwardSelectedMessage(m, to);

	    	$scope.forward_message = null;
	    	$scope.refresh();

	    	$scope.generateMessageArea(to);
	    }

	    $scope.forwardSelectedMessage = function(m, to){
	    	MesiboLog("forwardSelectedMessage", m, to);
	    	if(!(m && to))
	    		return;

	        var p = {};	 

	        if(to.address)       
		        p.peer =  to.address;

		    if(to.groupid)
		    	p.groupid = to.groupid;

	        p.expiry = 3600;

	    	var id = m.id;
	    	if(!id)
	    		return;

	    	if($scope.mesibo && $scope.mesibo.forwardMessage){
	    		MesiboLog("forwardSelectedMessage with id: ", id, " with params:", p);
	    		$scope.mesibo.forwardMessage(p, $scope.mesibo.random(), id);	    			    		
	    	}

	    	$scope.refresh();
	    	$scope.scrollToLastMsg();
	    }

	    $scope.resendSelectedMessage = function(m){
	    	MesiboLog("resendSelectedMessage", m);
	    	if(!$scope.selected_user)
	    		return;

	        var p = {};	 

	        if($scope.selected_user.address)       
		        p.peer =  $scope.selected_user.address;

		    if($scope.selected_user.groupid)
		    	p.groupid = $scope.selected_user.groupid;

	        p.expiry = 3600;

	    	var id = m.id;
	    	if(!id)
	    		return;

	    	if($scope.mesibo && $scope.mesibo.resendMessage){
	    		MesiboLog("resendSelectedMessage with id: ", id, " with params:", p);
	    		var r = $scope.mesibo.resendMessage(p, id);
	    		MesiboLog("resendSelectedMessage returned", r);	    			    		
	    	}
	    }

		$scope.Mesibo_OnMessage = async function(m, data) {
			MesiboLog("$scope.prototype.OnMessage", m, data);
            if(!m.id || m.presence)
                    return;
		
	    
	    	if($scope.is_shared){
	    		//Modified message access in case of shared popup 
	            for (var i = $scope.mesibo_user_messages.length - 1; i >= 0; i--) {
	                    if($scope.mesibo_user_messages[i].id == m.id){
	                            MesiboLog("Mesibo_OnMessage", "Message exists");
				    return;
			    }
	            }
	            $scope.mesibo_user_messages.push(m);
            }
	    

			// If you get a message from a new contact, the name will be ""
			// So, you need to add it as a contact and synchronize with backend
			var addr = m.peer;
			if(addr){
			    var c = $scope.getContact(addr);
			    if(!c){ //Contact doesn't exist
			    	MesiboLog("Contact does not exist. Syncing..")
			    	c = $scope.createContact({"address": m.peer});
					$scope.syncContact(c);
			    }

			}

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

			if($scope.selected_user
				&& $scope.selected_user.address == m.peer){
				$scope.scrollToLastMsg();
			}

			return 0;
		};

		function getCurrentDate(){
                        var d = {};
                        const date = new Date();
                        var h = date.getHours() + "";
                        var m = date.getMinutes() + "";
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


        $scope.hideAnswerModal = function(){
                $('#answerModal').modal("hide");
                $scope.is_answer_call = false;
                $scope.refresh();
        }

        $scope.hangupCall = function(){
                $scope.mesibo.hangup(0);
                $scope.hideAnswerModal();
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
				if(!file){
					MesiboLog("Invalid file");
					return -1;
				}

				if(file.size > MAX_FILE_SIZE_SUPPORTED){
					MesiboLog("Uploaded file larger than supported(10 MB)");
					alert("Please select a file smaller than 10Mb");
					return;
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
				if(isValidFileType(f.name, 'image')){
					$('#image-preview').attr('src', e.target.result);
					$('#image-preview').show();
				}
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
			document.getElementById("recorderModalLabel").innerHTML = "Audio Recorder";
			$scope.recorder = new MesiboRecorder($scope, "audio");
			$scope.recorder.initAudioRecording();
		}

		$scope.openPictureRecorder = function(){
			$('#recorderModal').modal("show");
			document.getElementById("recorderModalLabel").innerHTML = "Video Recorder";
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
			$('#image-preview').hide();
			$('#video-preview').hide();
			//Clear selected file button attr
		}

		$scope.sendFile = function(){
			$scope.file.uploadSendFile();
		}

		$scope.isFileMsg = function(m){
			return isValid(m.filetype);
		}

		$scope.isFailedMessage = function(m){		    
		    if(!m)
		        return false;

		    if(!(m['status'] & MESIBO_MSGSTATUS_FAIL))
                return false;

            return true;
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
			if(MESIBO_STATUS_SIGNOUT == status || MESIBO_STATUS_AUTHFAIL == status ){
				$scope.logout();
			}

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


        $scope.updateReadPrevious = function(index){
                MesiboLog("updateReadPrevious");
                for (var i = index; i >= 0; i--) {
                        if($scope.mesibo_user_messages[i].status == MESIBO_MSGSTATUS_DELIVERED)
                                $scope.mesibo_user_messages[i].status = MESIBO_MSGSTATUS_READ;
                        else
                                return;
                }
        }

        $scope.Mesibo_OnMessageStatus = function(m){
            MesiboLog("$scope.Mesibo_OnMessageStatus", m);

            //In case of shared popup, need to manually update message across all tabs
            for (var i = $scope.mesibo_user_messages.length - 1; i >= 0 && $scope.is_shared; i--) {
                    if($scope.mesibo_user_messages[i].id == m.id){
                            $scope.mesibo_user_messages[i].status = m.status;

                            if(m.status == MESIBO_MSGSTATUS_READ && i
                                    && $scope.mesibo_user_messages[i-1].status
                                     == MESIBO_MSGSTATUS_DELIVERED){ //Make all previous delivered msgs to read
                                    $scope.updateReadPrevious(i - 1);
                            }

                            break;
                    }
            }
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

		$scope.getLocalContacts = function(){
			var contacts = [];
			if(MESIBO_LOCAL_CONTACTS && MESIBO_LOCAL_CONTACTS.length){
				return MESIBO_LOCAL_CONTACTS;
			}

			if(!($scope.mesibo && $scope.mesibo.getUid))
				return;

			contacts = localStorage.getItem("MESIBO_CONTACTS_" + $scope.mesibo.getUid());
			if(contacts)
				contacts = JSON.parse(contacts);
			//Check in storage first

			//Then check in config
			if(!(contacts && contacts.length)){
				if(MESIBO_LOCAL_CONTACTS)
					contacts = MESIBO_LOCAL_CONTACTS;
			}

			return contacts;	
		}

		$scope.setSelfProfile = function(u){
			if(!u)
				return;

			var c = {};
			c.address = u.phone;
			c.picture = u.photo;
			c.name = u.name;
			c.ts = parseInt(u.ts);
			c.status = u.status;

			$scope.self_user = c;

			$scope.refresh();
		}

		$scope.initContacts = function(){
			var contacts = $scope.getLocalContacts();

			if(!(contacts && contacts.length))
				return;

			for (var i = 0; i < contacts.length; i++) {
				var c = contacts[i];
				if(c.address && !c.groupid){
					c = $scope.createContact(c);
					if(isContactSync)
						$scope.available_phones.push(c.address);
				}

				if(c.groupid && !c.address)
					c = $scope.createGroup(c);

				contacts[i] = c;
				if($scope.mesibo && $scope.mesibo.setContact){
					// MesiboLog("setContact", c);
					try {
						$scope.mesibo.setContact(c);
					}
					catch(e){
						ErrorLog(e);
					}
				}
			}

			$scope.available_users = contacts;

			return contacts;
		}

		$scope.init_messenger = function(){
			MesiboLog("init_messenger called"); 
			$scope.sessionReadSummary();     
			$scope.app = new MesiboApp($scope);
			$scope.call = new MesiboCall($scope);
			$scope.file = new MesiboFile($scope);

			$scope.initContacts();

			if(isContactSync){				
				if(!$scope.available_phones)
					$scope.available_phones = [];

				$scope.app.fetchContacts(MESIBO_ACCESS_TOKEN, 0, $scope.available_phones);
			}
		}

		$scope.init_popup = function(){ 
			MesiboLog("init_popup called"); 
			$scope.selected_user = {};
			$scope.selected_user.name = POPUP_DISPLAY_NAME; 
			$scope.selected_user.picture = POPUP_DISPLAY_PICTURE; 
			$scope.selected_user.address = POPUP_DESTINATION_USER; 
			$scope.selected_user.groupid = 0; 
			$scope.selected_user.activity = ""; 

			$scope.call = new MesiboCall($scope);
			$scope.file = new MesiboFile($scope);

			$scope.MAX_MEDIA_WIDTH = '180px';
			$scope.MAX_MEDIA_HEIGHT = '80px';

			$scope.MIN_MEDIA_WIDTH = '50px';
			$scope.MIN_MEDIA_HEIGHT = '50px';

			MesiboLog("sessionReadMessages", $scope.selected_user, MAX_MESSAGES_READ);
			$scope.sessionReadMessages($scope.selected_user, MAX_MESSAGES_READ); 
		} 

		
		$scope.initMesibo = function(demo_app_name){
			$scope.mesibo = new Mesibo();
			if(demo_app_name == "multitab-popup"){
				// Instead of directly accessing Mesibo APIs like so,
                		// $scope.mesibo = new Mesibo();
                		// use a wrapper API that uses a shared worker 
				$scope.mesibo = new MesiboWorker($scope);
			}

			$scope.mesiboNotify = $scope;

			//Initialize Mesibo
			if(!(MESIBO_APP_ID && MESIBO_ACCESS_TOKEN)){
				alert("Invalid token or app-id. Check config.js");
				return;
			}

			$scope.mesibo.setAppName(MESIBO_APP_ID);
			$scope.mesibo.setCredentials(MESIBO_ACCESS_TOKEN);
			$scope.mesibo.setListener($scope.mesiboNotify);
			$scope.mesibo.setDatabase("mesibodb", function(init){
				MesiboLog("setDatabase", init);

				if(!init){
					ErrorLog("setDatabase failed");
					return;
				}
						
				//Database initialized successfully

				//Initialize Application
				if(demo_app_name == "messenger"){
					MesiboLog("Init messenger");
					$scope.init_messenger();
				}

				if(demo_app_name == "popup"){
					//Contact synchronization is not required for popup
					isContactSync = false;
					$scope.is_shared = false;
					$scope.init_popup();
				}							
			
			});

			$scope.mesibo.start();   
			
			if(demo_app_name == "multitab-popup"){
				//Contact synchronization is not required for shared-popup
				isContactSync = false;
				$scope.is_shared = true;
				$scope.init_popup();
			}
        

		}

	}]);


