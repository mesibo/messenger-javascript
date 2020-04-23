const MAX_MESSAGES_READ_SUMMARY = 100;

//The number of messages loaded into the message area in one read call
const MAX_MESSAGES_READ = 100;


angular.module('MesiboWeb', [])
  .controller('AppController', ['$scope', '$window', '$anchorScroll', function ($scope, $window, $anchorScroll) {

    $scope.summarySession = {};
    $scope.messageSession = {};

    $scope.available_users =  [];
    $scope.selected_user = {};
    $scope.selected_user_count = 0; 
    $scope.self_user = {};

    $scope.mesibo = {}; 
    
    //Main UI
    $scope.profile_settings_show = false;
    $scope.users_panel_show = false;
    $scope.message_area_show = false;
    $scope.input_message_text ="";

    //Calls  
    $scope.is_answer_call = false;
    $scope.is_video_call = false;
    $scope.is_voice_call = true;
    $scope.call_status = "Call Status: ";
    $scope.call_alert_message = "";

    //Files
    $scope.selected_file = {};
    $scope.input_file_caption = "";

    $scope.refresh = function(){
        $scope.$applyAsync();
    }
    
    $scope.scrollToLastMsg = function() {
        $scope.$$postDigest(function () {
                $anchorScroll("messages_end");
            });
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
            return getFileType(lastMessage);

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
        $scope.mesibo.stop();
        $('#logoutModal').modal("show");
    }

    $scope.getFileIcon = function(f){
        return getFileIcon(f);
    }

    $scope.sessionReadSummary = function(){
        $scope.summarySession = $scope.mesibo.readDbSession(null, 0, null, 
        function on_messages(m) {
            MesiboLog("sessionReadSummary complete");
            MesiboLog($scope.summarySession.messages);
            if($scope.summarySession.messages.length > 0){
                var init_user = $scope.summarySession.messages[0];
                $scope.generateMessageArea(init_user);
                $scope.selected_user = init_user;
            }  
            $scope.refresh()
        });
        if(!isValid($scope.summarySession)){
            MesiboLog("Invalid summarySession");
            return -1;
        }
    
        $scope.summarySession.enableSummary(true);
        $scope.summarySession.read(MAX_MESSAGES_READ_SUMMARY);
    }



    $scope.sessionReadMessages = function(user, count){
        // MesiboLog("sessionReadMessages", user);
        var peer = user.address;
        var groupid = user.groupid;

        // MesiboLog("readMessages "+ peer+ " "+" groupid "+ groupid+ " "+ count);

        $scope.messageSession =  $scope.mesibo.readDbSession(peer, groupid, null, 
            function on_messages(m) {
            MesiboLog("sessionReadMessages complete");
            // MesiboLog($scope.messageSession.messages);
            $scope.refresh();
            $scope.scrollToLastMsg();
            
        });

    
        if(!isValid($scope.messageSession)){
            MesiboLog("Invalid messageSession");
            return -1;
        }

        $scope.messageSession.enableReadReceipt(true);
        $scope.messageSession.read(count); 
     
    }


    $scope.onMessage = function(m, data) {
    MesiboLog("$scope.prototype.onMessage", m, data);

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

        return 0;
    };
  //Send text message to peer(selected user) by reading text from input area
    $scope.sendMessage = () => {
        MesiboLog('sendMessage');

        var value = $scope.input_message_text;
        if (!isValidString(value))
            return -1;

        MesiboLog($scope.selected_user);
        var m = {}
        m.id = $scope.mesibo.random();
        m.peer = $scope.selected_user.address; 
        m.groupid = $scope.selected_user.groupid;
        m.flag = MESIBO_FLAG_DEFAULT;
        m.message = value;

        MesiboLog(m, m.id, value);
        $scope.mesibo.sendMessage(m, m.id, value);

        $scope.input_message_text = "";
        $scope.refresh();
        $scope.scrollToLastMsg();


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

    $scope.closeFilePreview = function() {
        $('#fileModal').modal("hide");
        //Clear selected file button attr
    }

    $scope.sendFile = function(){
        $scope.file.uploadSendFile();
    }

    $scope.isFileMsg = function(m){
        return (undefined != m.filetype);
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

    $scope.OnConnectionStatus = function(status, value){
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

    $scope.onMessageStatus = function(m){
        $scope.refresh();
    }

    $scope.onCall = function(callid, from, video){
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

    $scope.onCallStatus =function(callid, status){

        var s = "Complete";

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
        }

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

	$scope.sessionReadMessages($scope.selected_user, 1000); 
    } 

    $scope.initMesibo = function(demo_app_name){
        $scope.mesibo = new Mesibo();
        $scope.mesiboNotify = new MesiboNotify($scope);

        //Initialize Mesibo
        $scope.mesibo.setAppName(MESIBO_APP_ID);
        $scope.mesibo.setCredentials(MESIBO_ACCESS_TOKEN);
        $scope.mesibo.setListener($scope.mesiboNotify);
        $scope.mesibo.setDatabase("mesibo");
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

  
