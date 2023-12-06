$(function() {
	'use strict';

	
	console.log('login init');
  $('.form-control').on('input', function() {
	  var $field = $(this).closest('.form-group');
	  if (this.value) {
	    $field.addClass('field--not-empty');
	  } else {
	    $field.removeClass('field--not-empty');
	  }
	});

});

function redirect_messenger() {
	window.location.replace("messenger.html");
}

function login_init() {
	console.log('start login');
	var token = getLoginToken();
	if(token && token.length > 16) {
		redirect_messenger();
		return;
	}
	var mesibo = Mesibo.getInstance();

	document.getElementById("otpdiv").style.display = "none";
	document.getElementById("otp").value = '';
	document.getElementById('phone').readOnly = false;
	document.getElementById("phone").value = '';
	_displayLoginError(null);
}

function login_start() {
	var phone = document.getElementById("phone").value;
	if(!phone || phone.length < 10) {
		_displayLoginError("Invalid Phone Number");
		return "";
	}

	_displayLoginError(null);
	if(phone[0] == '+'){
		phone = phone.substr(1); 
	}

	var otp = document.getElementById("otp").value;
	
	var p = {};
	p['op'] = 'login';
	p['appid'] = MESIBO_APP_ID;
	p['phone'] = phone;

	if(otp && otp.length > 4){
		p['otp'] = otp;
		console.log("gen with otp");
	}
		

	var http = Mesibo.getInstance().createhttpRequest();
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
	
		document.getElementById('phone').readOnly = true;
		document.getElementById("otpdiv").style.display = "block";
		document.getElementById("otp").value = "";

		var token = resp.token;
		if(token && token.length > 16){
			console.log("Login Successfull");

			document.getElementById("phone").innerHTML = null;
			document.getElementById("otp").innerHTML = null;

			saveLoginToken(token);
			redirect_messenger();
		}

        });
}

function _displayLoginError(error) {
	document.getElementById("errmsg").style.display = error?"block":"none";
	if(error)
		document.getElementById("errmsg").value = error;
}


