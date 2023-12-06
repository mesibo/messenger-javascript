// recorder.js

/** Copyright (c) 2022 Mesibo
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
 * Recorder can be used to capture and send live media(captured from WebCam etc)
 * Example: Audio Clip, Video Clip, Picture, etc
 *
 * Uses:
 * WebRTC  https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
 * Media Recorder https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
 *
 * Audio Recording uses code from the Web Dictaphone demo. 
 * Refer to the source code at https://github.com/mdn/web-dictaphone/  
 * 
 * Taking still photos with WebRTC
 * https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos
 * 
 */

function MesiboRecorder(s, type) {
	this.scope = s;
	this.type = type;

	this.record = document.querySelector('.record');
	this.stop = document.querySelector('.stop');
	this.mediaClips = document.querySelector('.sound-clips');
	this.canvas = document.querySelector('.visualizer');
	this.camera = document.querySelector('.camera');
	this.photo = document.getElementById('photo_button');
	this.stream = null;
	this.videoRecorder = false;

	this.canvasCtx = this.canvas.getContext("2d");

	window.rCtx = this; 

	if(type == 'audio')
		this.audioRecorder();
	else if(type == 'picture')
		this.pictureRecorder();
	else if(type == 'video') {
		this.pictureRecorder();
		this.videoRecorder = true;
	}
}

MesiboRecorder.prototype.audioRecorder = function(){

	// disable stop button while not recording
	this.stop.disabled = true;

	// visualiser setup - create web audio api context and canvas
	this.audioCtx = null;

	//Initially hide clips area and show only visualizer, record & stop buttons
	this.canvas.style.display = "initial";

	this.record.style.display = "inline-block";
	this.stop.style.display = "inline-block";

	this.mediaClips.style.display = "none";
	this.record.style.background = "";
	this.record.style.color = "";

	this.camera.style.display = "none";

}

MesiboRecorder.prototype.pictureRecorder = function(){

	this.camera.style.display = "block";  

	this.canvas.style.display = "none";
	this.photo.disabled = false;
	// disable stop button while not recording
	this.stop.disabled = true;
	this.record.style.display = "inline-block";
	this.stop.style.display = "inline-block";

	this.mediaClips.style.display = "none";


	this.video = document.getElementById("capture-video");
	this.photo = document.getElementById('captured-photo');

	this.video.style.display = "inline-block";
	this.photo.style.display = "none";

	document.getElementById("buttons").style.display = "block";
	document.getElementById("recording_area").style.display = "block";

}

//main block for doing the video and picture recording
MesiboRecorder.prototype.initPictureRecording = function(){
	MesiboLog("initPictureRecording called", this);  

	let rCtx = window.rCtx;

	if(!rCtx.stream){
		navigator.mediaDevices.getUserMedia({ video: true, audio: this.videoRecorder })
			.then(function(stream) { 
				rCtx.stream = stream;     
				rCtx.video.srcObject = stream;
				rCtx.video.play();
				rCtx.recordMedia(stream, true); //Recording Video	
			})
			.catch(function(err) {
				console.log("An error occurred: " + err);
			});

	}


	// The width and height of the captured photo. We will set the
	// width to the value defined here, but the height will be
	// calculated based on the aspect ratio of the input stream.

	var width = 640;    // We will scale the photo width to this
	var height = 0;     // This will be computed based on the input stream
	height = this.video.videoHeight / (this.video.videoWidth/width);

	// |streaming| indicates whether or not we're currently streaming
	// video from the camera. Obviously, we start at false.

	var streaming = false;

	this.video.addEventListener('canplay', function(ev){
		if (!streaming) {      

			// Firefox currently has a bug where the height can't be read from
			// the video, so we will make assumptions if this happens.

			if (isNaN(height)) {
				height = width / (4/3);
			}


			rCtx.video.setAttribute('width', width);
			rCtx.video.setAttribute('height', height);
			rCtx.canvas.setAttribute('width', width);
			rCtx.canvas.setAttribute('height', height);
			streaming = true;
		}
	}, false);

	var photo_button = document.getElementById('photo_button');
	var record_buttons = document.getElementById('buttons');
	if(this.videoRecorder) {
		photo_button.style.display = "none";
		record_buttons.style.display = "block";
	} else {
		photo_button.style.display = "inline-block";
		record_buttons.style.display = "none";
	}
	while (rCtx.camera.lastElementChild) {
		if(rCtx.camera.lastElementChild.classList.contains('clip'))
			rCtx.camera.removeChild(rCtx.camera.lastElementChild);
		else
			break;
	}

	photo_button.addEventListener('click', function(ev){
		takepicture();
		ev.preventDefault();
		document.getElementById("buttons").style.display = "none";
	}, false);

	clearphoto();


	// Fill the photo with an indication that none has been
	// captured.

	function clearphoto() {
		var context = rCtx.canvas.getContext('2d');
		context.fillStyle = "#AAA";
		context.fillRect(0, 0, rCtx.canvas.width, rCtx.canvas.height);

		var data = rCtx.canvas.toDataURL('image/png');

		rCtx.photo.setAttribute('src', data);
	}

	// Capture a photo by fetching the current contents of the video
	// and drawing it into a canvas, then converting that to a PNG
	// format data URL. By drawing it on an offscreen canvas and then
	// drawing that to the screen, we can change its size and/or apply
	// other changes before drawing it.

	function takepicture() {
		var context = rCtx.canvas.getContext('2d');
		if (width && height) {
			rCtx.canvas.width = width;
			rCtx.canvas.height = height;
			context.drawImage(rCtx.video, 0, 0, width, height);

			var data = rCtx.canvas.toDataURL('image/png');

			rCtx.photo.setAttribute('src', data);
			rCtx.photo.style.display = "inline-block";

			rCtx.video.style.display = "none";

			const buttonContainer = document.createElement('article');
			const cancelButton = document.createElement('button');
			const sendButton = document.createElement('button');

			buttonContainer.classList.add('clip');
			buttonContainer.style.textAlign = 'center';
			cancelButton.textContent = 'Cancel';
			cancelButton.className = 'cancel btn btn-danger';
			cancelButton.style.marginTop = '5px';
			cancelButton.style.marginLeft = '5px';

			sendButton.textContent = 'Send';
			sendButton.className = 'send btn btn-success';
			sendButton.style.marginTop = '5px';

			buttonContainer.appendChild(sendButton);
			buttonContainer.appendChild(cancelButton);

			while (rCtx.camera.lastElementChild) {
				if(rCtx.camera.lastElementChild.classList.contains('clip'))
					rCtx.camera.removeChild(rCtx.camera.lastElementChild);
				else
					break;
			}

			rCtx.camera.appendChild(buttonContainer);
			document.getElementById('photo_button').style.display = "none";      


			function resetRecorder(e){
				let evtTgt = e.target;
				evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
				document.getElementById("buttons").style.display = "block";
				document.getElementById("recording_area").style.display = "block";
			}

			cancelButton.onclick = function(e) {
				resetRecorder(e);
				rCtx.pictureRecorder();
				rCtx.initPictureRecording();        
			}

			sendButton.onclick = function(e) {
				var blob = rCtx._dataURItoBlob(data);
				var image = rCtx._blobToFile(blob, "capture-"+ Date.now()+".png", {type: "image/png"})
				rCtx.sendRecordedFile(image);
				MesiboLog("close stream", rCtx.stream, rCtx.stream.getTracks());
				rCtx.scope.closeRecorder(); //TBD: Should we close the recorder when the send button is clicked 
			}


		} else {
			clearphoto();
		}
	}

}

