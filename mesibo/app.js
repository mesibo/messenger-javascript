//app.js

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



function MesiboApp(s) {
	// MesiboLog('MesiboApp', s);
	this.scope = s;
	this.api = {};
	this.init();
}

MesiboApp.prototype.init = function() {
	this.api = this.scope.getMesibo();
}

MesiboApp.prototype.displayContacts = function(contacts){
	if(!contacts)	
		return -1;
	this.scope.setAvailableUsers(contacts);
	return 0;
};

MesiboApp.prototype.fetchContacts = async function(userToken, ts, phones, reset) {
	MesiboLog("fetchContacts called", phones);

	if(!userToken)
		return -1;

	if(!(phones && phones.length))	
		phones = [];

	if(!MESIBO_API_URL)
		return -1;

	//Request to back-end service, to fetch contact details and profile details
	var request = MESIBO_API_URL + '?op=getcontacts&token=' + userToken + '&ts=' + ts+ '&phones='+ phones;
	if(reset)
		request += '&reset=1';

	var response = await fetch(request);

	if(!response)
		return -1;

	try{
		response = await response.json(); //extract JSON from the HTTP response
		MesiboLog(response);
	}
	catch(e){
		MesiboLog("Error: fetchContacts", e);
	}

	if(response.result != "OK"){
		MesiboLog("Error: fetchContacts: getcontacts request failed");	
		return -1;
	}
	
	if(response.u){
		this.scope.setSelfProfile(response.u);
	}

	MESIBO_DOWNLOAD_URL =  response['urls']['download'];      
	MESIBO_UPLOAD_URL =  response['urls']['upload'] ;


	var contacts = response.contacts;
	if(!(contacts && contacts.length))
		return -1;

	var available_contacts =  []; 

	contacts.forEach((elem, index) => {                   

		var c = {};
		c.address = elem.phone;
		c.groupid = parseInt(elem.gid);
		c.picture = elem.photo;
		c.name = elem.name;
		c.ts = parseInt(elem.ts);
		c.status = elem.status;
		if(c.groupid!=0)
			c.members = elem.members;

		var rv = this.api.setContact(c);

		available_contacts.push(c);

	});

	MesiboLog(available_contacts);
	if(-1 == this.displayContacts(available_contacts)){
		MesiboLog("Error: fetchContacts: displayContacts failed");
		return MESIBO_RESULT_FAIL;
	}

	MesiboLog("fetchContacts successfull");
}




