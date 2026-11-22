//controller.js

/** Copyright (c) 2026 Mesibo
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
 * https://docs.mesibo.com/tutorials/open-source-whatsapp-clone/
 *
 * Source Code Repository
 * https://github.com/mesibo/messenger-javascript
 *
 *
 */



//The number of messages loaded into the message area in one read call
const MAX_MESSAGES_READ = 100;

//The number of users to be loaded (summary)
const MAX_MESSAGES_READ_SUMMARY = 100;

const MAX_FILE_SIZE_SUPPORTED = 10000000;




var mesiboWeb = angular.module('MesiboWeb', ['ngSanitize']);
mesiboWeb.filter('unsafe', ['$sce', function ($sce) {
    return function (input) {
        return $sce.trustAsHtml(input);
    }
}]);

mesiboWeb.directive('imageonload', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      // a picture that loads makes the chat taller: stay at the bottom while the user is there
      element.bind('load', function() {
        if(scope.stick_to_bottom)
          scrollToEnd(false);
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
      // a video that loads makes the chat taller: stay at the bottom while the user is there
      element.bind('loadeddata', function() {
        if(scope.stick_to_bottom)
          scrollToEnd(false);
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

mesiboWeb.directive("getTarget", function() {
    return {
        link: function(scope, element, attrs) {
            console.log(element);
        }
    }
});

mesiboWeb.controller('AppController', ['$scope', '$window', '$anchorScroll', function ($scope, $window, $anchorScroll) {

	console.log("AppController loaded");
	var token = getLoginToken();
	if(!token || token.length < 16) {
		window.location.replace("index.html");
		return;
	}

	$scope.isConnected = false;
	$scope.isLoggedIn = false;
	$scope.connection_status = '';
	$scope.summarySession = null;
	$scope.msg_read_limit_reached = false;
	$scope.users_synced = false;
	$scope.scroll_messages = null;
	$scope.new_contact_name = '';
	$scope.new_contact_phone = '';

	$scope.messages = [];
	$scope.summary = [];

	$scope.selected_user = null;
	$scope.selected_user_count = 0; 

	$scope.forward_message = null;

	$scope.mesibo = null; 

	//Main UI
	$scope.display_profile = null;
	$scope.display_image = null;
	$scope.membersList = [];
	$scope.users_panel_show = false;
	$scope.message_area_show = false;

	//Input Area
	$scope.input_message_text = "";
	$scope.link_preview = null;
	$scope.self_profile_name = "";
	$scope.self_profile_status = "";

	// Search
	$scope.search_query = '';

	// Image viewer overlay
	$scope.img_viewer_url  = '';
	$scope.img_viewer_name = '';

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

	$scope.MAX_MEDIA_WIDTH = '480px';
	$scope.MAX_MEDIA_HEIGHT = '320px';

	$scope.MIN_MEDIA_WIDTH = '160px';
	$scope.MIN_MEDIA_HEIGHT = '120px';

	$scope.refresh = function(){
		$scope.$applyAsync();
	}

	/*
	 * Scrolling of the chat: it stays at the bottom while the user is there (new messages, pictures
	 * that load), and keeps its place when older messages are added above.
	 */
	$scope.stick_to_bottom = true;   // the user is at the bottom of the chat
	$scope.older_from_bottom = -1;   // loading older messages: the distance from the bottom to keep

	$scope.scrollToLastMsg = function() {
		$scope.$$postDigest(function () {
			if($scope.stick_to_bottom)
				scrollToEnd(false);
		});
	}

	$scope.updateMessagesScroll = function(){

	}

	$scope.$on('onMessagesRendered', function(e) {
		var el = document.getElementById('messages');

		// older messages added above: the same messages stay in view
		if(el && $scope.older_from_bottom >= 0) {
			el.scrollTop = el.scrollHeight - $scope.older_from_bottom;
			$scope.older_from_bottom = -1;
			return;
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

		var el = e.target;
		$scope.scroll_messages = el;

		// at the bottom (within a few pixels): new messages and pictures keep it there
		$scope.stick_to_bottom = (el.scrollTop + el.clientHeight >= el.scrollHeight - 40);

		if(el.scrollTop == 0){
			if(!$scope.messageSession){
				return;
			}

			var m = $scope.messages.length;
			if(m == 0){
				return;
			}

			// older messages: added above, the same messages stay in view (onMessagesRendered)
			$scope.older_from_bottom = el.scrollHeight - el.scrollTop;
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
		if(!$scope.hasContacts())
			$scope.showContactForm();

		$scope.refresh();   
	}

	$scope.hideAvailableUsers = function() {
		MesiboLog('hideAvailableUsers');
		$scope.users_panel_show = false;
		$scope.refresh();
	}

	$scope.getContacts = function(){
		var c = $scope.mesibo.getSortedProfiles();
		return c;
	}
	
	$scope.hasContacts = function(){
		var c = $scope.getContacts();
		if(c && c.length) return true;
		return false;
	}

	// [OPTIONAL] refer to the comment below
	$scope.Mesibo_onGroupMembers = function(p, members) {
		$scope.membersList = members;
		$scope.refresh();
	}

	$scope.showProfile = function(p) {
		if(!p)
			return;
		// the user's own profile: its name and about, to edit
		if(p.isSelfProfile()) {
			$scope.self_edit.name = p.getName() || '';
			$scope.self_edit.status = $scope.getUserStatus(p);
		}
		$scope.display_profile = p;
		$scope.display_image = $scope.display_profile.getImage();
		$scope.loadProfilePhotos(p);

		$scope.membersList = [];
		if(p.getGroupId() > 0) {
			// you can either pass a function or listenr, this code list 
			// both teh syntax for reference
			if(true) {
				p.getMembers(0, false, $scope);
			} else {
				p.getMembers(0, false, function(p, members) {
					$scope.membersList = members;
					$scope.refresh();
				});
			}
		}
		$scope.refresh();
	};
	
	/*
	 * Profile photos: up to MAX_PROFILE_PHOTOS at consecutive indexes; index 0 is the main photo.
	 *
	 * The user's own photos are edited as on Android and iOS: Add, Change, Make main photo and
	 * Remove change a list here, and nothing is saved until Save. Save then writes each index
	 * whose photo changed (setImage) and clears the indexes no longer used.
	 */

	$scope.MAX_PROFILE_PHOTOS = 8;

	// the photos of display_profile, in order: {index: saved index or -1, image, file, local}
	$scope.profile_photos = [];
	$scope.profile_photos_saved = 0;     // how many photos the profile has saved
	$scope.profile_photos_changed = false;
	$scope.profile_photos_saving = false;
	$scope.profile_photo_at = 0;         // the photo shown (another user's or a group's profile)

	/*
	 * The photos of a profile (MesiboProfileImage), in order: the main one (getImage(0)), then each
	 * next one (getNext). The one place that lists them: the profile screen, the popup and the
	 * viewer all use it.
	 */
	$scope.getProfileImages = function(p) {
		var images = [];
		if(!p) return images;

		var image = p.getImage(0);
		if(image && !image.getImage())
			image = null;

		while(image && images.length < $scope.MAX_PROFILE_PHOTOS) {
			// only photos with a url: nothing to show otherwise
			if(image.getImage())
				images.push(image);
			image = image.getNext();
		}

		return images;
	}

	// the main photo of a profile by its url, '' if none (getImage(0): every row of the chat list uses it)
	$scope.getProfileMainPhoto = function(p) {
		if(!p) return '';
		var image = p.getImage(0);
		return (image && image.getImageOrThumbnail()) || '';
	}

	// all the photos of a profile in the full-screen viewer, starting at the one at 'at'
	$scope.viewProfilePhotos = function(p, at) {
		var urls = $scope.getProfileImages(p).map(function(image) { return image.getImageOrThumbnail(); });
		$scope.openImgViewerList(urls, at || 0, $scope.getUserName(p));
	}

	// the photos of display_profile: as saved, then changed here when it is the user's own
	$scope.loadProfilePhotos = function(p) {
		var list = $scope.getProfileImages(p).map(function(image, i) {
			return {index: i, image: image, file: null, local: null};
		});

		$scope.profile_photos = list;
		$scope.profile_photos_saved = list.length;
		$scope.profile_photos_changed = false;
		if($scope.profile_photo_at >= list.length)
			$scope.profile_photo_at = 0;
	}

	// a photo to show (the top photo of the profile): its image url (the web reads photos by url)
	$scope.getProfilePhotoSrc = function(at) {
		var p = $scope.display_profile;
		var ph = $scope.profile_photos[at];
		if(!p || !ph)
			return '';

		if(ph.local)
			return ph.local;

		return (ph.image && ph.image.getImage()) || '';
	}

	// a photo in the strip of the user's own profile: its image url
	$scope.getProfileThumbSrc = function(ph) {
		if(!ph) return '';
		if(ph.local) return ph.local;
		return (ph.image && ph.image.getImage()) || '';
	}

	// another user's or a group's photos: the previous or next one
	$scope.showProfilePhoto = function(step) {
		var n = $scope.profile_photos.length;
		if(n < 2) return;
		$scope.profile_photo_at = ($scope.profile_photo_at + step + n) % n;
	}

	$scope.openProfilePhoto = function() {
		$scope.openProfilePhotoAt($scope.profile_photo_at);
	}

	/*
	 * The photos in the viewer, starting at this one: as saved (viewProfilePhotos), or, while the
	 * user's own photos are changed and not saved yet, as they are here.
	 */
	$scope.openProfilePhotoAt = function(at) {
		var p = $scope.display_profile;
		if(!$scope.profile_photos_changed) {
			$scope.viewProfilePhotos(p, at);
			return;
		}

		var urls = $scope.profile_photos.map(function(ph) { return $scope.getProfileThumbSrc(ph); });
		$scope.openImgViewerList(urls, at, $scope.getUserName(p));
	}

	// the user's own profile: a photo for a place in the list (-1: a new one, added at the end)
	$scope.photo_pick_at = -1;

	$scope.pickProfilePhoto = function(at) {
		if(at < 0 && $scope.profile_photos.length >= $scope.MAX_PROFILE_PHOTOS)
			return;

		$scope.photo_pick_at = at;
		setTimeout(function () {
			angular.element('#profile-photo-input').trigger('click');
		}, 0);
	}

	$scope.onProfilePhotoSelect = function(element) {
		$scope.$apply(function() {
			var file = element.files[0];
			element.value = '';
			if(!file) return;

			if(file.size > MAX_FILE_SIZE_SUPPORTED) {
				alert("Please select a file smaller than 10Mb");
				return;
			}

			// cropped to a square first, as on Android and iOS
			$scope.startPhotoCrop(file, $scope.photo_pick_at);
		});
	}

	/* --- Profile photo crop: square, with Cancel and Done --- */

	$scope.photo_cropper = null;
	$scope.photo_crop_at = -1;
	$scope.photo_crop_name = '';

	$scope.startPhotoCrop = function(file, at) {
		$scope.photo_crop_at = at;
		$scope.photo_crop_name = file.name || 'photo.jpg';

		// the editor starts once the dialog is shown and the photo has loaded (it sizes from its box)
		var waiting = 2;
		var ready = function() {
			if(--waiting > 0)
				return;
			requestAnimationFrame(function() {
				if($scope.photo_cropper)
					$scope.photo_cropper.destroy();
				if('undefined' === typeof Cropper)
					return;
				$scope.photo_cropper = new Cropper(document.getElementById('photo-crop-img'), {
					aspectRatio: 1,
					viewMode: 1,
					autoCropArea: 1,
					background: false
				});
			});
		};

		$('#photoCropModal').off('shown.bs.modal.crop').one('shown.bs.modal.crop', ready);

		var img = document.getElementById('photo-crop-img');
		img.onload = function() {
			img.onload = null;
			ready();
		};
		img.src = URL.createObjectURL(file);

		$('#photoCropModal').modal('show');
	}

	$scope.photoCropRotate = function(degrees) {
		if($scope.photo_cropper)
			$scope.photo_cropper.rotate(degrees);
	}

	$scope.closePhotoCrop = function() {
		if($scope.photo_cropper)
			$scope.photo_cropper.destroy();
		$scope.photo_cropper = null;
		$('#photoCropModal').modal('hide');
	}

	$scope.cancelPhotoCrop = function() {
		$scope.closePhotoCrop();
	}

	// the square as a 1024 x 1024 JPEG, in the list: replacing a photo, or added at the end
	$scope.donePhotoCrop = function() {
		if(!$scope.photo_cropper) {
			$scope.closePhotoCrop();
			return;
		}

		var canvas = $scope.photo_cropper.getCroppedCanvas({width: 1024, height: 1024, imageSmoothingQuality: 'high'});
		var at = $scope.photo_crop_at;
		var name = $scope.photo_crop_name.replace(/\.[^.]*$/, '') + '.jpg';
		$scope.closePhotoCrop();
		if(!canvas)
			return;

		canvas.toBlob(function(blob) {
			if(!blob)
				return;

			var file = new File([blob], name, {type: 'image/jpeg'});
			var ph = {index: -1, image: null, file: file, local: URL.createObjectURL(file)};
			if(at >= 0 && at < $scope.profile_photos.length)
				$scope.profile_photos[at] = ph;
			else if($scope.profile_photos.length < $scope.MAX_PROFILE_PHOTOS)
				$scope.profile_photos.push(ph);

			$scope.profile_photos_changed = true;
			$scope.refresh();
		}, 'image/jpeg', 0.9);
	}

	// moved to the front of the list: the main photo once saved
	$scope.makeMainProfilePhoto = function(at) {
		if(at <= 0 || at >= $scope.profile_photos.length) return;
		var ph = $scope.profile_photos.splice(at, 1)[0];
		$scope.profile_photos.unshift(ph);
		$scope.profile_photos_changed = true;
	}

	$scope.removeProfilePhoto = function(at) {
		if(at < 0 || at >= $scope.profile_photos.length) return;
		$scope.profile_photos.splice(at, 1);
		$scope.profile_photos_changed = true;
	}

	// the photos as they are saved now
	$scope.cancelProfilePhotos = function() {
		$scope.loadProfilePhotos($scope.mesibo.getSelfProfile());
	}

	// a saved photo as a file, to write it at another index; cb(file), null if it can't be read
	$scope.readProfilePhoto = function(ph, cb) {
		if(ph.file) {
			cb(ph.file);
			return;
		}

		var url = ph.image ? ph.image.getImage() : null;
		if(!url) {
			cb(null);
			return;
		}

		fetch(url).then(function(r) {
			if(!r.ok) throw new Error('not read');
			return r.blob();
		}).then(function(blob) {
			cb(new File([blob], 'photo.jpg', {type: blob.type || 'image/jpeg'}));
		}).catch(function() {
			cb(null);
		});
	}

	/*
	 * Writes the list, as Android and iOS: each index whose photo changed gets it (setImage), a
	 * photo still at its saved index is left as is, and the indexes no longer used are cleared.
	 * The photos that move are read first, before any index is written.
	 */
	$scope.saveProfilePhotos = function() {
		if(!$scope.profile_photos_changed || $scope.profile_photos_saving)
			return;

		var p = $scope.mesibo.getSelfProfile();
		var list = $scope.profile_photos.slice();
		var saved = $scope.profile_photos_saved;
		var writes = [];
		var pending = list.length + 1;
		var failed = false;

		$scope.profile_photos_saving = true;

		var done = function() {
			if(--pending > 0)
				return;

			$scope.profile_photos_saving = false;
			if(failed) {
				alert("A photo could not be read. Nothing was saved.");
				$scope.refresh();
				return;
			}

			for(var i = 0; i < writes.length; i++) {
				if(!writes[i])
					continue;

				p.setImage(writes[i], i);

				/*
				 * Its url is cleared until it is uploaded: the strip shows the photo from here
				 * until the profile is published (MesiboProfile_onPublish)
				 */
				list[i].file = writes[i];
				list[i].local = URL.createObjectURL(writes[i]);
				list[i].index = i;
			}

			// the indexes no longer used
			for(var i = list.length; i < saved; i++)
				p.setImageUrl(null, i);

			// saving until published: the strip is read from the profile again then
			$scope.profile_photos_saving = true;
			p.save();
			$scope.profile_photos_changed = false;
			$scope.profile_photos_saved = list.length;
			$scope.refresh();
		};

		list.forEach(function(ph, i) {
			// still at its saved index: nothing to write
			if(ph.index == i && !ph.file) {
				writes[i] = null;
				done();
				return;
			}

			$scope.readProfilePhoto(ph, function(file) {
				if(!file) failed = true;
				writes[i] = file;
				done();
			});
		});

		done();
	}

	// another user's profile: a call, from the chat with them
	$scope.profileCall = function(video) {
		var p = $scope.display_profile;
		$scope.hideProfileSettings();
		$scope.generateMessageArea(p);
		if(video)
			$scope.makeVideoCall();
		else
			$scope.makeVoiceCall();
	}

	$scope.deleteProfileMessages = async function(p) {
		if(!p) return;
		if(!window.confirm('Delete all messages with ' + $scope.getUserName(p) + '? This cannot be undone.')) return;

		await p.deleteMessages();
		if($scope.selected_user == p) {
			$scope.selected_user = null;
			$scope.messages.length = 0;
			$scope.message_area_show = false;
		}
		$scope.hideProfileSettings();
		$scope.updateSummary();
	}

	$scope.editProfile = function() {
		$scope.showProfile($scope.getSelfProfile());
	}
	
	$scope.showProfileFromMessage = function(m) {
		var p = $scope.getProfileFromMessage(m);
		if(!p)
			return;
		$scope.showProfile(p); 

		$scope.refresh();
	};

	$scope.hideProfileSettings = function() {
		$scope.display_profile = null; 
		$scope.membersList = [];
		$scope.refresh();
	};

	$scope.hideForwardList = function() {
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

	$scope.showDeliveryTime = function(m) {
		if(!m || !m.isMessage() || !m.mid || !m.isOutgoing()) return false;
		if(!m.isDelivered() && !m.isReadByPeer()) return false;
		var o = document.getElementById('deltime-' + m.mid);
		if(!o) return false;
		m.getDeliveryTimestamp(null, function(d) {
			if(!d) o.style.display = 'none';
			else o.innerHTML = "Delivered on: " + d.getDate(true) + " " + d.getTime(true);
		});
		return true;
	}
	
	$scope.showReadTime = function(m) {
		if(!m || !m.isMessage() || !m.mid || !m.isOutgoing()) return false;
		if(!m.isReadByPeer()) return false;
		var o = document.getElementById('readtime-' + m.mid);
		if(!o) return false;
		m.getReadTimestamp(null, function(d) {
			if(!d) o.style.display = 'none';
			else o.innerHTML = "Read on: " + d.getDate(true) + " " + d.getTime(true);
		});
		return true;
	}

	$scope.showMessageHeader = function(m) {
		return (m.isForwarded() || m.isReply() || m.isModified());
	}
	
	$scope.getMessageHeader = function(m) {
		if(m.isForwarded()) return "Forwarded";
		if(m.isReply()) return "Reply";
		if(m.isModified()) return "Edited";
		return "";
	}

	$scope.isSent = function(msg){
		return isSentMessage(msg.status);
	}

	$scope.isReceived = function(msg){
		return !isSentMessage(msg.status);
	}

	$scope.isMessageVisible = function(m) {
		return true;
		if(m.message || m.isDeleted() || $scope.isFileMsg(m)) return true;
		return false;
	}
	
	$scope.getMessageText = function(m) {
		if(m.isDeleted()) return "This message was deleted";
		if(m.isDate()) 
			return m.getTimestamp().getDate(true, "Today", "Yesterday");

		if(!m.isCall()) 
			return m.message;

		var type = m.isVideoCall()?"Video":"Audio";
		var dir = "Missed";
		if(m.isIncomingCall()) dir = "Incoming";
		else if(m.isOutgoingCall()) dir = "Outgoing";
		return dir + " " + type + " call at " + m.getTimestamp().getTime();
	}
	
	$scope.getFormattedMessageText = function(m) {
		var text = $scope.getMessageText(m);
		if(!text) return "";
		function escapeHtml(s) {
			return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
		}
		var t = text.split(/(https?:\/\/\S*)\b/);
		if(!t) return escapeHtml(text).replace(/\n/g, '<br>');
		text = '';
		for(var i=0; i < t.length; i++) {
			if(t[i].startsWith('https://') || t[i].startsWith('http://')) {
				text += '<span style="color: #0a8bc5;">' + escapeHtml(t[i]) + '</span>';
			} else {
				text += escapeHtml(t[i]).replace(/\n/g, '<br>');
			}
		}
		return text;

	}
	
	$scope.getLastSeen = function(p) {
		if(!p) return -1;
		return p.getLastSeen();
	}
	
	$scope.isBlocked = function(p) {
		if(!p) return false;
		this.getLastSeen(p);
		return p.isBlocked();
	}
	
	$scope.BlockUser = function(p) {
		var isBlocked = p.isBlocked();
		p.setContact(true);
		p.subscribe(true);
		p.block(!isBlocked);
		p.save();
		return true;
	}

	$scope.blockUserWithConfirm = function(p) {
		if (!p) return;
		var name = $scope.getUserName(p);
		var blocked = p.isBlocked();
		var msg = blocked
			? 'Unblock ' + name + '?'
			: 'Block ' + name + '? You will no longer receive messages from them.';
		if (!window.confirm(msg)) return;
		$scope.BlockUser(p);
		$scope.refresh();
	}

	$scope.deleteMessagesWithConfirm = function() {
		if (!$scope.selected_user) return;
		var name = $scope.getUserName($scope.selected_user);
		if (!window.confirm('Delete all messages with ' + name + '? This cannot be undone.')) return;
		$scope.deleteMessages();
	}
	
	$scope.generateMessageArea = function(contact){
		MesiboLog(contact);

		if($scope.selected_user && $scope.selected_user == contact){
			return 0;
		}

		if($scope.selected_user)
			$scope.selected_user.sendLeft();

		$scope.selected_user = contact;
		$scope.selected_user.sendJoined();

		// a new chat opens at its newest message
		$scope.stick_to_bottom = true;
		$scope.older_from_bottom = -1;

		// a new chat: sensitive messages are covered again, the message options are cleared
		$scope.revealed = {};
		$scope.clearMessageOptions();
		$scope.msgopts_show = false;

		// its messages are read now: the unread count, once the database has them read
		var opened = contact;
		setTimeout(function() {
			$scope.updateUnreadCount(opened);
		}, 1000);

		// Stop read session for previous user 
		if($scope.messageSession)
			$scope.messageSession.stop();

		$scope.messageSession = null;
		$scope.scroll_messages = null;
		$scope.sessionReadMessages($scope.selected_user, MAX_MESSAGES_READ);			
		$scope.message_area_show = true;
		$scope.refresh();
		$scope.scrollToLastMsg();
	}

	$scope.onMemberClick = function(p) {
		$scope.hideProfileSettings(); 
		if(p.isSelfProfile()) return;
		$scope.generateMessageArea(p);
		$scope.refresh();
	}

	$scope.setSelectedUser = function(user){
		$scope.selected_user = user;
		$scope.refresh();
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

	$scope.addContact = function(){
		//cAddress = document.getElementById('contact-address').value;
		//cGroupid = document.getElementById('contact-group-id').value;
		if($scope.new_contact_phone.length < 8){
			alert("Enter valid phone number / address or a valid group id");	
			return;
		}

		if($scope.new_contact_phone[0] == "+")
			$scope.new_contact_phone = $scope.new_contact_phone.slice(1);

		var c = $scope.mesibo.getProfile($scope.new_contact_phone, 0);

		$scope.hideContactForm();
		$scope.new_contact_name = '';
		$scope.new_contact_phone = '';

		//TBD: After adding new contact, select that
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
	
	$scope.getProfileFromMessage = function(m) {
		if(!m) return null;
		var p = m.groupProfile;
		if(!p) p = m.profile;
		return p;
	}
	
	$scope.getUserProfileFromMessage = function(m) {
		if(!m) return null;
		return m.profile;
	}
	
	$scope.hasPicture = function(m) {
		var p = $scope.getProfileFromMessage(m);
		if(!p) return false;
		var pic = $scope.getProfileMainPhoto(p);
		if(pic) return true;
		return false;
	}

	$scope.getFirstLetter = function(m) {
		var p = $scope.getProfileFromMessage(m);
		if(!p) return '*';
		var name = p.getNameOrAddress('');
		if(!name) return '*';
		for(var i=0; i < name.length; i++) {
			var c = name[i];
			if(c >= 'a' && c <= 'z') return c;
			if(c >= 'A' && c <= 'Z') return c;
			if(c >= '0' && c <= '9') return c;
		}
		return name[0];
	}

	$scope.hashCode = function(str) {
		if(!str || !str.length) return 0;
		var hash = 0;
		for (var i = 0; i < str.length; i++) {
			var chr = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0; 
		}
		return hash;
	}
	
	$scope.getTextColorForProfile = function(p) {
		var colors = ["#e6d200", "#f58559", "#f9a43e", "#e4c62e",
			"#67bf74", "#59a2be", "#2093cd", "#ad62a7"];
		if(!p) return colors[0];
		var name = p.getNameOrAddress();
		var l = name.length;
		if(!l) return colors[0];
		var c = $scope.hashCode(name)&7;
		return colors[c];
	}

	$scope.getLetterColor = function(m) {
		var p = $scope.getProfileFromMessage(m);
		return $scope.getTextColorForProfile(p);
	}
	
	$scope.getNameColor = function(m) {
		var p = $scope.getUserProfileFromMessage(m);
		return $scope.getTextColorForProfile(p);
	}

	$scope.getPictureFromMessage = function(m) {
		var p = $scope.getProfileFromMessage(m);
		return $scope.getUserPicture(p);
	}

	$scope.getNameFromMessage = function(m) {
		var p = $scope.getProfileFromMessage(m);
		return $scope.getUserName(p);
	}

	$scope.getSenderNameFromMessage = function(m) {
		if(null == m || null == m.profile) {
			return ''; // data object
		}
		return m.profile.getNameOrAddress();
	}

	$scope.getUserPicture = function(user){
		if(!user) return '';
		// MesiboLog(user);
		var pic = $scope.getProfileMainPhoto(user);
		if(pic) return pic;

		return user.getGroupId() ? MESIBO_DEFAULT_GROUP_IMAGE:MESIBO_DEFAULT_PROFILE_IMAGE; 
	} 

	$scope.getProfileImage = function(user){
		if(!user) return '';
		// MesiboLog(user);
		var pic = $scope.display_image.getImage();
		if(pic) return pic;

		return user.getGroupId() ? MESIBO_DEFAULT_GROUP_IMAGE:MESIBO_DEFAULT_PROFILE_IMAGE; 
	} 

	$scope.changeProfilePicture = function() {
		var i = $scope.display_image.getNext();
		if(i)
			$scope.display_image = i;
		else
			$scope.display_image = $scope.display_profile.getImage(); // restart
	}

	/*
	 * The full-screen viewer: one picture, or a list of them (urls) with previous and next, also
	 * with the arrow keys; at: the one shown first.
	 */
	$scope.img_viewer_list = [];
	$scope.img_viewer_at = 0;

	$scope.openImgViewer = function(url, name) {
		if(!url) return;
		$scope.openImgViewerList([url], 0, name);
	}

	$scope.openImgViewerList = function(urls, at, name) {
		var list = (urls || []).filter(function(u) { return !!u; });
		if(!list.length) return;
		if(at < 0 || at >= list.length) at = 0;

		$scope.img_viewer_list = list;
		$scope.img_viewer_at = at;
		$scope.img_viewer_url  = list[at];
		$scope.img_viewer_name = name || '';
	}

	$scope.showImgViewer = function(step) {
		var n = $scope.img_viewer_list.length;
		if(n < 2) return;
		$scope.img_viewer_at = ($scope.img_viewer_at + step + n) % n;
		$scope.img_viewer_url = $scope.img_viewer_list[$scope.img_viewer_at];
	}

	// the arrow keys go through the pictures, Escape closes the viewer
	document.addEventListener('keydown', function(e) {
		if(!$scope.img_viewer_url) return;

		if('ArrowLeft' == e.key) $scope.showImgViewer(-1);
		else if('ArrowRight' == e.key) $scope.showImgViewer(1);
		else if('Escape' == e.key) $scope.closeImgViewer();
		else return;

		e.preventDefault();
		$scope.refresh();
	});

	/* --- Profile popup: a tap on a picture in the chat list, as on Android and iOS --- */

	$scope.popup_profile = null;

	$scope.showProfilePopup = function(p) {
		if(!p) return;
		$scope.popup_profile = p;
		$scope.refresh();
	}

	$scope.hideProfilePopup = function() {
		$scope.popup_profile = null;
		$scope.refresh();
	}

	// the profile's main photo, or none (the popup then shows the letter)
	$scope.getPopupPicture = function() {
		return $scope.getProfileMainPhoto($scope.popup_profile);
	}

	$scope.getProfileLetter = function(p) {
		if(!p) return '';
		var name = p.getNameOrAddress('') || '';
		return name.length ? name[0].toUpperCase() : '*';
	}

	// a tap on the picture: all the profile's photos, full screen
	$scope.openPopupPicture = function() {
		var p = $scope.popup_profile;
		if(!$scope.getPopupPicture()) return;
		$scope.hideProfilePopup();
		$scope.viewProfilePhotos(p, 0);
	}

	$scope.popupMessage = function() {
		var p = $scope.popup_profile;
		$scope.hideProfilePopup();
		$scope.generateMessageArea(p);
	}

	// calls go to the open chat: the chat is opened first
	$scope.popupCall = function(video) {
		var p = $scope.popup_profile;
		$scope.hideProfilePopup();
		$scope.generateMessageArea(p);
		if(video)
			$scope.makeVideoCall();
		else
			$scope.makeVoiceCall();
	}

	$scope.popupInfo = function() {
		var p = $scope.popup_profile;
		$scope.hideProfilePopup();
		$scope.showProfile(p);
	}

	$scope.closeImgViewer = function() {
		$scope.img_viewer_url  = '';
		$scope.img_viewer_name = '';
		$scope.img_viewer_list = [];
		$scope.img_viewer_at = 0;
	}

	$scope.getUserName = function(user){
		if(!user) return "";
		return user.getNameOrAddress();
	}

	$scope.getLastSeen = function(user){
		if(!user) return "";
		var lastseen = user.getLastSeen();
		if(user.isOnline())
			return "Online";
		if(!lastseen) return ""

		return "Last seen: " + lastseen.getDateInNaturalLanguage(0);
	}

	$scope.getUserStatus = function(user){
		// MesiboLog("getUserName", user);
		if(!user) return "";
		return user.getString("status", "");
	}

	$scope.getMemberType = function(m){
		if(m.isOwner()) return "Group Owner";
		if(m.isAdmin()) return "Group Admin";
		return "Member";
	}

	$scope.getMemberInfo = function(p){
		return "";
	}

	$scope.getUserLastMessage = function(m){

		var profile = m.profile;

		if(!profile) {
			return "";
		}

		if(profile.isGroup() && profile.isTypingInGroup(m['groupid']))
			return "typing...";

		// a disappearing message whose time has passed
		if($scope.isDisappearing(m) && m.getRemainingAge() == 0)
			return "";

		// a sensitive message: the title instead of the content
		if($scope.isPreviewHidden(m))
			return $scope.ui.sensitivity.title;

		if(m.filetype)
			return getFileTypeDescription(m);

		return this.getMessageText(m);
	}

	$scope.getUserLastMessageTime = function(m) {
		var t = m.getTimestamp();
		if(t.getDaysElapsed()) return t.getDate(true, "Today", "Yesterday");
		return t.getTime();
	}

	/*
	 * The unread count of each chat, read from the database when the chat list or a chat changes
	 * (the database is async), and kept here for the template and the Unread filter.
	 */
	$scope.unread_counts = {};

	$scope.profileKey = function(p) {
		if(!p) return '';
		return (p.getGroupId() > 0) ? ('g' + p.getGroupId()) : ('u' + p.getAddress());
	}

	$scope.updateUnreadCount = function(p) {
		if(!p) return;

		var key = $scope.profileKey(p);
		var rs = p.createReadSession(null);

		rs.getUnreadCount(function(count) {
			$scope.unread_counts[key] = count ? count : 0;
			$scope.refresh();
		});
	}

	$scope.updateUnreadCounts = function() {
		var list = $scope.getSummary();
		for(var i = 0; i < list.length; i++)
			$scope.updateUnreadCount($scope.getProfileFromMessage(list[i]));
	}

	$scope.getUnreadCount = function(p) {
		var count = $scope.unread_counts[$scope.profileKey(p)];
		return count ? count : 0;
	}

	$scope.getUnreadCountText = function(m) {
		var count = $scope.getUnreadCount($scope.getProfileFromMessage(m));
		return count ? count : '';
	}

	/* --- Archived chats, favorites, mute and the filters of the chat list --- */

	$scope.show_archived = false;
	$scope.chat_filter = 0; // index in MessengerUiConfig.userList.filters

	$scope.isArchived = function(p) {
		return (p && !p.isSelfProfile() && p.isArchived());
	}

	$scope.isMuted = function(p) {
		return (p && !p.isSelfProfile() && p.isMuted());
	}

	$scope.isFavorite = function(p) {
		return (p && !p.isSelfProfile() && p.isFavorite());
	}

	$scope.toggleArchive = function(p) {
		if(!p) return;
		p.archive(!p.isArchived());
		p.save();
		$scope.refresh();
	}

	$scope.toggleMute = function(p) {
		if(!p) return;
		p.mute(!p.isMuted());
		p.save();
		$scope.refresh();
	}

	$scope.toggleFavorite = function(p) {
		if(!p) return;
		p.favorite(!p.isFavorite());
		p.save();
		$scope.refresh();
	}

	// the number of archived chats, for the Archived row
	$scope.getArchivedCount = function() {
		var list = $scope.getSummary();
		var count = 0;
		for(var i = 0; i < list.length; i++) {
			if($scope.isArchived($scope.getProfileFromMessage(list[i])))
				count++;
		}
		return count;
	}

	$scope.showArchived = function() {
		$scope.show_archived = true;
		$scope.refresh();
	}

	$scope.hideArchived = function() {
		$scope.show_archived = false;
		$scope.refresh();
	}

	/*
	 * A click on a chat opens it, except a click on its menu (the button or an item). The click is
	 * not stopped there: Bootstrap opens the menu from clicks that reach the document.
	 */
	$scope.onChatRowClick = function(u, $event) {
		var target = $event ? $event.target : null;
		if(target && target.closest && target.closest('.chat-row-menu'))
			return;

		$scope.generateMessageArea($scope.getProfileFromMessage(u));
	}

	$scope.selectChatFilter = function(index) {
		$scope.chat_filter = index;
		$scope.refresh();
	}

	$scope.matchesChatFilter = function(p) {
		var l = $scope.ui.userList;
		if(!l.enableFilters || !l.filters.length)
			return true;

		var f = l.filters[$scope.chat_filter];
		if(!f) return true;

		switch(f.value) {
			case CHATFILTER_UNREAD:
				return ($scope.getUnreadCount(p) > 0);
			case CHATFILTER_FAVORITES:
				return $scope.isFavorite(p);
			case CHATFILTER_GROUPS:
				return (p.getGroupId() > 0);
			case CHATFILTER_ONLINE:
				return (p.getGroupId() == 0 && p.isOnline());
		}

		return true;
	}

	// a new message in an archived chat brings it back, when unarchiveOnNewMessage is set
	$scope.unarchiveOnMessage = function(m) {
		var l = $scope.ui.userList;
		if(!l.enableArchive || !l.unarchiveOnNewMessage)
			return;

		if(!m.isIncoming() || !m.isMessage())
			return;

		var p = $scope.getProfileFromMessage(m);
		if($scope.isArchived(p)) {
			p.archive(false);
			p.save();
		}
	}

	$scope.getMessageStatusClass = function(m){
		if(!isValid(m))
			return "";

		if($scope.isReceived(m) || MESIBO_MSGSTATUS_EMPTY == m.status){
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

		var name = m.getFileName();
		if(name) return name;

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
		if(isLinkPreview){
		}
	}

	$scope.getUserActivity = function(u) {
		if(!u) return "";
		if(u.getGroupId() > 0) return ""; // This is not correct/complete as we can still show a user typing

		if(u.isTyping()) return "typing...";
		if(u.isChatting()) return "chatting with you...";
		if(u.isOnline()) return "online";
		return "";
	}

	$scope.getLastMessageColor = function(m) {
		var profile = m.profile;
		if(profile && profile.isTypingInGroup(m.groupid)) return "#008800";
		return "#000000";
	}

	$scope.getMessageStatusColor = function(m){
		// MesiboLog("getMessageStatusColor", m);
		if(!isValid(m))
			return "";

		if($scope.isReceived(m))
			return "";

		if(m.isDate())
			return "#777777";

		if(m.isCall())
			return "#CC0000";

		var status = m.status;
		var status_color = getStatusColor(status);
		if(!isValidString(status_color))
			return "";

		return status_color;
	}

	$scope.getMessageColor = function(m){
		if(m.isDate())
			return "#777777";

		if(m.isCall())
			return "#CC0000";

		return "#000000";
	}

	$scope.isOnlineFromMessage = function(m){
		return false;

		var profile = m.profile;
		if(profile) return profile.isOnline();
		return false;
	}

	$scope.deleteTokenInStorage = function(){
		localStorage.removeItem("MESIBO_MESSENGER_TOKEN");
	}

	$scope.logoutWithConfirm = function() {
		if (!window.confirm('Log out of Mesibo Messenger?')) return;
		$scope.logout(true);
	}

	$scope.logout = function(authfail){
		console.trace("logout called, authfail=" + authfail);
		$scope.mesibo.stop();
		if(hasHardCodedLoginToken()) {
			if(authfail)
				showAuthFailAlert();
			return;
		}

		if(authfail) $scope.deleteTokenInStorage();
		sessionStorage.setItem('mesibo_logged_out', '1');
		window.location.replace("index.html");
	}

	$scope.getFileIcon = function(f){
		return getFileIcon(f);
	}

	$scope.updateSummary = function() {
		if(!$scope.summarySession) return;

		var msgs = $scope.summarySession.getMessages();
		$scope.updateUnreadCounts();

		if(msgs && msgs.length > 0){
			var m = msgs[0];
			$scope.generateMessageArea($scope.getProfileFromMessage(m));
		}
				
		$scope.refresh()
	}

	$scope.summaryListener = {};
	$scope.summaryListener.Mesibo_onMessage = function(m) {
		if(m) $scope.summary.push(m);

		if(m && !m.isLastMessage()) {
			return;
		}

		if(isMessageSync && !m && !$scope.users_synced) {
			MesiboLog("Run out of users to display. Syncing..");
			$scope.summarySession.sync(this.readCount);
			return;
		}
		
		$scope.updateSummary();
	}

	$scope.summaryListener.Mesibo_onSync = function(count) {
		$scope.users_synced = true;
		if(!count) return;
		$scope.updateSummary();
	}

	$scope.sessionReadSummary = function(){
		$scope.summary.length = 0;
		$scope.summarySession = MesiboReadSession.createReadSummarySession($scope.summaryListener);
		$scope.summarySession.readCount = MAX_MESSAGES_READ_SUMMARY;
		$scope.summarySession.read(MAX_MESSAGES_READ_SUMMARY);
	}

	$scope.getSummary = function() {
		if($scope.summarySession) {
			var m =  $scope.summarySession.getMessages();
			if(m) return m;
		}
		return [];
	}

	/*
	 * The chats shown: the archived ones or the others, then the selected filter (not in the
	 * archived chats), then the search.
	 */
	$scope.getFilteredSummary = function() {
		var list = $scope.getSummary();
		var archive = $scope.ui.userList.enableArchive;

		list = list.filter(function(u) {
			var p = $scope.getProfileFromMessage(u);
			if(!p) return false;

			if(archive && $scope.isArchived(p) != $scope.show_archived)
				return false;

			if(!$scope.show_archived && !$scope.matchesChatFilter(p))
				return false;

			return true;
		});

		var q = ($scope.search_query || '').trim().toLowerCase();
		if(!q) return list;
		return list.filter(function(u) {
			var name = $scope.getNameFromMessage(u).toLowerCase();
			return name.indexOf(q) !== -1;
		});
	}

	// shown when the chat list is empty
	$scope.getEmptyChatListMessage = function() {
		var l = $scope.ui.userList;
		if($scope.search_query)
			return 'No results for "' + $scope.search_query + '"';

		if($scope.show_archived)
			return l.emptyArchivedMessage;

		if(l.enableFilters && $scope.chat_filter > 0)
			return l.emptyFilterMessage;

		return 'You have no messages';
	}

	$scope.getMessages = function() {
		return $scope.messages;
	}

	$scope.showName = function(m) {
		if(!m.isMessage() || !m.isIncoming() || !m.isGroupMessage())
			return false;

		if(!$scope.messages.length || !$scope.messages) return false;

		const cb = (element) => element === m;
		var i = $scope.messages.findIndex(cb);
		if(i <= 0) return true;
		var prev = $scope.messages[i-1];

		if(prev.profile != m.profile || !prev.isIncoming() || !prev.isMessage())
			return true;

		return false;
	}

	$scope.Mesibo_onMessage = async function(m) {
		console.log("Mesibo_onMessage: " + (m?m.getMessageId():-1) + " origin: " + ((m && m.isRealtimeMessage())?"realtime":"db"));
		if(m && m.message) {
			//console.log(m.message);
			//var x = null;
			//x.test_exception = 123;
		}

		if(m && m.peer == "mesibo-system-user") {
			MesiboLog("bad message");
		}
		//MesiboLog("$scope.prototype.OnMessage", m);
		if(isMessageSync && !m){
			MesiboLog("Run out of messages to display. Syncing..");
			$scope.msg_read_limit_reached = true;
			$scope.messageSession.sync(this.readCount);
		}
		
		if(!m) {
			// no more older messages: nothing is added above
			$scope.older_from_bottom = -1;
			$scope.refresh();
			return;
		}

		if(!m.mid || m.presence)
			return;

		// a new message: the chat's unread count, and an archived chat may come back
		if(m.isRealtimeMessage()) {
			$scope.unarchiveOnMessage(m);
			$scope.updateUnreadCount($scope.getProfileFromMessage(m));
		}

		if(!$scope.selected_user) {
			$scope.updateSummary();
			return;
		}
		
		if(!m.isDestinedFor($scope.selected_user)) {
			//$scope.refresh(); // to update summary
			return;
		}

		var prev = null;
		if(m.isRealtimeMessage()) {
			if($scope.messages.length) {
				prev = $scope.messages[$scope.messages.length-1];
			}


			if(!prev || (!prev.isDate() && prev.getTimestamp().getDaysElapsed() != m.getTimestamp().getDaysElapsed())) {
				var d = m.cloneDate();
				$scope.messages.push(d);
			}

			$scope.messages.push(m);
		}
		else  {
			if($scope.messages.length) {
				prev = $scope.messages[0];
			}

			if(prev && !prev.isDate() && prev.getTimestamp().getDaysElapsed() != m.getTimestamp().getDaysElapsed()) {
				var d = prev.cloneDate();
				$scope.messages.unshift(d);	
			}  

			$scope.messages.unshift(m);

			if(m.isLastMessage()) {
				var d = m.cloneDate();
				$scope.messages.unshift(d);	
			}
		}

		if(m.isRealtimeMessage() || m.isLastMessage()){
			$scope.refresh();
			$scope.scrollToLastMsg();
		}

		return 0;
	}

	$scope.Mesibo_onMessageUpdate = async function(m) {
		$scope.refresh();
		return;
	}

	$scope.Mesibo_onSync = function(rs, count) {
		if(!count) return;
		$scope.messageSession.read(MAX_MESSAGES_READ);
	}

	$scope.Mesibo_onPresence = async function(m) {
		// calling refresh is not optimized but keep it for now
		$scope.refresh();
	}

	$scope.sessionReadMessages = function(user, count){
		MesiboLog("sessionReadMessages", user);
		$scope.messages.length = 0;
		$scope.messageSession =  user.createReadSession($scope);
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

	$scope.deleteSelectedMessage = async function(m, remote){
		if(!m) return;

		for(var i=0 ; !remote && i < $scope.messages.length; i++) {
			if($scope.messages[i].mid == m.mid) {
				$scope.messages.splice(i, 1);
				break;
			}
		}

		if(remote)
			await m.wipeAndRecall();
		else
			await m.delete();

		if(!$scope.messages.length) {
			$scope.updateSummary();
			return;
		}
		$scope.refresh();
		return;
	}

	$scope.deleteMessages = async function() {
		if(!$scope.selected_user)
			return;

		await $scope.selected_user.deleteMessages();
		//await $scope.selected_user.deleteMessagesOlderThan(10);
		$scope.selected_user = null;

		var s = $scope.getSummary();
		if(s.length) {
			$scope.generateMessageArea($scope.getProfileFromMessage(s[0]));
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
		if(!m || !to)
			return;

		m = m.forward(to);
		m.send();

		$scope.refresh();
		$scope.scrollToLastMsg();
	}

	$scope.resendSelectedMessage = function(m){
		MesiboLog("resendSelectedMessage", m);
		if(!$scope.selected_user)
			return;

		m.resend();
	}

	$scope.onKeydown = function(event){
		if(event.keyCode === 13 && !event.shiftKey) {
			event.preventDefault();
			$scope.sendMessage();
		} else {
			$scope.selected_user.sendTyping();
		}
	}

	$scope.onInputChange = function() {
		if($scope.isLinkPreview) $scope.inputTextChanged();
		var el = document.getElementById('input');
		if(!el) return;
		el.style.height = 'auto';
		el.style.height = Math.min(el.scrollHeight, 150) + 'px';
	}

	//Send text message to peer(selected user) by reading text from input area
	$scope.sendMessage = function() {
		MesiboLog('sendMessage');

		var value = $scope.input_message_text;
		if(!value)	
			return -1;

		var m = $scope.selected_user.newMessage();
		m.message = value;
		$scope.applyMessageOptions(m);
		m.send();
		$scope.messageOptionsSent();

		// the user's own message: shown at the bottom
		$scope.stick_to_bottom = true;

		$scope.input_message_text = "";
		var el = document.getElementById('input');
		if(el) el.style.height = '';
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
		//$('#answerModal').modal({backdrop: 'static', keyboard: false});
		//$('#answerModal').modal({ show: true });
		$('#answerModal').modal("show");
		$scope.refresh();
	}

	$scope.hangupVideoCall = function(){
		$('#videoModal').modal("hide");
		$('#answerModal').modal("hide");
		$scope.is_video_call = false;
		$scope.call.hangup();
		$scope.refresh();
	}

	$scope.hangupAudioCall = function(){
		$('#voiceModal').modal("hide");
		$('#answerModal').modal("hide");
		$scope.is_voice_call = false;
		$scope.call.hangup();
		$scope.refresh();
	}

	$scope.showVideoCall = function(){
		$('#videoModal').modal("show");
		$scope.is_video_call = true;
		$scope.call_audio_muted = false;
		$scope.call_video_muted = false;
		$scope.refresh();
	}

	$scope.showVoiceCall = function(){
		$('#voiceModal').modal("show");
		$scope.is_voice_call = true;
		$scope.call_audio_muted = false;
		$scope.refresh();
	}

	$scope.call_audio_muted = false;
	$scope.call_video_muted = false;

	$scope.toggleCallAudio = function(){
		$scope.call_audio_muted = !$scope.call_audio_muted;
		// mute(audio, video, enable): which stream(s), then mute (true) or unmute (false)
		$scope.mesibo.mute(true, false, $scope.call_audio_muted);
		$scope.refresh();
	}

	$scope.toggleCallVideo = function(){
		$scope.call_video_muted = !$scope.call_video_muted;
		$scope.mesibo.mute(false, true, $scope.call_video_muted);
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

	/* --- The photo editor before sending: crop, rotate, flip (Cropper.js) --- */

	$scope.EDITOR_RATIOS = [
		{title: 'Free', ratio: NaN},
		{title: '1:1', ratio: 1},
		{title: '4:3', ratio: 4/3},
		{title: '16:9', ratio: 16/9}];

	$scope.image_editor_on = false;
	$scope.image_cropper = null;
	$scope.image_edited = false;    // the user changed the picture: it is made again when sent
	$scope.editor_ratio = 'Free';
	$scope.editor_scale = {x: 1, y: 1};

	// pictures the editor can change: not animated or vector ones
	$scope.isEditableImage = function(f) {
		var type = (f.type || '').toLowerCase();
		return (type.startsWith('image/') && 'image/gif' != type && 'image/svg+xml' != type);
	}

	/*
	 * Starts the editor on the picture in the preview. Called once the dialog is shown and the
	 * picture has loaded: the editor sizes itself from its box, which has no size before.
	 */
	$scope.startImageEditor = function() {
		if($scope.image_cropper)
			$scope.image_cropper.destroy();
		$scope.image_cropper = null;

		if('undefined' === typeof Cropper)
			return;

		var img = document.getElementById('image-preview');
		$scope.image_cropper = new Cropper(img, {
			viewMode: 1,
			autoCropArea: 1,
			background: false,
			// the user moved or resized the crop: the picture is made again when sent
			cropstart: function() {
				$scope.image_edited = true;
			}
		});
		$scope.refresh();
	}

	$scope.stopImageEditor = function() {
		if($scope.image_cropper)
			$scope.image_cropper.destroy();

		$scope.image_cropper = null;
		$scope.image_editor_on = false;
		$scope.image_edited = false;
		$scope.editor_ratio = 'Free';
		$scope.editor_scale = {x: 1, y: 1};
	}

	$scope.editorRotate = function(degrees) {
		if(!$scope.image_cropper) return;
		$scope.image_cropper.rotate(degrees);
		$scope.image_edited = true;
	}

	$scope.editorFlip = function(horizontal) {
		if(!$scope.image_cropper) return;
		if(horizontal) {
			$scope.editor_scale.x = -$scope.editor_scale.x;
			$scope.image_cropper.scaleX($scope.editor_scale.x);
		} else {
			$scope.editor_scale.y = -$scope.editor_scale.y;
			$scope.image_cropper.scaleY($scope.editor_scale.y);
		}
		$scope.image_edited = true;
	}

	$scope.editorRatio = function(r) {
		if(!$scope.image_cropper) return;
		$scope.editor_ratio = r.title;
		$scope.image_cropper.setAspectRatio(r.ratio);
		if(!isNaN(r.ratio))
			$scope.image_edited = true;
	}

	$scope.editorReset = function() {
		if(!$scope.image_cropper) return;
		$scope.image_cropper.reset();
		$scope.image_cropper.setAspectRatio(NaN);
		$scope.editor_ratio = 'Free';
		$scope.editor_scale = {x: 1, y: 1};
		$scope.image_edited = false;
	}

	/*
	 * The edited picture as a file, with the same name; cb(file). The original file when nothing
	 * was changed, so it is not encoded again.
	 */
	$scope.getEditedFile = function(file, cb) {
		if(!$scope.image_cropper || !$scope.image_edited) {
			cb(file);
			return;
		}

		var type = ('image/png' == file.type || 'image/webp' == file.type) ? file.type : 'image/jpeg';
		var canvas = $scope.image_cropper.getCroppedCanvas({maxWidth: 4096, maxHeight: 4096, imageSmoothingQuality: 'high'});
		if(!canvas) {
			cb(file);
			return;
		}

		canvas.toBlob(function(blob) {
			if(!blob) {
				cb(file);
				return;
			}
			cb(new File([blob], file.name, {type: type}));
		}, type, 0.92);
	}

	$scope.showFilePreview = function(f) {
		var reader = new FileReader();
		$scope.stopImageEditor();
		$('#image-preview').attr('src', "");
		$('#video-preview').attr('src', "");
		$('#video-preview').hide();

		/*
		 * A picture for the editor: its box gets its size now (image_editor_on), and the editor
		 * starts once both the dialog is shown and the picture has loaded, whichever comes last.
		 */
		var editable = $scope.isEditableImage(f);
		var waiting = 2;
		var editorReady = function() {
			if(--waiting > 0)
				return;
			requestAnimationFrame(function() {
				$scope.startImageEditor();
			});
		};

		if(editable) {
			$scope.image_editor_on = true;
			$('#fileModal').off('shown.bs.modal.editor').one('shown.bs.modal.editor', editorReady);
		}

		reader.onload = function(e) {
			if(editable){
				var img = document.getElementById('image-preview');
				img.onload = function() {
					img.onload = null;
					editorReady();
				};
				$('#image-preview').attr('src', e.target.result);
				$('#image-preview').show();
			}
			else if(isValidFileType(f.name, 'image')){
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
		document.getElementById("recorderModalLabel").innerHTML = "Send a Picture";
		$scope.recorder = new MesiboRecorder($scope, "picture");
		$scope.recorder.initPictureRecording();
	}

	$scope.openVideoRecorder = function(){
		$('#recorderModal').modal("show");
		document.getElementById("recorderModalLabel").innerHTML = "Video Recorder";
		$scope.recorder = new MesiboRecorder($scope, "video");
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

	// keepEditor: sending, the edited picture is still being made (sendFile stops the editor)
	$scope.closeFilePreview = function(keepEditor) {
		if(!keepEditor)
			$scope.stopImageEditor();

		$('#fileModal').modal("hide");
		$('#image-preview').hide();
		$('#video-preview').hide();
		//Clear selected file button attr
	}

	$scope.selectProfilePicture = function(){
		setTimeout(function () {
			angular.element('#profile-pic-input').trigger('click');
		}, 0);
	}

	$scope.onProfileImageSelect = function(element){
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

			var c = $scope.mesibo.getSelfProfile();
			c.reset();
			c.setImage(file, 0);
			c.save();

			$scope.refresh();

			MesiboLog('Reset', element.value);
			element.value = '';

		});
	}

	$scope.testFunction = function() {
		//var c = $scope.mesibo.getProfile("abc");
		//c.removeLocalProfile();
		//return;

		var cs = new MesiboContactSynchronizer();
		cs.setContact(true);
		cs.subscribe(true);
		//cs.setProfileAccessLevels([ 2,1]);
		var addrs = [];
		addrs.push("abc");
		addrs.push("xyz");
		cs.sync(addrs);
	}

	// the user's own name and about, as typed in the profile (an object: the fields are in a child scope)
	$scope.self_edit = {name: '', status: ''};

	$scope.setSelfProfileName = function(u){
		var c = $scope.mesibo.getSelfProfile();
		var name = ($scope.self_edit.name || '').trim();
		if(!isValidString(name)) return;
		c.setName(name);
		c.setString("lang", "en");
		c.save();
		$scope.refresh();
	}

	$scope.setSelfProfileStatus = function() {
		var c = $scope.mesibo.getSelfProfile();
		c.setString("status", ($scope.self_edit.status || '').trim());
		c.save();
		$scope.refresh();
	}

	$scope.getSelfProfile = function(){
		return $scope.mesibo.getSelfProfile();
	}


	$scope.setProfilePicture = function(){
	}


	// a picture from the editor: as edited (async: the picture is made again first)
	$scope.sendFile = function(){
		if(!$scope.image_cropper) {
			$scope.sendSelectedFile($scope.selected_file);
			return;
		}

		$scope.getEditedFile($scope.selected_file, function(file) {
			$scope.stopImageEditor();
			$scope.sendSelectedFile(file);
			$scope.refresh();
		});
	}

	$scope.sendSelectedFile = function(file){
		var m = $scope.selected_user.newMessage();
		m.setContent(file);
		m.message = $scope.input_file_caption;
		$scope.applyMessageOptions(m);
		m.send();
		$scope.messageOptionsSent();

		// the user's own message: shown at the bottom
		$scope.stick_to_bottom = true;

		$scope.input_file_caption = '';
	}

	$scope.isFileMsg = function(m){
		return isValid(m.filetype);
		//return isValid(m.filetype) || m.fileurl.length > 0;
	}

	$scope.isFailedMessage = function(m){		    
		if(!m || !m.isFailed())
			return false;

		return true;
	}

	//Message contains URL Preview
	$scope.isUrlMsg = function(m){
		return ($scope.isFileMsg(m) && !isValidString(m.fileurl));
	}

	$scope.Mesibo_onConnectionStatus = function(status){
		$scope.isConnected = false;

		MesiboLog("MesiboNotify.prototype.Mesibo_onConnectionStatus: " + status);	
		if(MESIBO_STATUS_SIGNOUT == status || MESIBO_STATUS_AUTHFAIL == status ){
			$scope.logout(MESIBO_STATUS_AUTHFAIL == status);
		}

		var s ="";
		switch(status){
			case MESIBO_STATUS_ONLINE:
				s = "";
				$scope.isConnected = true;
				break;
			case MESIBO_STATUS_CONNECTING:
				s = "Connecting..";
				break;
			default: 
				s = "Not Connected";
		}

		$scope.connection_status = s;
		$scope.refresh();
	}

	$scope.MesiboProfile_onPublish = function(p, result) {
		MesiboLog("MesiboProfile_onPublish: " + result);	

		// the user's own photos were saved: the strip as the profile has them now
		if(!$scope.profile_photos_saving)
			return;

		$scope.profile_photos_saving = false;
		if(!result)
			alert("The photos could not be saved.");

		var self = $scope.mesibo.getSelfProfile();
		if($scope.display_profile == self)
			$scope.loadProfilePhotos(self);
		$scope.refresh();
	}

	$scope.Mesibo_onProfileUpdated = function(p){
		// the profile shown: its photos again (e.g. a photo uploaded)
		if(p && p == $scope.display_profile && !$scope.profile_photos_changed && !$scope.profile_photos_saving)
			$scope.loadProfilePhotos(p);
		$scope.refresh();
	}
	
	/* customize profile if requires */
	$scope.Mesibo_onCustomizeProfile = function(p){
		return true; 
	}
	
	/* This function is invoked in the absence of a profile name to get a temporary name. */
	$scope.Mesibo_onGetProfileName = function(p){
		if(p.isGroup()) return null;
		return "+" + p.getAddress();
	}
	
	/* This function is invoked in the absence of a profile image to get a temporary image. */
	$scope.Mesibo_onGetProfileImage = function(p){
		return null;
	}

	$scope.Mesibo_onMessageStatus = function(m){
		MesiboLog("$scope.Mesibo_onMessageStatus", m);
		$scope.refresh();
	}

	$scope.Mesibo_onCall = function(callid, from, video){
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

	$scope.Mesibo_onCallStatus = function(callid, status){

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

	/* ------------------------------------------------------------------------------------------
	 * Message options, disappearing messages and sensitive messages, as in the Android and iOS
	 * messaging UI. The settings are in MessengerUiConfig (mesibo/uiconfig.js).
	 */

	$scope.ui = MessengerUiConfig;

	// the API has disappearing messages (isDisappearingMessage, keep, message defaults)
	$scope.hasDisappearingApi = function(m) {
		return (m && typeof m.isDisappearingMessage === 'function');
	}

	$scope.isDisappearing = function(m) {
		if(!$scope.hasDisappearingApi(m) || !m.isMessage() || m.isDeleted())
			return false;
		return m.isDisappearingMessage();
	}

	/* --- Message options: an index into each row of MessengerUiConfig.messageOptions --- */

	$scope.msgopts = {age: 0, start: 0, expiry: 0, sensitivity: 0, keep: false};
	$scope.msgopts_show = false;

	$scope.showMessageOptions = function() {
		$scope.msgopts_show = true;
		$scope.refresh();
	}

	$scope.hideMessageOptions = function() {
		$scope.msgopts_show = false;
		$scope.refresh();
	}

	// Done closes the sheet; with a message typed, it is Send: the message goes with the options
	$scope.messageOptionsDone = function() {
		$scope.msgopts_show = false;
		if($scope.input_message_text)
			$scope.sendMessage();
		$scope.refresh();
	}

	$scope.selectMessageOption = function(row, index) {
		$scope.msgopts[row] = index;
	}

	// back to the first choice of each row
	$scope.clearMessageOptions = function() {
		$scope.msgopts.age = 0;
		$scope.msgopts.start = 0;
		$scope.msgopts.expiry = 0;
		$scope.msgopts.sensitivity = 0;
		$scope.msgopts.keep = false;
	}

	// the button is highlighted while a choice other than the first is selected
	$scope.hasMessageOptions = function() {
		var o = $scope.msgopts;
		return (o.age > 0 || o.expiry > 0 || o.sensitivity > 0);
	}

	// the value of the selected choice of a row; 0 (unset) when the row is empty
	$scope.messageOptionValue = function(list, index) {
		if(!list || !list.length || index >= list.length)
			return 0;
		return list[index].value;
	}

	$scope.selectedSensitivityDetail = function() {
		var list = $scope.ui.messageOptions.sensitivities;
		var o = list[$scope.msgopts.sensitivity];
		return o ? (o.detail || '') : '';
	}

	/*
	 * Applies the options to a message about to be sent. Only options with a value are set, so
	 * that the chat's own defaults stay otherwise (as MessageOptions.applyTo on Android).
	 */
	$scope.applyMessageOptions = function(m) {
		if(!$scope.ui.messageOptions.enabled)
			return;

		var o = $scope.ui.messageOptions;

		var age = $scope.messageOptionValue(o.ages, $scope.msgopts.age);
		if(age > 0) {
			var start = $scope.messageOptionValue(o.timerStarts, $scope.msgopts.start);
			if(TIMERSTART_READ == start)
				m.setAgeAfterRead(age);
			else if(TIMERSTART_DELIVERED == start)
				m.setAgeAfterDelivered(age);
			else
				m.setAge(age);
		}

		var expiry = $scope.messageOptionValue(o.expiries, $scope.msgopts.expiry);
		if(expiry > 0)
			m.setExpiry(expiry);

		var sensitivity = $scope.messageOptionValue(o.sensitivities, $scope.msgopts.sensitivity);
		if(sensitivity > 0)
			m.setSensitivity(sensitivity);
	}

	// a message was sent: the options are cleared, unless they are for all messages in this chat
	$scope.messageOptionsSent = function() {
		if(!$scope.msgopts.keep)
			$scope.clearMessageOptions();
	}

	/* --- The disappearing messages screen of a chat: the chat's message defaults --- */

	$scope.disappearing_profile = null;
	$scope.disappearing_duration = 0;
	$scope.disappearing_start = TIMERSTART_SENT;

	$scope.canSetDisappearing = function(p) {
		return (p && !p.isSelfProfile() && typeof p.getMessageDefaults === 'function');
	}

	// the time set for the chat, and when it starts: only one of the ages is set
	$scope.getChatDisappearing = function(p) {
		var r = {duration: 0, start: TIMERSTART_SENT};
		if(!$scope.canSetDisappearing(p))
			return r;

		var d = p.getMessageDefaults();
		if(!d)
			return r;

		if(d.getAge() > 0) {
			r.duration = d.getAge();
		} else if(d.getAgeAfterDelivered() > 0) {
			r.duration = d.getAgeAfterDelivered();
			r.start = TIMERSTART_DELIVERED;
		} else if(d.getAgeAfterRead() > 0) {
			r.duration = d.getAgeAfterRead();
			r.start = TIMERSTART_READ;
		}

		return r;
	}

	// for the profile screen: Off, or the time
	$scope.getChatDisappearingSummary = function(p) {
		return messengerDurationTitle($scope.getChatDisappearing(p).duration);
	}

	$scope.showDisappearing = function(p) {
		if(!$scope.canSetDisappearing(p))
			return;

		var r = $scope.getChatDisappearing(p);
		$scope.disappearing_duration = r.duration;
		$scope.disappearing_start = r.start;
		$scope.disappearing_profile = p;
		$scope.refresh();
	}

	$scope.hideDisappearing = function() {
		$scope.disappearing_profile = null;
		$scope.refresh();
	}

	$scope.durationTitle = function(seconds) {
		return messengerDurationTitle(seconds);
	}

	$scope.selectDisappearingDuration = function(seconds) {
		$scope.disappearing_duration = seconds;
		$scope.saveDisappearing();
	}

	$scope.selectDisappearingStart = function(start) {
		$scope.disappearing_start = start;
		$scope.saveDisappearing();
	}

	// saved as the chat's message defaults: only the one age, the others 0; Off: none
	$scope.saveDisappearing = function() {
		var p = $scope.disappearing_profile;
		if(!p)
			return;

		var seconds = $scope.disappearing_duration;
		if(!seconds) {
			p.setMessageDefaults(null);
		} else {
			var start = $scope.disappearing_start;
			var d = p.newMessage();
			d.setAge(TIMERSTART_SENT == start ? seconds : 0);
			d.setAgeAfterDelivered(TIMERSTART_DELIVERED == start ? seconds : 0);
			d.setAgeAfterRead(TIMERSTART_READ == start ? seconds : 0);
			p.setMessageDefaults(d);
		}

		p.save();
		$scope.refresh();
	}

	/* --- A disappearing message: the timer icon, the time left, Keep --- */

	$scope.showTimerIcon = function(m) {
		return ($scope.ui.messageStatus.showTimerIcon && $scope.isDisappearing(m));
	}

	// the time, or for a moment after a tap on a disappearing message, the time left
	$scope.getMessageTime = function(m) {
		if(m._timeLeftUntil && m._timeLeftUntil > Date.now() && $scope.isDisappearing(m)) {
			var left = m.getRemainingAge();
			if(left > 0)
				return $scope.ui.messageStatus.disappearsInTitle.replace('%s', messengerShortDuration(left));
		}

		return m.getTimestamp().getTime();
	}

	$scope.showTimeLeft = function(m) {
		if(!$scope.isDisappearing(m))
			return;

		m._timeLeftUntil = Date.now() + 3000;
		$scope.refresh();

		setTimeout(function() {
			$scope.refresh();
		}, 3100);
	}

	$scope.canKeep = function(m) {
		return ($scope.ui.messages.enableKeep && $scope.isDisappearing(m));
	}

	$scope.isKeepBlocked = function(m) {
		return messengerSensitiveAt(m, $scope.ui.sensitivity.blockKeepLevel);
	}

	$scope.keepMessage = async function(m) {
		if($scope.isKeepBlocked(m)) {
			alert($scope.ui.sensitivity.blockedKeepMessage);
			return;
		}

		await m.keep();
		$scope.refresh();
	}

	// removes the disappearing messages whose time has passed from the open chat
	$scope.removeExpiredMessages = function() {
		var removed = false;

		for(var i = $scope.messages.length - 1; i >= 0; i--) {
			var m = $scope.messages[i];
			if(!$scope.isDisappearing(m))
				continue;

			if(m.getRemainingAge() == 0) {
				$scope.messages.splice(i, 1);
				removed = true;
			}
		}

		if(removed)
			$scope.refresh();
	}

	/* --- Sensitive messages --- */

	// uncovered in this chat, and uncovered while the app runs (below coverAgainLevel)
	$scope.revealed = {};
	$scope.revealed_app = {};

	$scope.showSensitiveIcon = function(m) {
		return (m.isMessage() && !m.isDeleted() && messengerSensitiveAt(m, $scope.ui.sensitivity.showIconLevel));
	}

	// covered until tapped (tapToViewLevel); the user's own sent messages only with coverSent
	$scope.isCovered = function(m) {
		var s = $scope.ui.sensitivity;
		if(!m || !m.isMessage() || m.isDeleted())
			return false;

		if(!m.isIncoming() && !s.coverSent)
			return false;

		if(!messengerSensitiveAt(m, s.tapToViewLevel))
			return false;

		return !($scope.revealed[m.mid] || $scope.revealed_app[m.mid]);
	}

	// tapped: uncovered; it stays so while the app runs, unless coverAgainLevel applies
	$scope.reveal = function(m) {
		$scope.revealed[m.mid] = true;
		if(!messengerSensitiveAt(m, $scope.ui.sensitivity.coverAgainLevel))
			$scope.revealed_app[m.mid] = true;
		$scope.refresh();
	}

	// a tap on a message: uncovers it, or shows the time left of a disappearing message
	$scope.onMessageClick = function(m, $event) {
		if($scope.isCovered(m)) {
			if($event) $event.preventDefault();
			$scope.reveal(m);
			return;
		}

		$scope.showTimeLeft(m);
	}

	$scope.onImageClick = function(m, $event) {
		$event.preventDefault();
		if($scope.isCovered(m)) {
			$scope.reveal(m);
			return;
		}

		$scope.openImgViewer(m.file.url, m.file.name);
	}

	$scope.isForwardBlocked = function(m) {
		return messengerSensitiveAt(m, $scope.ui.sensitivity.blockForwardLevel);
	}

	$scope.forwardOrBlock = function(m) {
		if($scope.isForwardBlocked(m)) {
			alert($scope.ui.sensitivity.blockedForwardMessage);
			return;
		}

		$scope.showForwardList(m);
	}

	// the text can't be selected, so it can't be copied
	$scope.isCopyBlocked = function(m) {
		return messengerSensitiveAt(m, $scope.ui.sensitivity.blockCopyLevel);
	}

	// the chat list shows the title instead of the content (hidePreviewLevel)
	$scope.isPreviewHidden = function(m) {
		return (m && !m.isDeleted() && messengerSensitiveAt(m, $scope.ui.sensitivity.hidePreviewLevel));
	}

	$scope.init_messenger = function(){
		MesiboLog("init_messenger called");
		$scope.sessionReadSummary();
		$scope.call = new MesiboCall($scope);
		$scope.file = new MessengerFile($scope);

		// disappearing messages leave the open chat when their time has passed
		setInterval(function() {
			$scope.removeExpiredMessages();
		}, 1000);
	}

	$scope.init_popup = function(){ 
		MesiboLog("init_popup called"); 
		$scope.selected_user = $scope.mesibo.getProfile(POPUP_DESTINATION_USER, 0); 
		$scope.activity = ""; 

		$scope.call = new MesiboCall($scope);
		$scope.file = new MessengerFile($scope);

		$scope.MAX_MEDIA_WIDTH = '180px';
		$scope.MAX_MEDIA_HEIGHT = '80px';

		$scope.MIN_MEDIA_WIDTH = '50px';
		$scope.MIN_MEDIA_HEIGHT = '50px';

		MesiboLog("sessionReadMessages", $scope.selected_user, MAX_MESSAGES_READ);
		$scope.sessionReadMessages($scope.selected_user, MAX_MESSAGES_READ); 
	} 

	$scope.toggleConnection = function(){
		if($scope.isConnected){
			MesiboLog("Stop Mesibo..");
			$scope.mesibo.stop();
		}
		else{
			MesiboLog("Start Mesibo..");
			$scope.mesibo.start();
		}
	}

	$scope.getToken = function() {
		if(null == $scope.mesibo)
			$scope.mesibo = Mesibo.getInstance();
		getMesiboDemoAppToken($scope.mesibo);
	}

	$scope.initMesibo = function(demo_app_name){

		if(demo_app_name == "multitab-popup"){
			// Instead of directly accessing Mesibo APIs like so,
			// $scope.mesibo = new Mesibo();
			// use a wrapper API that uses a shared worker 
			$scope.mesibo = new MesiboWorker($scope);
		}

		$scope.mesiboNotify = $scope;

		//Initialize Mesibo
		if(!MESIBO_APP_ID || !getLoginToken()){
			alert("Invalid token or app-id. Check config.js");
			return;
		}

		$scope.isLoggedIn = true;
		$scope.mesibo = Mesibo.getInstance();
		$scope.mesibo.setAppName(MESIBO_APP_ID);

		/* Enable your users to log in from multiple browser windows and tabs.
		 * https://mesibo.com/documentation/api/messaging/sync-across-browser-tabs-windows/
		 *
		 * This is a beta feature
		 */
		//$scope.mesibo.enableCrossTabSessions(true);
		
		// next to this page, so it works wherever the messenger is hosted: pictures and files are
		// served through it
		$scope.mesibo.startServiceWorker("sw.js");
		Mesibo.printVersion("test api", "today");
		$scope.mesibo.setCredentials(getLoginToken());
		$scope.mesibo.setListener($scope.mesiboNotify);
		$scope.mesibo.setDatabase("mesibodb", function(init){
			MesiboLog("setDatabase", init);

			if(!init){
				ErrorLog("setDatabase failed");
				return;
			}

			$scope.init_messenger();

		});

		$scope.mesibo.start();   

		$scope.refresh();
	}

	onControllerReady();
	console.log("AppController loading done");
}]);


