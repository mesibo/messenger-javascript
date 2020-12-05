// files.js

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

const MESIBO_FILETYPE_OTHER = 10;

function MesiboFile(s) {
	this.scope = s;
	this.api ={};
	this.init();
}

MesiboFile.prototype.init = function(){
	this.api = this.scope.getMesibo();
}


MesiboFile.prototype.getFileType = function(filename){

	if(isValidFileType(filename, 'image'))
		return MESIBO_FILETYPE_IMAGE;
	else if(isValidFileType(filename, 'video'))
		return MESIBO_FILETYPE_VIDEO;
	else if(isValidFileType(filename, 'audio'))
		return MESIBO_FILETYPE_AUDIO;

	return MESIBO_FILETYPE_OTHER;
}

//Send files like image, video, documents, etc
MesiboFile.prototype.sendFile = function(pFileType, pFileurl, pThumbnail, pFileName){

	if(!pFileurl)
		return;

	var m = {};
	m.id = this.api.random();
	m.peer = this.scope.selected_user.address; 
	m.groupid = this.scope.selected_user.groupid;
	m.flag = MESIBO_FLAG_DEFAULT;	
	
	var f = {}
	f.filetype = pFileType;
	f.fileurl = pFileurl;
	if(pFileName)
			f.title = pFileName;

	if(pThumbnail)
		f.tn = pThumbnail;
	if(this.scope.input_file_caption!=""){
		f.message = this.scope.input_file_caption;		
	}

	MesiboLog("---Sending File---", m, m.id, f);
	this.api.sendFile(m, m.id, f);

	this.scope.input_file_caption = "";

}