MesiboRecorder.prototype.recordMedia = function(stream, video){
	MesiboLog("recordMedia", stream, video);
	if(!stream)
		return;

	let chunks = [];
	let rCtx = this;
	
	const mediaRecorder = new MediaRecorder(stream);

	rCtx.stream = stream;
	if(!video){
		MesiboLog("Activate audio visuals");
		rCtx.visualize(stream);
	}
	
	rCtx.record.onclick = function() {
		mediaRecorder.start();
		console.log(mediaRecorder.state);
		console.log("recorder started");
		rCtx.record.style.background = "red";

		rCtx.stop.disabled = false;
		rCtx.record.disabled = true;

		let pb = document.getElementById("photo_button");
		if(pb)
			pb.disabled = true;
	}

	rCtx.stop.onclick = function() {
		mediaRecorder.stop();
		console.log(mediaRecorder.state);
		console.log("recorder stopped");
		rCtx.record.style.background = "";
		rCtx.record.style.color = "";

		rCtx.stop.disabled = true;
		rCtx.record.disabled = false;
	}

	mediaRecorder.onstop = function(e) {
		console.log("data available after MediaRecorder.stop() called.");

		// const clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
		const clipName = null; //Disabling clip name/caption for now

		const clipContainer = document.createElement('article');
		const clipLabel = document.createElement('p');

		var media = null;
		if(video){
			document.getElementById("recording_area").style.display = "none";
			media = document.createElement('video');
			media.width = "320";
			media.height = "240";
		}
		else{
			media = document.createElement('audio');
		}
		const cancelButton = document.createElement('button');
		const sendButton = document.createElement('button');

		clipContainer.classList.add('clip');
		clipContainer.style.textAlign = 'center';
		cancelButton.textContent = 'Cancel';
		cancelButton.className = 'cancel btn btn-danger';
		cancelButton.style.marginLeft = '5px';
		sendButton.textContent = 'Send';
		sendButton.className = 'send btn btn-success ml-1';

		if(clipName === null) {
			clipLabel.textContent = '';
		} else {
			clipLabel.textContent = clipName;
		}
		
		rCtx.canvas.style.display = "none";
		rCtx.record.style.display = "none";
		rCtx.stop.style.display = "none";

		clipContainer.appendChild(media);
		clipContainer.appendChild(clipLabel);
		clipContainer.appendChild(sendButton);
		clipContainer.appendChild(cancelButton);      

		while (rCtx.mediaClips.lastElementChild) {
			rCtx.mediaClips.removeChild(rCtx.mediaClips.lastElementChild);
		}
		rCtx.mediaClips.appendChild(clipContainer);
		rCtx.mediaClips.style.display = "block";

		media.controls = true;

		var blob = null;
		if(video)	
			blob = new Blob(chunks, { 'type' : 'video/mp4; codecs=opus' });
		else
			blob = new Blob(chunks, { 'type' : 'audio/webm; codecs=opus' });
		chunks = [];
		const mediaUrl = window.URL.createObjectURL(blob);
		media.src = mediaUrl;

		var mediaFile = null;

		if(video)
			mediaFile = rCtx._blobToFile(blob, clipLabel.textContent + '.mp4', {type: "video/mp4"});
		else
			mediaFile = rCtx._blobToFile(blob, clipLabel.textContent + '.wav', {type: "audio/wav"});

		function resetRecorder(e){

			let evtTgt = e.target;
			evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);

			if(!video)
				rCtx.canvas.style.display = "initial";
			rCtx.record.style.display = "inline-block";
			rCtx.stop.style.display = "inline-block";

			rCtx.record.style.background = "";
			rCtx.record.style.color = "";
			
			if(video){
				this.photo_button.disabled = false;
				document.getElementById("buttons").style.display = "block";
				document.getElementById("recording_area").style.display = "block";
			}

		}

		cancelButton.onclick = function(e) {
			resetRecorder(e);        
		}

		sendButton.onclick = function(e) {
			rCtx.sendRecordedFile(mediaFile);
			MesiboLog("close stream", rCtx.stream);
			rCtx.scope.closeRecorder(); //TBD: Should we close the recorder when the send button is clicked 
		}

	}

	mediaRecorder.ondataavailable = function(e) {
		chunks.push(e.data);
	}
}



