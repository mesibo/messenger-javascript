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

let getFileType = (f) =>{

    var type = f.filetype;
    if(undefined == type)
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

    return fileType;

}

let isSentMessage = (status) =>{
        if((status === MESIBO_MSGSTATUS_RECEIVEDREAD) || (status === MESIBO_MSGSTATUS_RECEIVEDNEW))
            return false;
        else
            return true;
};


//For debugging purposes only
let getScope = () =>{
        return angular.element(document.getElementById('mesibowebapp')).scope();
}

let imgError = (image) => {
    MesiboLog("imgError");
    image.onerror = "";
    image.src = MESIBO_DEFAULT_PROFILE_IMAGE;
    return true;
}





