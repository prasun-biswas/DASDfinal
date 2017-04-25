var WS_Agent = function WS_Agent(name, capability, neighbour, port ) {
    this.name_ = name;
    this.capability_ = capability;
    this.neighbour_ = neighbour;
    this.port_ = port;
    this.hostname_ = "localhost";
};
WS_Agent.prototype.getName = function () {
    return this.name_;
};

WS_Agent.prototype.getCapability = function () {
    return this.capability_;
};
/*
WS_Agent.prototype.getNeighbour = function () {
    return this.neighbour_;
};*/

WS_Agent.prototype.runServer = function () {
    var express = require('express');
    var bodyParser = require('body-parser');
    var request = require('request');

    var port = this.port_;
    var hostname = this.hostname_;
    var WS = this.name_;
    var WSnum = parseInt(port.toString().substr(2,3));

    var app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    var WS_Neighbour = this.neighbour_;
    var currentPallet;
    function setPallet(pallet) {
        currentPallet = pallet;
    }
    function getPallet() {
        return currentPallet;
    }
    var currentStatus = "free";
    function setStatus(stat) {
        currentStatus = stat;
    }
    function getStatus() {
        return currentStatus;
    }
    function palletRequest(url, pallet) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify(pallet),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }
    function simRequest(url) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify({destUrl:'http://hostname'}),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }

    app.post('/'+WS+'notifs', function (req, res) {
        var event = req.body.id;
        var sender = req.body.senderID;
        var destination = [];
        var WS_ID = "WS"+sender.substr(6,2);

        switch (event) {
            case "Z1_Changed": {
                if((getStatus() == "free")||(WS_ID=='WS1')){
                    if (req.body.payload.PalletID != -1) {
                        setStatus("busy");
                        console.log(WS,'Z1changed',currentPallet, getStatus());
                        var path = currentPallet.path_[0];
                        if(currentPallet.path_.length!=0 ){
                            for(var i=0; i<path.length; i++){
                                destination[i] = path[i];
                            }
                        }
                        if(WS_ID == 'WS1'){
                            currentPallet.path_.shift();
                            var url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone12';
                            simRequest(url);
                        }
                        else{
                            if((destination[0] == WS_ID)||(destination[1] == WS_ID)||(destination[2] == WS_ID)||(destination[3] == WS_ID)){
                                currentPallet.path_.shift();
                                var url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone12';
                                simRequest(url);
                            }
                            else{
                                url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                                simRequest(url);
                            }
                        }
                    }
                }
                else{
                    url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                    simRequest(url);
                }
                break;
            }
            case "Z2_Changed": {
                if (req.body.payload.PalletID != -1) {
                    url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone23';
                    simRequest(url);
                }
                break;
            }
            case "Z3_Changed": {
                if (req.body.payload.PalletID != -1) {
                    var palletStatus = currentPallet.status_;
                    switch (palletStatus){
                        case 0 : {
                            url = 'http://localhost:3000/RTU/SimROB1/services/LoadPaper';
                            simRequest(url);
                            break;
                        }
                        case 1: {
                            var frameType = currentPallet.frameType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+frameType;
                            simRequest(url);
                            break;
                        }
                        case 2: {
                            var screenType = currentPallet.screenType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+screenType;
                            simRequest(url);
                            break;
                        }
                        case 3: {
                            var keyType = currentPallet.keyType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+keyType;
                            simRequest(url);
                            break;
                        }
                        default:{
                            palletRequest(WS_Neighbour,currentPallet);
                            url = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                            simRequest(url);
                        }
                    }
                }
                break;
            }
            case "Z4_Changed": {
                if (req.body.payload.PalletID != -1) {
                    currentPallet = getPallet();
                    palletRequest(WS_Neighbour, currentPallet);
                    url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone45';
                    simRequest(url);
                }
                break;
            }
            case "Z5_Changed": {
                if (req.body.payload.PalletID != -1) {
                    setStatus("free");
                }
                break;
            }
            case "PaperLoaded":{
                currentPallet.status_++;
                palletRequest(WS_Neighbour,currentPallet);
                url = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                simRequest(url);
                break;
            }
            case "DrawEndExecution":{
                var recipe = parseInt(req.body.payload.Recipe);
                switch (recipe){
                    case 1:
                    case 2:
                    case 3:{
                        currentPallet.frameType_ = "done" + recipe;
                        break;
                    }
                    case 4:
                    case 5:
                    case 6:{
                        currentPallet.screenType_ = "done" + recipe;
                        break;
                    }
                    case 7:
                    case 8:
                    case 9:{
                        currentPallet.keyType_ = "done" + recipe;
                        break;
                    }
                }
                currentPallet.status_++;
                path = currentPallet.path_[0];
                if(currentPallet.path_.length!=0 ){
                    for(i=0; i<path.length; i++){
                        destination[i] = path[i];
                    }
                }
                if((destination[0] == WS_ID)||(destination[1] == WS_ID)||(destination[2] == WS_ID)||(destination[3] == WS_ID)){
                    currentPallet.path_.shift();
                    if(currentPallet.status_==2){
                        screenType = currentPallet.screenType_;
                        url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+screenType;
                        simRequest(url);
                    }
                    if(currentPallet.status_==3){
                        keyType = currentPallet.keyType_;
                        url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+keyType;
                        simRequest(url);
                    }
                    var screenStat = currentPallet.screenType_.toString();
                    var keyStat = currentPallet.keyType_.toString();
                    if((screenStat.substr(0,4) == "done")&&((keyStat).substr(0,4) == "done")||(keyStat).substr(0,4) == "done"){
                        url = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                        simRequest(url);
                    }
                }
                else{
                    url = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                    simRequest(url);
                }
                palletRequest(WS_Neighbour,currentPallet);
                break;
            }
            default:{
                res.end("ERROR");
            }
        }
        res.end();
    });

    app.post('/'+WS+'pallet', function (req,res) {
        console.log("activity on ",WS," ",req.body);
        setPallet(req.body);
        res.end();
    });
    if (port!=4001){
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z4_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/services/ChangePen'+this.capability_,{form:{destUrl:"http://localhost"}}, function(err,httpResponse,body){});
    }
    else{
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/PaperLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
    }
    app.listen(port, hostname, function(){
        console.log(WS+`Server running at http://${hostname}:${port}/`);
    });
};

module.exports = WS_Agent;