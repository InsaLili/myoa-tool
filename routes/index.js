/**
 * Created by Lili on 09/04/15.
 */
/* GET Userlist page. */

var express = require('express');
var router = express.Router();
var PouchDB = require('pouchdb');
// store name of students
var names=[];
for(var n=0;n<4;n++){
    var groupName = [];
    names.push(groupName);
}
// store data of each group
var group1 = [];
var group2 = [];
var group3 = [];
var group4 = [];
//store all groups' averages
var allData = [];
//flag of how many groups update data
var allGroupNum = [0,0,0,0];
router.get('/upload', function(req, res){
	console.log("------new player------");
    fetchData(req.query);
});
//get one player data from url
function fetchData(data){
    console.log(data);
//    parse data
    var group = parseInt(data.group);
    var player = data.player;
    // store player's name
    var name = data.name;
    names[group-1][player-1] = name;

    var light = data.light.split('_');
    var wind = data.wind.split('_');
    var tem = data.tem.split('_');
    var nitrate = data.nitrate.split('_');

//    store this player's data by different type of measure
    var groupData = [];
    groupData[0] = light;
    groupData[1] = wind;
    groupData[2] = tem;
    groupData[3] = nitrate;
    console.log("group number"+group);
//    write them to corresponding group array
//    as soon as one group is completed, calculate the average, meanwhile add the group number
    switch (group){
        case 1:
            group1[player-1] = groupData;
            console.log(group1);
            if((typeof group1[0] !== 'undefined')&&(typeof group1[1] !== 'undefined')&&(typeof group1[2] !== 'undefined')){
                averageData(group1, group);
                allGroupNum[0]=1;
            }
            break;
        case 2:
            group2[player-1] = groupData;
            console.log(group2);
            if((typeof group2[0] !== 'undefined')&&(typeof group2[1] !== 'undefined')&&(typeof group2[2] !== 'undefined')){
                averageData(group2, group);
                allGroupNum[1]=1;
            }
            break;
        case 3:
            group3[player-1] = groupData;
            console.log(group3);
            if((typeof group3[0] !== 'undefined')&&(typeof group3[1] !== 'undefined')&&(typeof group3[2] !== 'undefined')){
                averageData(group3, group);
                allGroupNum[2]=1;
            }
            break;
        case 4:
            group4[player-1] = groupData;
            console.log(group4);
            if((typeof group4[0] !== 'undefined')&&(typeof group4[1] !== 'undefined')&&(typeof group4[2] !== 'undefined')&&(typeof group4[3] !== 'undefined')){
                averageData(group4, group);
                allGroupNum[3]=1;
            }
            break;
    }
//    when all groups have updated their data, calculate the average of groups. The average group is group n°5.
    var sum = 0;
    for( var i = 0; i < allGroupNum.length; i++ ){
        sum += allGroupNum[i]; 
    }
    if(sum == 4){
        fetchAllData();
    }
}

//calculate the average of one group
function averageData(group, groupNum){
    console.log("average data of one group");
    console.log("group number"+groupNum);
    console.log(group);
    var player1 = group[0];
    var player2 = group[1];
    var player3 = group[2];
    if(group[3] !== undefined){
        var player4 = group[3];
    }

    var data=[];
//    i means each type of measure, 1=light, 2=wind, 3=tem, 4=nitrate
    for(var i=0; i<4; i++){
        var location=[];
//        j means each location. We have five locations to update
        for(var j=0; j<5; j++){
//            get one measure result on one location of three players, then put them into an array
            if(player3==undefined){
                var value = [parseFloat(player1[i][j]), parseFloat(player2[i][j]), parseFloat(player3[i][j])];
            }else{
                var value = [parseFloat(player1[i][j]), parseFloat(player2[i][j]), parseFloat(player3[i][j])];
            }
            var count = 0;
            var totalValue = 0;
//            if value isNaN, exclude it
            for(var k=0; k<value.length; k++){
                if(isNaN(value[k])){
                    value[k]=0;
                }else{
                    totalValue += value[k];
                    count++;
                }
            }
            if(count == 0){
                location[j] = "X";
            }else{
                var avgValue = totalValue/count;
//                set the format of each measure result
                switch (i){
                    case 0:
                        location[j] = Math.round(avgValue)+'Lux';
                        break;
                    case 1:
                        location[j] = avgValue.toFixed(1)+'km/h';
                        break;
                    case 2:
                        location[j] = avgValue.toFixed(1)+'°C';
                        break;
                    case 3:
                        location[j] = avgValue.toFixed(1)+'mg/L';
                        break;
                }
            }
        }
//        data[i] contains each location's average of i type of measure
//        data contains all measure result average on all locations of one group
        data[i] = location;
    }
    console.log("average one group");
    console.log(data);
    allData[groupNum-1] = data;
    console.log("all data");
    console.log(allData);
    // uploadDB(groupNum, data);

}

