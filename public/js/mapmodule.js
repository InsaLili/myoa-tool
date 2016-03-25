var mapModule = angular.module("MapModule", ["leaflet-directive"]);

mapModule.controller('DOMCtrl', function($scope, $timeout, DataService){
    var socket = io.connect('http://localhost:8000');

    $scope.range = function(n) {
        return new Array(n);   
    }
    //!!!!todo,delete some var
    getAppData = function(){
        // get location amount
        $scope.locationAmount = DataService.mapstep1.markers.length;
        $scope.studentAmount = parseInt(DataService.studentAmount);
        $scope.groupNum = DataService.groupNum;
        // caculate avatar width based on student amount
        $scope.avatarWidth = Math.round(12/$scope.studentAmount);
        // get markers
        $scope.markers = DataService.mapstep1.markers;
        // get symbol of each location, and change lower case to upper case
        for(var i=0; i<$scope.locationAmount;i++){
            $scope.markers[i].symbol = $scope.markers[i].icon.icon;
            if(isNaN($scope.markers[i].icon.icon)){
                $scope.markers[i].symbol = $scope.markers[i].symbol.toUpperCase();
            }
        }
        // get the type of sequence, and set steps based on the sequence type
        $scope.seqtype = DataService.mapstep2.seqtype;
        if($scope.seqtype == "restricted"){
            $scope.steps = DataService.mapstep2.reseq;
            if($scope.steps.s0.title == undefined){
                delete $scope.steps.s0;
            }else{
                var s0=true;
            }
            if($scope.steps.s3.title == undefined){
                delete $scope.steps.s3;
            }else{
                var s3=true;
            }
            if(s0 && s3){
                $scope.moreSteps = true;
            }
        }else{
            $scope.steps = DataService.mapstep2.unseq;
            if($scope.steps.s0.title == undefined) delete $scope.steps.s0;
            if($scope.steps.s2.title == undefined) delete $scope.steps.s2;
        }
        // get criterias
        $scope.cris = DataService.mapstep1.cris;
        $scope.crisTea = $scope.cris.teacher.length;
        $scope.cris.num = 0;
        // get steps and evalate on which device
        ($scope.steps.s1.eval)?($scope.evaltype = $scope.steps.s1.eval):($scope.evaltype = "group");
        // judge on which device to make the evaluation
        if($scope.evaltype == "individual"){
            $scope.evalDevice = "person";

        }else{
            // evalVal are configed when each alternative would be evaluated once
            if(DataService.mapstep4.share.eval & DataService.mapstep4.person.eval){
                $scope.evalDevice = "both";
            }else if(DataService.mapstep4.share.eval == true){
                $scope.evalDevice = "share";
            }else{
                $scope.evalDevice = "person";
            }
        }
        $scope.evalVal = [];
        // when there is no s0, structure evalVal
        if($scope.steps.s0 == undefined){
            // 没有cris的时候，votes为一维数组
            if($scope.cris.teacher.length == 0){
                $scope.evalVal.length = $scope.locationAmount;
            }else{
                // 有多个cris的时候，votes为二维数组，x维是location，y维是cris
                for(var j=0; j<$scope.locationAmount;j++){
                    var cris = [];
                    cris.length = $scope.cris.teacher.length;
                    $scope.evalVal.push(cris);
                }
            }
            // set the number of the current step, 不让学生添加cris的时候第一步为1
            $scope.currentStep = 1;
        }else{
            // 让学生添加cris的时候，第一步为0
            $scope.currentStep = 0;
        }
        // 判断什么时候可以点击公共屏幕上的星星
        ($scope.evalDevice !== "person" && $scope.currentStep==1)?($scope.clickStar = true):null;

        // get votes
        $scope.votes = DataService.votes.rows[$scope.groupNum-1].doc.votes;
        // when the votes is empty, rebuild it
        // actually, we always need to rebuild the array as the cris might be changed which would influence the dimention of votes

        // get notes
        $scope.notes = DataService.notes.rows[$scope.groupNum-1].doc.notes;
        // get common notes
        $scope.commonNotes = DataService.notes.rows[$scope.groupNum-1].doc.common;
        // caculate the needed number of votes when all evaluation are required
        $scope.allVotes = $scope.studentAmount*($scope.markers.length);
        
        // additional functionalities  to be changed
        $scope.add = DataService.mapsetting.additional;
        // get or store note number, to update badge
        $scope.add.noteNum = Number($scope.add.noteNum);
        // get current group names
        $scope.groupName = DataService.mapsetting.groups[$scope.groupNum-1].name;
        // get relevant information
        $scope.infos = DataService.mapstep1.infos;

        
        // get required number to win the timer badge
        var timerBadgeNum = function(){
            var time=0;
            for(var i=0;i<$scope.steps.length;i++){
                if($scope.steps[i].timerBadge == true)
                    time++;
            }
            if(time>2) time = 2;
            return time;
        }

        $scope.badgeWidth = 12/timerBadgeNum();
    }

    serviceInit = function(){
        var db = new PouchDB('http://localhost:5984/insect');
        //------following parts realize the communication between pages

        // add criteria
        socket.on('addcri', function (data){
           if(data.group !== $scope.groupNum) return;
           $scope.cris.student.push(data.cri);
           $scope.$apply();
        });
        socket.on('deletecri', function (data){
           if(data.group !== $scope.groupNum) return;
           $scope.cris.student = $.grep($scope.cris.student, function(value) {
                return value.id != data.id;
            });
           $scope.$apply();
        });
        // add comment to an alternative
        socket.on('addlocalnote', function (data) {
            if(data.group !== $scope.groupNum) return;
            
            $scope.notes = data.notes;
            $scope.studentNotes[data.player-1]++;
            $scope.$apply();
            console.log($scope.studentNotes);
        });

        // delete comment from alternative
        socket.on('deletelocalnote', function (data) {
            if(data.group !== $scope.groupNum) return;

            $scope.notes = data.notes;
            $scope.studentNotes[data.player-1]--;
            $scope.$apply();
            console.log($scope.studentNotes);
        });

        // add comment to common space
        socket.on('addcommonnote', function (data) {
            if(data.group !== $scope.groupNum) return;

            $scope.commonNotes = data.notes;
            $scope.studentNotes[data.player-1]++;
            $scope.$apply();
            console.log($scope.studentNotes);
        });

        // delete common comment
        socket.on('deletecommonnote', function (data) {
            if(data.group !== $scope.groupNum) return;

            $scope.commonNotes = data.notes;
            $scope.studentNotes[data.player-1]--;
            $scope.$apply();
            console.log($scope.studentNotes);
        });

        // evaluate 
        socket.on('evaluate', function (data){
            if(data.group !== $scope.groupNum) return;

            if($scope.evaltype == 'individual'){
                $scope.evalVal[data.location-1][data.cri][data.player-1] = data.value;
            }else{
                $scope.evalVal[data.location-1][data.cri] = data.value;
            }
            $scope.$apply();
        });
    }

    attachStar = function(){
        $scope.voteAmount=[];
        var progressbarText = $('.player p');

        // filte all the players, i is the number of player
        for(var i=0; i<$scope.studentAmount;i++){
            var player = i+1;
            var votes = $.grep($scope.votes, function(value) {
                return value.player == player;
            });
            var voteNum = votes.length;
            $( "#progressbar"+player ).progressbar({
                value: voteNum
            });
            $(progressbarText[i]).text(voteNum + '/'+$scope.locationAmount+' Emplacements');
            $scope.voteAmount.push(voteNum);
            // check all the location for the i player, change the checkmark color
            for(var j=0; j<voteNum;j++){
                var vote = votes[j];
                var location = vote.location;
                var checkMark = $('#location'+location+' .glyphicon-ok-circle')[i];
                $(checkMark).removeClass('grey');
                $(checkMark).addClass('checked');
            }
        }
        console.log($scope.voteAmount);
    }
    attachHeart = function(){
        $scope.evalVal=[];
        for(var i=1;i<=$scope.locationAmount;i++){
            var locationVote = [];
            var votes = $.grep($scope.votes, function(value){
                return value.location == i;
            });
            for(var j=1;j<=$scope.studentAmount;j++){
                var votePlayer = $.grep(votes, function(value){
                    return value.player == j;
                });
                if(votePlayer.length>0){
                    locationVote.push(votePlayer[0].vote);
                }else{
                    locationVote.push(0);
                }
            }
            $scope.evalVal.push(locationVote);
        }
    }
    attachNotes = function(){
        $scope.studentNotes=[];
        for(var i=0; i<$scope.studentAmount;i++){
            var player = i+1;
            var notes = $.grep($scope.notes, function(value) {
                return value.player == player;
            });
            var commonnotes = $.grep($scope.commonNotes, function(value) {
                return value.player == player;
            });
            var allnote = notes.length+commonnotes.length;
            $scope.studentNotes.push(allnote);
        }
        console.log("notes number");
        console.log($scope.studentNotes);
    }
    dialogInit = function(){
        var steps = $scope.steps.length;
        $( ".dialog").dialog({
            autoOpen: false,
            resizable: false,
            width:600,
            height:420,
            modal: true,
            buttons: {
                "Commencer": function(){
                    $(this).dialog( "close" );
                    var step = Number(this.id.match(/\d/)[0])
                    timerInit(step);
                }
            }
        });
        $( "#chooseDialog").dialog({
            autoOpen: false,
            resizable: false,
            width:600,
            height:420,
            modal: true,
            buttons: {
                "Oui": function() {
                    $( this ).dialog( "close" );
                    confirmChoice();
                },
                "Non": function() {
                    $( this ).dialog( "close" );
                }
            }
        });
        $(".infoDlg").dialog({
            autoOpen: false,
            resizable: true,
            width:600,
            height:420,
            modal: false,
            buttons: {
                "OK": function() {
                    $( this ).dialog( "close" );
                }
            }
        });
    }
    // add a new timer
    timerInit = function(step){
        var num = step-1;
        // if($scope.steps[num].timer == 'true'){
        //     $('#timer'+step).countdown({
        //         image: "/img/digits.png",
        //         format: "mm:ss",
        //         startTime: $scope.steps[num].timerval
        //     });
        // }
    }
    updateStar = function(data){
        $scope.votes = data.votes;
        // if it is not a new vote, do nothing
        if(data.newvote == false){
            return;
        } 
        var location = data.location;
        var player = data.player;
        var id = data.id;
        // add player's vote progress
        $scope.voteAmount[player-1]++;
        // update progressbar
        var voteNum = $scope.voteAmount[player-1];
        var progressbarText = $('.player p');
        $( "#progressbar"+player ).progressbar({
            value: voteNum
        });
        $(progressbarText[player-1]).text(voteNum + '/'+$scope.locationAmount+' Emplacements');
        // update checkmark
        var checkMark = $('#location'+location+' .glyphicon-ok-circle')[player-1];
        $(checkMark).removeClass('grey');
        $(checkMark).addClass('checked');
    }
    updateHeart = function(data){
        $scope.evalVal[data.location-1][data.player-1] = data.value;
        $scope.$apply();
    }

    showVote = function(){
        $scope.evalVal = [];
        var color = ['#d9534f','#ec971f','#31b0d5','#337ab7','#449d44'];
        var caption= ['Très Faible', 'Faible', 'Moyen', 'Bon', 'Très Bon'];
        
        for(var i=0; i<$scope.locationAmount;i++){
            // get all the votes for the same location i
            var votes = $.grep($scope.votes, function(value){
                return value.location == i+1;
            });
            var value=0;
            for(var j=0; j<$scope.studentAmount;j++){
                value += votes[j].vote;
            }
            // get average
            value = Math.round(value/$scope.studentAmount);
            // change star color
            $scope.evalVal.push(value);
            // change caption
            var location = i+1;
            var label = $('#vote'+location+' .caption');
            label.text(caption[value-1]);
            label.css('background-color', color[value-1]);
        }
    }
    confirmChoice = function(){
        $('.location').hide();
        $('#location'+$scope.chosenNum).show();
        $('.chooseLocation').hide();
    }

    $scope.getInfo = function(num){
        $('#infoDlg'+num).dialog('open');
    }
    // nextStep
    $scope.nextStep = function($event, index){
        // skip step 0 when there is no s0
        var step;
        ($scope.steps.s0==undefined)?(step = index+1):(step = index);

        if(step == $scope.currentStep){
            // change the check mark
            var element = $event.target.parentElement;
            $(element.children[0]).removeClass('glyphicon-unchecked');
            $(element.children[0]).addClass('glyphicon-check');
            // change color of next task
            // if(step<$scope.steps.length){
            ($(element.nextElementSibling))?($(element.nextElementSibling.children).css('color', '#E0E0E0')):null;
            // $(element.nextElementSibling.children).css('color', '#E0E0E0');
            // }
            // remove the former timer if it exists
            if($('#timer'+step).length !== 0){
                clearInterval(intervals.main);
                $('#timer'+step).remove();
                if($scope.steps[step-1].timerBadge == true){
                    if(digits[1].current != 9){
                        $scope.steps[step-1].timerWin = true;
                    }else{
                        $scope.steps[step-1].timerWin = false;
                    }
                }
            }
            // reset clickStar
            $scope.clickStar = false;
            // open the dialogue of next step
            var dlgIndex = index+1;
            $('#dialog'+dlgIndex).dialog('open');
            switch (step){
                // to step 1; prepare the array for store vote value
                case 0:
                    // make stars clickable when students are allowed to evaluate on the shared display
                    ($scope.evalDevice !== "person")?($scope.clickStar = true):null;
                    // get the length of the current criteria
                    $scope.cris.num = $scope.cris.teacher.length+$scope.cris.student.length;
                    for(var j=0; j<$scope.locationAmount;j++){
                        var cris = [];
                        // if evluating individually, add the player dimention to the array
                        if($scope.evaltype=="individual"){
                            for(var k=0;k<$scope.cris.num;k++){
                                var crisplayer = [];
                                crisplayer.length = $scope.studentAmount;
                                cris.push(crisplayer);
                            }
                        }
                        $scope.evalVal.push(cris);
                    }
                    break;
                case 1:
                    // ($scope.evaltype == "individual")?(showVote()):null;
                    $(".chooseLocation").show();
                    break;
                case 2: 
                    break;
                case 3:
                    break;
            }
            
            $scope.currentStep++;
            socket.emit("changestep", {group: $scope.groupNum, step:$scope.currentStep});
        }
    }
        // submit evaluation of one location
    $scope.changeEval = function(locationNum,criNum,value){
        $scope.evalVal[locationNum][criNum] = value;
        
        // socket.emit('voteOnShare', {group: $scope.groupNum, location: locationNum, cri: criNum, value: value});
    }
    $scope.checkLocation = function($event,marker,player){
        var socket = io.connect('http://localhost:8000');
    	console.log(marker,player);
        // in s0, cris.num always equal to 0, so vote=[]
        var vote = [];
        for(var i=0; i<$scope.cris.num;i++){
            var value;
            ($scope.evaltype == "individual")?(value=$scope.evalVal[marker-1][i][player]):(value=$scope.evalVal[marker-1][i])
            vote.push(value);
        }
        socket.emit('checklocation', { location: marker, player: player, group: $scope.groupNum, vote: vote});

        var element = $event.currentTarget;
        var className = element.className;
        var elements = document.getElementsByClassName(className);
        $(elements).css({'background-color': '#5bc0de', 'border-color': '#46b8da'});
        $(element).css({'background-color': '#f0ad4e', 'border-color': '#eea236'});
        $($(elements)[marker-1]).css({'background-color': '#f0ad4e', 'border-color': '#eea236'});
    }    
    $scope.chooseLocation = function(marker,name){
    	console.log(marker,name);
        $scope.chosenTitle = name;
        $scope.chosenNum = marker;
        $('#chooseDialog').dialog('open');
    }
    init = function(){
        // get data and initialize service
        getAppData();
        serviceInit();
        attachNotes();
    }
    // wait for dom ready
    $timeout(function(){
        // initiate progress bar
        for(var i=0; i<$scope.studentAmount;i++){
            var num = i+1;
            $( "#progressbar"+num ).progressbar({
            max: $scope.locationAmount
        });
        }
        $( ".progressbar" ).on( "progressbarcomplete", function( event, ui ) {
            $scope.allRating++;
        });
        $('.location').touch();
        $('#commonSpace').touch();
        $("#step0 p").css('color', '#E0E0E0');
        $("#step0 span").css('color', '#E0E0E0');
        // $(".chooseLocation").hide();

        if($scope.add.eval == 'star'){
            attachStar();
        }else if($scope.add.eval == 'heart'){
            attachHeart();
        }

        dialogInit();
        $('#dialog0').dialog('open');
    });

    init();
});

