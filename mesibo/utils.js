//utils.js

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
 * https://github.com/mesibo/samples/js-beta
 *
 *
 */

let decodeString = (s) => {
	// console.log(s);
	if(!s)
		return "";
	return new TextDecoder("utf-8").decode(s);
};

let isValidString = (ele)=>{
        return isValid(ele) && ""!=ele;
};

// One validation function for all file types    
let isValidFileType = (fName, fType)=> {
    var extensionLists = {}; //Create an object for all extension lists
    extensionLists.video = ['m4v', 'avi', 'mpg', 'mp4', 'webm', 'wmv', 'mov', 'qt', 'mkv', 'flv', 'mpeg', 'm2v', '3gp'];
    extensionLists.image = ['jpg', 'jpeg', 'gif', 'bmp', 'png', 'webp', 'svg', 'ico', 'tif', 'tiff'];
    extensionLists.audio = ['mp3', 'mp4', 'aac', 'flac', 'm4a', 'wav','wva', 'ogg', 'pcm'];
    extensionLists.document = ['doc', 'txt', 'pdf', 'docx', 'xls', 'xlx'];
    return extensionLists[fType].indexOf(fName.split('.').pop()) > -1;
}

let isValid = (ele)=>{
        return null!=ele && undefined!=ele;
};

let isValidImage = (fName) =>{
    if(!fName)
        return false;
        
    return isValidFileType(fName, 'image');
};

let isValidVideo = (fName) =>{
    if(!fName)
        return false;
        
    return isValidFileType(fName, 'video');
};

let isGroup = (user) => {
        if(!isValid(user))
            return false;

        if(undefined == user.getGroupId())
            return false;

        return (user.getGroupId() > 0);
}

const getUrlInText = (text) => {
        //This function returns the first url it finds in text, empty string if no url is found
        if(!isValidString(text))
                return "";
        var matches = text.match(/\bhttps?:\/\/\S+/gi);
        if(!isValid(matches) || matches.length == 0)
                return "";

        return matches[0];
}