//main block for doing the audio recording
MesiboRecorder.prototype.initAudioRecording = function(){
	MesiboLog("initAudioRecording called..");
	this.canvas.height = "60";

	if (!navigator.mediaDevices.getUserMedia){
		console.log('getUserMedia not supported on your browser!');
		return -1;
	}

	const constraints = { audio: true };
	let chunks = [];

	let rCtx = window.rCtx; 
	let onSuccess = function(stream) {
		rCtx.recordMedia(stream, false); //Audio Recording
	}

	let onError = function(err) {
		console.log('The following error occured: ' + err);
	}

	navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

}

MesiboRecorder.prototype._blobToFile = function(b, fileName, options){    
	var file = new File([b], fileName, options);
	MesiboLog("_blobToFile, generated file of type", file.type, file.name) 
	return file;
}

MesiboRecorder.prototype._dataURItoBlob = function(dataURI) {
	// convert base64 to raw binary data held in a string
	// doesn't handle URLEncoded DataURIs 
	var byteString = atob(dataURI.split(',')[1]);

	// separate out the mime component
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

	// write the bytes of the string to an ArrayBuffer
	var ab = new ArrayBuffer(byteString.length);

	// create a view into the buffer
	var ia = new Uint8Array(ab);

	// set the bytes of the buffer to the correct values
	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	// write the ArrayBuffer to a blob, and you're done
	var blob = new Blob([ab], {
		type: mimeString
	});
	return blob;

}

MesiboRecorder.prototype.sendRecordedFile = function(f){
	MesiboLog("sendRecordedFile", f);
	this.scope.selected_file = f;
	this.scope.sendFile();
}

MesiboRecorder.prototype.visualize = function(stream) {
	MesiboLog("visualize", stream);
	if(!this.audioCtx) {
		this.audioCtx = new AudioContext();
	}

	const source = this.audioCtx.createMediaStreamSource(stream);

	const analyser = this.audioCtx.createAnalyser();
	analyser.fftSize = 2048;
	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);

	source.connect(analyser);
	//analyser.connect(audioCtx.destination);

	draw(); 

	function draw() {
		let rCtx = window.rCtx;
		const WIDTH = rCtx.canvas.width;
		const HEIGHT = rCtx.canvas.height;

		requestAnimationFrame(draw);

		analyser.getByteTimeDomainData(dataArray);

		rCtx.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
		rCtx.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

		rCtx.canvasCtx.lineWidth = 2;
		rCtx.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

		rCtx.canvasCtx.beginPath();

		let sliceWidth = WIDTH * 1.0 / bufferLength;
		let x = 0;


		for(let i = 0; i < bufferLength; i++) {

			let v = dataArray[i] / 128.0;
			let y = v * HEIGHT/2;

			if(i === 0) {
				rCtx.canvasCtx.moveTo(x, y);
			} else {
				rCtx.canvasCtx.lineTo(x, y);
			}

			x += sliceWidth;
		}

		rCtx.canvasCtx.lineTo(rCtx.canvas.width, rCtx.canvas.height/2);
		rCtx.canvasCtx.stroke();

	}

}

MesiboRecorder.prototype.close = function(){
	MesiboLog("MesiboRecorder.close called", this.stream.getTracks(), this.type);

	this.stream.getTracks().forEach(function(track) {
		MesiboLog('close Track', track); 
		track.stop();    
	});

}


