//ui.js

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

const MESIBO_FILETYPE_IMAGE = 1;
const MESIBO_FILETYPE_VIDEO = 2;
const MESIBO_FILETYPE_AUDIO = 3;
const MESIBO_FILETYPE_LOCATION = 4;

// Get the matching status tick icon
let getStatusClass = (status) => {
        // MesiboLog("getStatusClass", status);
        var statusTick = "";
        switch (status) {

                case MESIBO_MSGSTATUS_SENT:
                        statusTick = "far fa-check-circle";
                        break;

                case MESIBO_MSGSTATUS_DELIVERED:
                        statusTick = "fas fa-check-circle";
                        break;


                case MESIBO_MSGSTATUS_READ:
                        statusTick = "fas fa-check-circle";
                        break;

                default:
                        statusTick = "far fa-clock";
        }

        //MESIBO_MSGSTATUS_FAIL is 0x80
        if(status > 127) 
            statusTick = "fas fa-exclamation-circle";

        return statusTick;
};


// If the status value is read type, color it blue. Default color of status icon is gray
let getStatusColor = (status) => {
        var statusColor = "";
        switch (status) {
                case MESIBO_MSGSTATUS_READ:
                        statusColor = "#34b7f1";
                        break;

                default:
                        statusColor = "grey";
        }
        //MESIBO_MSGSTATUS_FAIL is 0x80
        if(status > 127) 
            statusColor = "red";

        return statusColor;
};

let getFileIcon = (f) =>{

    if(!isValid(f))
	return;

    var type = f.filetype;
    if(undefined == type)
        return "";


    var fileIcon = "fas fa-paperclip";
    switch (type) {

            //Image
            case MESIBO_FILETYPE_IMAGE:
                    fileIcon = "fas fa-image";
                    break;

            //Video
            case MESIBO_FILETYPE_VIDEO:
                    fileIcon = "fas fa-video";
                    break;

            //Audio
            case MESIBO_FILETYPE_AUDIO:
                    fileIcon = "fas fa-music";
                    break;

            //Location
            case MESIBO_FILETYPE_LOCATION:
                    fileIcon = "fas fa-map-marker-alt";
    }

    return fileIcon;

}

let getFileTypeDescription = (f) =>{

    var type = f.filetype;
    if(!isValid(type))
        return "";

    var fileType = "Attachment";
    switch (type) {

            //Image
            case MESIBO_FILETYPE_IMAGE:
                    fileType = "Image";
                    break;

            //Video
            case MESIBO_FILETYPE_VIDEO:
                    fileType = "Video";
                    break;

            //Audio
            case MESIBO_FILETYPE_AUDIO:
                    fileType = "Audio";
                    break;

            //Location
            case MESIBO_FILETYPE_LOCATION:
                    fileType = "Location";
    }

    //xxTODOxx: For link preview
    // if(isValidString(f.launchurl))
    //     filetype = "Link"

    return fileType;

}

let isSentMessage = (status) =>{
        if(status == MESIBO_MSGSTATUS_RECEIVEDREAD  || status == MESIBO_MSGSTATUS_RECEIVEDNEW)
            return false;
        else
            return true;
};


let imgError = (image) => {
    MesiboLog("imgError");
    image.onerror = "";
    image.src = MESIBO_DEFAULT_PROFILE_IMAGE;
    return true;
}

/*** For debugging purposes only **/
let getScope = () =>{
    return angular.element(document.getElementById('mesibowebapp')).scope();
}

/** For testing link preview **/ 
let getSampleLinkPreview = () =>{
    var linkPreview = {};
    linkPreview.title = "Chat API and SDK for Messaging, Voice and Video Call | Android, iOS and Website | mesibo";
    linkPreview.image = "https://mesibo.com/assets/images/mesibo-favicon.png";
    linkPreview.description = "mesibo is a real-time communication platform, provides chat API and messaging SDK to add messaging, voice and video calls in Android & iOS apps and websites. It is Free to start."; 
    linkPreview.hostname = "mesibo.com";
    linkPreview.url = "https://mesibo.com/";
    
    return linkPreview;
}


let scrollToEnd = (animate) =>{
    var objDiv = document.getElementById("messages");
    if(!objDiv)
        return;

    // MesiboLog("Scroll to last", objDiv, objDiv.scrollTop);
    if(animate)        
        $("#messages").animate({ scrollTop: objDiv.scrollHeight}, 800);
    else
        objDiv.scrollTop = objDiv.scrollHeight;


}



let adjustImageDims = (e)=>{

    // MesiboLog("adjustImageDims", e);
    if(!e)
        return;


    var w = e.width;
    var h = e.height;


    if(!(w && h))
        return;

    var ar = w/h;

    if(ar < 1){
        // MesiboLog("adjustImageDims", e.style.maxWidth);
        e.style.objectFit = "cover";
    }

}


let adjustVideoDims = (e)=>{
    
    // MesiboLog("adjustVideoDims", e);
    if(!e)
        return;

    var w = e.videoWidth;
    var h = e.videoHeight;

    if(!(w && h))
        return;


    var ar = w/h;

    if(ar < 1){
        // MesiboLog("adjustImageDims", e.style.maxWidth);
        e.style.objectFit = "cover";
    }
}