//calculate the average of one group
function fetchAllData(){
    console.log("average data for all groups");
    console.log(allData);
    var group1 = allData[0];
    var group2 = allData[1];
    var group3 = allData[2];
    var group4 = allData[3];

    var data=[];
//    i means each type of measure, 1=light, 2=wind, 3=tem, 4=nitrate
    for(var i=0; i<4; i++){
        var location=[];
//        j means each location. We have five locations to update
        for(var j=0; j<5; j++){
//            get one measure result on one location of three players, then put them into an array
            var value = [parseFloat(group1[i][j]), parseFloat(group2[i][j]), parseFloat(group3[i][j]), parseFloat(group4[i][j])];
            var count = 0;
            var totalValue = 0;
//            if value isNaN, exclude it
            for(var k=0; k<value.length; k++){
                if(isNaN(value[k])){
                    value[k]=0;
                }else{
                    totalValue += value[k];
                    count++;
                }
            }
            if(count == 0){
                location[j] = "X";
            }else{
                var avgValue = totalValue/count;
//                set the format of each measure result
                switch (i){
                    case 0:
                        location[j] = Math.round(avgValue)+'Lux';
                        break;
                    case 1:
                        location[j] = avgValue.toFixed(1)+'km/h';
                        break;
                    case 2:
                        location[j] = avgValue.toFixed(1)+'°C';
                        break;
                    case 3:
                        location[j] = avgValue.toFixed(1)+'%';
                        break;
                }
            }
        }
//        data[i] contains each location's average of i type of measure
//        data contains all measure result average on all locations of one group
        data[i] = location;
    }
    console.log("average all group");
    console.log(data);
    var alltext = [];
    for(var k=0;k<4;k++){
        var text = "Lumière : "+data[0][k]+"\nVent : "+data[1][k]+"\nTempérature : "+data[2][k]+"\nHumidité : "+data[3][k];
        console.log("--------data of location-------");
        console.log(text);
        alltext.push(text);
    }
    uploadName();
    uploadData(alltext);
}
// upload students' names
function uploadName(){
    console.log("update students' names");
    console.log(names);
    var db = new PouchDB('https://myoa.smileupps.com/user');
    db.get('setting').then(function(doc){
        var classroom = doc.classroom;
        var deploy = doc.deploy;
        for(var i=0;i<4;i++){
            classroom[deploy.classroom].groups[i].students = names[i];
        }
        return db.put({
            classroom: classroom,
            deploy: deploy
        }, 'setting', doc._rev);
    });
}

//put one group's data into database
function uploadData(data){
    console.log("update measuring data");
    var db = new PouchDB('https://myoa.smileupps.com/myoa');
    db.get('Cirque St Même').then(function(doc){
        var mapstep1 = doc.mapstep1;
        var mapstep2 = doc.mapstep2;
        var mapstep3 = doc.mapstep3;
        var mapstep4 = doc.mapstep4;
        for(var i=0;i<mapstep1.markers.length;i++){
            mapstep1.markers[i].data = data[i];
        }
        return db.put({
            mapstep1: mapstep1,
            mapstep2: mapstep2,
            mapstep3: mapstep3,
            mapstep4: mapstep4
        }, 'Cirque St Même', doc._rev);

    });
}








module.exports = router;