MesiboFile.prototype.dataURItoBlob = function(dataURI) {
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
MesiboFile.prototype.sendResizedImage = function(file, max_width, max_height, imageEncoding, imgUrl, filename) {
	var fileLoader = new FileReader()
		, canvas = document.createElement('canvas')
		, context = null
		, imageObj = new Image()
		, blob = null;

	//create a hidden canvas object we can use to create the new resized image data
	canvas.id = "hiddenCanvas";
	canvas.width = max_width;
	canvas.height = max_height;
	canvas.style.visibility = "hidden";
	document.body.appendChild(canvas);

	//get the context to use 
	context = canvas.getContext('2d');

	// check for an image then
	//trigger the file loader to get the data from the image 	     
	if (file.type.match('image.*')) {
		fileLoader.readAsDataURL(file);
	} else {
		console.log("file.type", file.type, file) 
		alert('File is not an image')		  
	}

	// setup the file loader onload function
	// once the file loader has the data it passes it to the 
	// image object which, once the image has loaded, 
	// triggers the images onload function
	fileLoader.onload = function() {
		var data = this.result;
		imageObj.src = data;
	};

	fileLoader.onabort = function() {
		alert("The upload was aborted.");
	};

	fileLoader.onerror = function() {
		alert("An error occured while reading the file.");
	};

	const mesiboFileCtx = this;
	// set up the images onload function which clears the hidden canvas context, 
	// draws the new image then gets the blob data from it
	imageObj.onload = function() {

		// Check for empty images
		if (0 == this.width || 0 == this.height) {
			alert('Image is empty');
		} else {

			context.clearRect(0, 0, max_width, max_height);
			context.drawImage(imageObj, 0, 0, this.width, this.height, 0, 0, max_width, max_height);
			
			MesiboLog(mesiboFileCtx);
			blob = mesiboFileCtx.dataURItoBlob(canvas.toDataURL(imageEncoding));
			mesiboFileCtx.sendWithThumbnail(blob, imgUrl, filename)

		}
	};

	imageObj.onabort = function() {
		alert("Image load was aborted.");
	};

	imageObj.onerror = function() {
		alert("An error occured while loading image.");
	};

}



MesiboFile.prototype.uploadSendFile = async function() {

	var f = this.scope.selected_file;
	MesiboLog(f.name, f);
	if(!f.name)
		return -1;
	
	//TODO: Validate file type before proceeding.
	const formData = new FormData();

	formData.append('file', f, f.name);

	MesiboLog("Uploading file...", formData.getAll('file'));

	const options = {
		method: 'POST'
		, body: formData,

	};

	MesiboLog("File upload options:", options);

	const response = await fetch(MESIBO_UPLOAD_URL + '?op=upload&token=' + MESIBO_ACCESS_TOKEN
		, options);

	const file_upload_response = await response.json();
	MesiboLog(file_upload_response);
	const file_url = file_upload_response['file'];
	if(!file_url){
		alert("Failed to upload file.");
		return -1;
	}

	MesiboLog(file_url, f.name);
	//For Image
	if(1 == this.getFileType(f.name)){
		this.sendResizedImage(f, 20, 20, 'base64', file_url, f.name); //Compression required
	}
	else{
		this.sendFile(this.getFileType(f.name), file_url, null, f.name);
		// this.scope.scrollToLastMsg();
		scrollToEnd(true);
	}	
}

MesiboFile.prototype.getLinkPreviewJson = async function(pUrl,pPreviewEndpoint, pServiceKey){
	
	if(!isValidString(pUrl))
		return null; 
	
	if(!isValidString(pPreviewEndpoint)){
		MesiboLog("Invalid link preview service");
        return null; 
	}
	
	if(!isValidString(pServiceKey)){
		MesiboLog("Invalid link preview access key");
		return null; 
	}

	//Request to link preview service
    const linkPreviewResponse = await fetch(pPreviewEndpoint+ '?key=' + pServiceKey + '&q=' + pUrl);
    const linkPreviewJson = await linkPreviewResponse.json(); 
	
	if(!isValidString(linkPreviewJson.title))
		MesiboLog("Invalid title in linkPreviewJson");

	if(!isValidString(linkPreviewJson.description))
		MesiboLog("Invalid description in linkPreviewJson");

	if(!isValidString(linkPreviewJson.image)){
		MesiboLog("Invalid image in linkPreviewJson");
		linkPreviewJson.image = LINK_DEFAULT_IMAGE;
	}

	if(!isValidString(linkPreviewJson.url))
		MesiboLog("Invalid url in linkPreviewJson");

	if(isValidString(linkPreviewJson.url))
		linkPreviewJson.hostname = linkPreviewJson.url.replace('http://','').replace('https://','').split(/[/?#]/)[0];

	
	if(linkPreviewJson.error){
		//Fatal error
		MesiboLog("Error in link preview: ", linkPreviewJson.error);
		return null; 
	}
	
	return linkPreviewJson;
}

MesiboFile.prototype.sendMessageWithUrlPreview = function(linkPreview, messageParams) {
	if(isValid(linkPreview) && isValid(messageParams)){
		var urlAsfile = {};
		//xx TODO xx Special code for link type is probably required
		const MESIBO_FILETYPE_IMAGE = 1;
		urlAsfile.filetype = MESIBO_FILETYPE_IMAGE;
		urlAsfile.fileurl = linkPreview.image;
		// urlAsfile.tn = []; //Get Thumbnail if required
		urlAsfile.title = linkPreview.title;
		urlAsfile.launchurl = linkPreview.url;

		MesiboLog(messageParams, messageParams.id, urlAsfile);
		this.api.sendFile(messageParams, messageParams.id, urlAsfile);
		this.scope.link_preview = null;	
		this.scope.refresh();	
	}
	else
		MesiboLog("Error: sendMessageWithUrlPreview: Invalid linkPreview");
}

MesiboFile.prototype.sendWithThumbnail = function(blob, imgUrl, filename) {
	const mesiboFileCtx = this;
	var reader = new FileReader();
	reader.onloadend = function() {
		var tn_array = new Uint8Array(reader.result); //reader.result from base64
		mesiboFileCtx.sendFile(1, imgUrl, tn_array, filename); //Sending Image
	}
	reader.readAsArrayBuffer(blob);
}



