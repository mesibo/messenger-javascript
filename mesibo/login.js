//login.js

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

function sendRequest(url, callback, postData) {
    var req = createXMLHTTPObject();
    if (!req) return;

    var usePost = true;

    if(req.setRequestHeader == 'undefined' || typeof req.setRequestHeader == 'undefined')
        usePost = false;

    var method = (postData && usePost) ? "POST" : "GET";

    if(postData) {
        if(!usePost) {
            url = url + '?' + postData;
            postData = null;
        }
    }

    req.open(method, url, true);
    if (postData && typeof(postData) != 'object') {
        req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
    }

    req['processed'] = false;
    function onData() {
            if(callback && !req.processed) {
            req.processed = true;
            callback(req.responseText);
            }
    }
    
    if(req.onload != 'undefined' && typeof req.onload != 'undefined')
        req.onload = onData;   

    req.onreadystatechange = function () {
        if (req.readyState != 4) return;
        if (req.status != 200 && req.status != 304) {
         // alert('HTTP error ' + req.status);
            return;
        }

        if(callback && !req.processed) {
            req.processed = true;
            callback(req.response);
        }
    }

    //http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
    if (typeof XDomainRequest != 'undefined') {
        req.onprogress = function () { };
        req.ontimeout = function () { };
        req.onerror = function () { };
        if (req.readyState == 4) return;

        setTimeout(function(){ req.send(); }, 0);
        return;
    }

    if (req.readyState == 4) return;
    req.send(postData);
}

var XMLHttpFactories = [
    function () {return new XDomainRequest();},
    function () {return new XMLHttpRequest()},
    function () {return new ActiveXObject("Microsoft.XMLHTTP")},
    function () {return new ActiveXObject("Msxml2.XMLHTTP")},
    function () {return new ActiveXObject("Msxml3.XMLHTTP")}
];

function createXMLHTTPObject() {
    var xmlhttp = false;
    for (var i=0;i<XMLHttpFactories.length;i++) {
        try {
            xmlhttp = XMLHttpFactories[i]();
        }
        catch (e) {
            continue;
        }
        break;
    }
    return xmlhttp;
}



  function _getPhoneNumber(){
    var phone = document.getElementById("phone").value;
    if(!phone)
      return "";

    //xxx:Validate Phone Number
    if(phone[0] == '+'){
        phone = phone.substr(1); //Strip +
    }
    
    return phone;
  }

  function _getVerificationCode(){
    var code = document.getElementById("otp").value;
    if(!isValidString(code))
      return "";

    //xxx:Validate code
    return code;
  }

  function _getAppId(){
    if(!isValidString(MESIBO_APP_ID))
      return "";

    return MESIBO_APP_ID;
  }

  function getMesiboDemoAppToken() {
      var appid = _getAppId();
      var phone = _getPhoneNumber();
      var code = _getVerificationCode();
      console.log("appid", appid, "phone", phone, "code", code);

      if(isValidString(code)){
          //Login with OTP
          console.log("gen with otp");
          sendRequest(MESIBO_API_URL, appCallback, "op=login&phone=" + phone + "&appid=" + appid + "&code=" + code);
      }
      else if(isValidString(phone)){
          //Register Phone to get OTP
          sendRequest(MESIBO_API_URL, appCallback, "op=login&phone=" + phone + "&appid=" + appid);
          document.getElementById('phone').readOnly = true;
          document.getElementById("otp-input").style.display = "block";
          document.getElementById("otp").innerHTML = "";
        }

  }

  function _displayLoginError(error) {
    alert("Login Error: " + error + "\n Please ensure you have entered a valid phone number & otp");
  }

  function appCallback(r) { 
    
    var resp = JSON.parse(r);
    var token = resp['token'];
    if(resp.result == "OK"){
        if(isValidString(token)){
            console.log("Login Successfull");

            document.getElementById("phone").innerHTML = null;
            document.getElementById("otp").innerHTML = null;

            $('#ModalLoginForm').modal('hide');
            MESIBO_ACCESS_TOKEN = token;
            setTokenInStorage(token);

            //Launch Messenger Application
            launchMessenger();
        }
    }
    else{
        console.log(resp);
        _displayLoginError(resp.result);
      }
  }

  function loadLoginWindow(){
    $('#ModalLoginForm').modal({backdrop: 'static', keyboard: false});
    document.getElementById("otp-input").style.display = "none";
    document.getElementById("otp").innerHTML = null; 
  }

  function setTokenInStorage(token){
    if(!isValidString(token))
      return -1;

    localStorage.setItem("MESIBO_MESSENGER_TOKEN", token);
    return 0;
  }
 
  function deleteTokenInStorage(){
    localStorage.removeItem("MESIBO_MESSENGER_TOKEN");
  }

  function getTokenFromStorage(){
    var token = localStorage.getItem("MESIBO_MESSENGER_TOKEN");
    if(!isValidString(token))
      return "";

    return token;
  }
