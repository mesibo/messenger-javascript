//login.js

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

function getMesiboDemoAppToken(api) {
	var p = {};
	p['op'] = 'login';
	p['appid'] = _getAppId();
	p['phone'] = _getPhoneNumber();
	var otp = _getVerificationCode();

	if(isValidString(otp)){
		p['otp'] = otp;
		//Login with OTP
		console.log("gen with otp");
	}
	else if(isValidString(phone)){
		//Register Phone to get OTP
		document.getElementById('phone').readOnly = true;
		document.getElementById("otp-input").style.display = "block";
		document.getElementById("otp").innerHTML = "";
	}

	var http = api.createhttpRequest();
	http.setUrl(MESSENGER_API_URL);
        http.setPostData(p, true);
        http.send(null, function(cbdata, response) {
                console.log(response);
		var resp = JSON.parse(response);
		if(resp.result != "OK") {
			console.log(resp);
			_displayLoginError(resp.result);
			return;
		}

		var token = resp.token;
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

        });
}

function _displayLoginError(error) {
	alert("Login Error: " + error + "\n Please ensure you have entered a valid phone number & otp");
}

function loadLoginWindow(){
	$('#ModalLoginForm').modal({backdrop: 'static', keyboard: false});
	document.getElementById("otp-input").style.display = "none";
	document.getElementById("otp").innerHTML = null; 
}

