// calls.js

function MesiboCall(s) {
	this.scope = s;
	this.api = {};
	this.init()

}

MesiboCall.prototype.init = function(){
	this.api = this.scope.getMesibo();
	if(!isValid(this.api)){
		MesiboLog("Invalid Mesibo Instance");
		return -1;
	}

	return this;
}

MesiboCall.prototype.videoCall = function() {
	
	// Setup UI elements for video call
	this.scope.showVideoCall();
	this.api.setupVideoCall("localVideo", "remoteVideo", true);

	//Video Call API
	this.api.call(this.scope.selected_user.address);

}

MesiboCall.prototype.voiceCall = function() {
	MesiboLog('voiceCall');

	// Setup UI elements for audio call
	this.scope.showVoiceCall();
	this.api.setupVoiceCall("audioPlayer");

	//Voice Call API
	this.api.call(this.scope.selected_user.address);
}

MesiboCall.prototype.answer = function() {
	
	//Common modal popup notification for a call. Select the required modal to be displayed
	if (this.scope.is_video_call)
		this.video_answer();
	else
		this.voice_answer();

}

/** Control Modal View **/
MesiboCall.prototype.hangup = function() {
	this.scope.hangupCall();
	this.api.hangup(0);
}

MesiboCall.prototype.video_answer = function() {
	this.scope.showVideoCall();
	this.api.answer(true);
}

MesiboCall.prototype.video_hangup = function() {
	this.scope.hangupVideoCall();
	this.api.hangup(0);
}

MesiboCall.prototype.voice_answer = function() {
	this.scope.showVoiceCall();
	this.api.answer(true);
}

MesiboCall.prototype.voice_hangup = function() {
	this.scope.hangupAudioCall();
	this.api.hangup(0);
}

