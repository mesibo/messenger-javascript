// calls.js

/** Copyright (c) 2021 Mesibo
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
	this.api.call(this.scope.selected_user.getAddress());

}

MesiboCall.prototype.voiceCall = function() {
	MesiboLog('voiceCall');

	// Setup UI elements for audio call
	this.scope.showVoiceCall();
	this.api.setupVoiceCall("audioPlayer");

	//Voice Call API
	this.api.call(this.scope.selected_user.getAddress());
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