mapModule.controller("MapCtrl", [ "$scope", "$http", "DataService",function($scope, $http, DataService) {
    var mapsetting = DataService.mapsetting;
    var socket = io.connect('http://localhost:8000');

    $scope.map = DataService.mapstep1.map;
    $scope.markers = DataService.mapstep1.markers;
    $scope.commonSpace = mapsetting.additional.commonspace;
    angular.extend($scope, {
        tiles: {
            name: 'MYOA',
            url: 'http://api.tiles.mapbox.com/v4/{mapid}/{z}/{x}/{y}.png?access_token={apikey}',
            type: 'xyz',
            options: {
                apikey: 'pk.eyJ1IjoiaW5zYWxpbGkiLCJhIjoickF1VzlYVSJ9.JH9ZrV76fbU5Ub9ZgBhNCw',
                mapid: 'insalili.meikk0a8'
            }
        },
        geojson: {},
    });

    $http.get("data/map.geo.json").success(function(data){
        $scope.geojson.data = data;
    });

    $scope.addMarkerMsg = function(){
        var locationAmount = $scope.markers.length;
        var studentAmount = parseInt(DataService.studentAmount);
        var browse = DataService.mapstep4.share.browse;
        for(var i=0; i<locationAmount;i++){
            var num = i+1;
            var message = '<div id="marker'+num+'" class="mapMarker"><h3>'+$scope.markers[i].name+'</h3>';
            if($scope.markers[i].photo !== undefined){
                message += '<img class="markerImg" src="'+$scope.markers[i].photo+'" />';
            }
            // if let students browse information on markers, then hide the avatar inside the marker
            if(browse == true){
                message += '<p class="markerInfo">'+$scope.markers[i].data+'</p>';
            }else{
                for(var j=1; j<=studentAmount;j++){
                    message += '<button type="button" class="btn player'+j+' markerBtn" ng-click="checkLocation($event,'+num+','+j+')"><img src="/img/player'+j+'.png"></button>'
                }
            }
            message += '</div>';
            $scope.markers[i].getMessageScope = function(){return $scope;};
            $scope.markers[i].message = message;
            $scope.markers[i].compileMessage = true;
            $scope.markers[i].draggable = false;

        }
    }

    $scope.checkLocation = function($event,marker,player){
        console.log(marker,player);
        socket.emit('checklocation', { marker: marker, player: player, group: $scope.groupNum});

        var element = $event.currentTarget;
        var className = element.className;
        var elements = document.getElementsByClassName(className);
        $(elements).css({'background-color': '#5bc0de', 'border-color': '#46b8da'});
        $(element).css({'background-color': '#f0ad4e', 'border-color': '#eea236'});
        $($(elements)[marker-1]).css({'background-color': '#f0ad4e', 'border-color': '#eea236'});
    }
    $scope.addMarkerMsg();
}]);