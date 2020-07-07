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
    if(!isValidString(phone))
      return "";

    //xxx:Validate Phone Number
    if(phone[0] != '+'){
        alert("Enter phone number with country code, (without spaces) starting with + .Example, if country code is 91 enter: +91XXXXXXXXXX");
        return "";
    }
    phone = phone.substr(1); //Strip +
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
          sendRequest("https://app.mesibo.com/api.php", appCallback, "op=login&phone=" + phone + "&appid=" + appid + "&code=" + code);
      }
      else if(isValidString(phone)){
          //Register Phone to get OTP
          sendRequest("https://app.mesibo.com/api.php", appCallback, "op=login&phone=" + phone + "&appid=" + appid);
          document.getElementById('phone').readOnly = true;
          document.getElementById("otp-input").style.display = "block";
          document.getElementById("otp").innerHTML = "";
        }

  }

  function _displayLoginError(error) {
    alert("Login Error: " + error);
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
    localStorage.removeItem("MESIBO_MESSENGER_TOKEN")
  }

  function getTokenFromStorage(){
    var token = localStorage.getItem("MESIBO_MESSENGER_TOKEN");
    if(!isValidString(token))
      return "";

    return token;
  }
