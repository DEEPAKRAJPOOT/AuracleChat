var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var FCM = require('fcm-push');
var apn = require('apn');
var serverKey = 'AIzaSyCNaTHT_Nj_sA0IaeD38wjWyy_UUYjhDyY';

var fcm = new FCM(serverKey);
var mysql = require('mysql');
//var MySQLCM   =  require('mysql-connection-manager');
var cors = require('cors');
app.use(cors());


// var options = {
//   token: {
//     key: "AuthKey_V7KMNYSB28.p8",
//     keyId: "V7KMNYSB28",
//     teamId: "V9XU4TFBXY"
//   },
//   production: false
// };

var options = {
  token: {
    key: "AuthKey_2697X9A4G4.p8",
    keyId: "2697X9A4G4",
    teamId: "L9G83RZ8XQ"
  },
  production: false
};

var apnProvider = new apn.Provider(options);


// var db = mysql.createConnection({
//   host :'spicaworks.com.md-94.webhostbox.net',
//   port:'3306',
//   user : 'spicaxwd_auracle',
//   password : '3XfNHy6?b{Kg',
//   database:'spicaxwd_FindingOona'
   
// });


var db = mysql.createConnection({
  host :'localhost',
  port:'3306',
  user : 'httpauracle_auracle',
  password : 'WEvkm_W!m]WM',
  database:'httpauracle_Auracle'
   
});

db.connect(function(err){
    if(err)
     console.log(err);
     else
     console.log('Connection to database successful.');
})



app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/userChat/:id', function(req, res) {
  res.sendFile(__dirname + '/userChat.html');
});


app.set('port', process.env.PORT || 9000);

var server = http.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});

var onlineUsers     =   [];
var socketByUser    =   [];
io.on('connection', function(socket) {
    
  ////////////////////////////////////Get User For Admin//////////////
 
  
    // socket.on('getUser', function(cb){
    //     var allData = [];
        
    //     let sql = "SELECT * FROM `likedUsers` INNER JOIN users ON (likedUsers.userId = users.id AND likedUsers.userId!=?) OR (likedUsers.`matchedUserId` = users.id AND likedUsers.`matchedUserId`!=?) WHERE (likedUsers.`userId`=? AND likedUsers.`matchedStatus`=? AND likedUsers.`isMissed`=?) OR (likedUsers.`matchedUserId`=? AND likedUsers.`matchedStatus`=? AND likedUsers.`isMissed`=?)";
       
    //    db.query(sql,[190,190,190,2,0,190,2,0],function(err,db_data){
    //        if(err)
    //        {
    //            console.log(err);
    //        }  
    //        var countData = db_data.length;
    //        if(countData > 0)
    //        {
    //           db_data.forEach(function(element,index){
                 
    //              var userId = 169;
    //              var friendId = element.id;
    //              var chatList = {"userId":userId,"friendId":friendId,"firstName":element.firstName,"lastName":element.lastName,"email":element.email,"location":element.location,"jobOccupation":element.jobOccupation};
                 
    //                 allData.push(chatList); 
                 
    //                 if(countData === index+1)
    //                 {
    //                     cb(allData);
    //                 }
    //           }) 
    //        }else{
    //            cb(allData);
    //        }
    //    });
    // });
    
    ////////////////////////////////////End Get User For Admin//////////////
    
    
    //////////////////////Connect user to socket//////////////////////////
    
    
    socket.on('init',function(data,callback){
        var unique_id = data.userId;
        socketByUser[unique_id]=socket;
        console.log("test");
        onlineUsers.push(socket.id);
        callback({status:"1"});
        
   });
   
   //////////////////////End Connect user to socket//////////////////////////
   
   
   
   ///////////////////////Send Chat//////////////////////////////////////////
   
   
   socket.on('sendMessage',function(data,callback){
       console.log(data,'jkjhgj');
       var obj;
       var lastInsertId;
       var date = new Date().getTime();
       var receiverId = data.receiverId;
       var senderId = data.senderId;
       
       var memberSocket = socketByUser[receiverId];
       console.log(memberSocket,'member socket')
       var senderSocket = socketByUser[senderId];
       var isRead = 0;
       var senderMessage = data.message;
       var userChat = {"receiverId":parseInt(data.receiverId),"message":data.message,"url":data.url,"senderId":parseInt(data.senderId),"type":data.type,"timeStamp":date.toString(),"isRead":0};
       getUserFriendStatus(senderId,receiverId).then((res)=>{
        var isFriend = res.isFriend;
       var sql = "INSERT INTO usersChat (senderId,receiverId, message,url,type,datetime,parentId,isFriend) VALUES (?, ?, ?,?,?,?,?,?)";
       
       db.query(sql, [data.senderId,data.receiverId,data.message,data.url,data.type,date,data.parentId,isFriend], function(err, db_data){
           
           if(err) throw err;
           
            var last_message_id = db_data.insertId;
            obj =  Object.assign({},userChat);
            obj.id = last_message_id;
            
            //console.log(last_message_id);
            getUserName(senderId).then((SenderDataRes)=>{
               var SenderprofilePic = "http://auracle.ai/FindingOona/public/uploads/"+SenderDataRes[0].profilePic.toString('utf8'); 
               var isSubscibed = SenderDataRes[0].isSubscribed;
               var readReceipt = SenderDataRes[0].readReceipt
               //console.log(readReceipt+' readReceipt');


               
               
            getCurrentMessage(last_message_id).then((data) => {
                var allData = Object.assign({},data[0]);
                allData.SenderprofilePic = SenderprofilePic;
                allData.isSubscibed = isSubscibed;
                allData.readReceipt = readReceipt;
                
                var orgIsFriend;
                getUserFriendStatus(senderId,receiverId).then((res)=>{
                  allData.isFriend = res.isFriend;
                  orgIsFriend = res.isFriend;


                if(memberSocket !== undefined){
                    if(memberSocket.connected == true){
                        var checkSocket = memberSocket.emit('receiveMessage', allData);
                        if(checkSocket.connected === true)
                        {
                                if(senderSocket.connected === true){
                                    
                                    senderSocket.emit('reachedSendedMessageStatus',{'status':true,'isFriend':orgIsFriend});
                                    
                                }
                                
                                messageStatusUpdate(last_message_id, 1).then((res)=>{
                                    console.log("update successfully");
                                });
                        }
                    }
                }
                
                
            callback(allData);
            if(memberSocket === undefined){
                
                
               getUserName(receiverId).then((res)=>{
                   var deviceToken = res[0].deviceToken;
                   var deviceType = res[0].deviceType;
                   console.log(deviceToken);
                   if(deviceToken != undefined)
                   {
                       
                       if(deviceType === 2)
                       {
                           
                           getUserName(senderId).then((SenderRes)=>{
                               
                                var senderName = SenderRes[0].firstName+''+SenderRes[0].lastName;
                                var profilePic = "http://auracle.ai/FindingOona/public/uploads/"+SenderRes[0].profilePic.toString('utf8');
                                
                                var privacyMode = SenderRes[0].stealthMode;
                                var isSubscribe = SenderRes[0].isSubscribed;
                                var subscribe = isSubscribe;
                                
                            
                                console.log(senderName);
                                var note = new apn.Notification();

                                note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                                note.badge = 1;
                                note.sound = "ping.aiff";
                                note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
                                note.payload = {'isFriend':isFriend,'messageFrom': senderName,'senderId':senderId,'profilePic':profilePic,'privacyMode':privacyMode,'isSubscribe':subscribe,'type':'6'};
                                note.topic = "com.mobilecoderz.Sally";
                                note.message = senderMessage;
                                
                                apnProvider.send(note, deviceToken).then( (result) => {
                                      console.log(result);
                                     // if(result.failed[0].status != 200)
                                     // {
                                     //     console.log('Not sent notification due to device token.');
                                        
                                        
                                     // }else{
                                         
                                         var Oonasql = "INSERT INTO oonaNotification (userId,notification,title,type) VALUES (?, ?, ?,?)";
                                         db.query(Oonasql, [receiverId,senderMessage,senderName+' send you message.',6], function(err, db_data){
                                             if(err){
                                                 console.log(err);
                                             }
                                             console.log('successfully sent notification'); 
                                             
                                         });
                                         
                                         
                                    // }
                                      
                                    });  
                           });
                           //console.log('iOs');
                           
                       }else{
                           
                           getUserName(senderId).then((SenderRes)=>{
                               
                               var senderName = SenderRes[0].firstName+''+SenderRes[0].lastName;
                               var profilePic = "http://auracle.ai/FindingOona/public/uploads/"+SenderRes[0].profilePic.toString('utf8');
                               
                               var readReceipt = SenderRes[0].readReceipt;
                                var isSubscribe = SenderRes[0].isSubscribed;
                                 var subscribe = isSubscribe;
                                
                               var NotificationMessage = {
                                        to: deviceToken,
                                        notification: {
                                            title: senderName,
                                            body: 'You have a new message'
                                        },
                                        data: {
                                           title : senderName,
                                           message : senderMessage,
                                           profilePic:profilePic,
                                           senderId:senderId,
                                           type : "6",
                                           readReceipt:readReceipt,
                                           isSubscribe:subscribe,
                                           isFriend:isFriend
                                           
                                        }    
                                    };
                                    
                                    //console.log(NotificationMessage);
                                    
                                    fcm.send(NotificationMessage, function(err, response){
                                        console.log(response);
                                        if (err) {
                                            console.log("Something has gone wrong!");
                                        } else {
                                            
                                             var Oonasql = "INSERT INTO oonaNotification (userId,notification,title,type) VALUES (?,?,?,?)";
                                             db.query(Oonasql, [receiverId,senderMessage,senderName+' send you message.',6], function(err, db_data){
                                                if(err){
                                                 console.log(err);
                                             } 
                                                 console.log("Successfully sent with response: ", response);
                                                 
                                             });   
                                        }
                                    });  
                           });
                           
                       }
                   }else{
                       console.log('not avail');
                   }
                   
                   
               });
               
            }
               
               
              }).catch((err) => {
                console.log(err);
              });

           });
            
         });
       });
     });
   });
   

   
   socket.on('sendUnreadMessage',function(data,callback){
       
       var senderId = data.senderId;
       var receiverId  = data.receiverId;
       
       var unreachableQuery = "SELECT usersChat.id, usersChat.senderId, usersChat.receiverId,usersChat.isRead,usersChat.`message` FROM usersChat LEFT JOIN deletedMessage as dm ON dm.msgId = usersChat.id AND dm.senderId = ? WHERE (usersChat.senderId = ? AND usersChat.receiverId=? AND usersChat.isRead=? AND dm.msgDelType IS NULL )";
       
       var memberSocket = socketByUser[receiverId];
       if(memberSocket !== undefined){
            if(memberSocket.connected == true){
                    db.query(unreachableQuery,[senderId,senderId,receiverId,0],function(err,db_data){
                           
                         let newData = db_data.map((elem) => {
          	                return {...elem, message: elem.message.toString('utf8')}
                            });
                           
                           memberSocket.emit('getUnreadMessage',newData);
                           
                           
                           callback({status:true});
                           
                    }); 
            }
       }else{
           
           callback({status:false});
       }
       
       
   });
   
   socket.on('readMessage',function(data,callback){
        
        let msgId = data.messageId;
        var senderId = data.senderId;
        var receiverId = data.receiverId;
        var isFriend = data.isFriend;
       // var messageId = data.messageId;
        var memberSocket = socketByUser[senderId];
        let sql = "update usersChat SET isRead = 2 where id = ?";
        db.query(sql,[msgId],function(err,db_data){
          if(err)
            callback({status:"0"});
          else{
              
              if(memberSocket !== undefined){
                    if(memberSocket.connected == true){
                        memberSocket.emit('readableStatus',{'isRead':2,'messageId':msgId,'senderId':receiverId,'isFriend':isFriend});
                    }
                }
                
              callback({status:"1"});
          }
            
        });
        
    });
    
    socket.on('readAllMessage',function(data,callback){
        let senderId   = data.senderId;
        let receiverId = data.receiverId;
        var messageId  = data.messageId;
        var isFriend   = data.isFriend;

        
        console.log(senderId);
        console.log(receiverId);
        console.log(messageId);
        
        var memberSocket = socketByUser[senderId];
        var sql = "update usersChat SET isRead = ? where (receiverId=? and senderId=? and isRead IN (?,?) and id <= ?)";
        db.query(sql,[2,receiverId,senderId,1,0,messageId],function(err,db_data){
            if(err)
            {
                console.log(err);
                callback(err);

            }else
            {

                console.log(db_data);
                if(memberSocket !== undefined){
                    if(memberSocket.connected == true){
                        memberSocket.emit('readableStatus',{'isRead':2,'messageId':messageId,'senderId':receiverId,'isFriend':isFriend});
                    }
                }

                callback({status:"1"});
            }
              
        })
    });
   
   socket.on('getAllMessages', function(data,cb){
       
    //var sql= "SELECT usersChat.id, CONCAT(users.firstName,' ',users.lastName) as userName,message,url,isRead,receiverId,senderId,datetime as timeStamp,type, (CASE WHEN parentId != 0 THEN (SELECT (CASE WHEN message !='' THEN CONVERT(message USING utf8) ELSE url END) as message FROM usersChat as t1 WHERE usersChat.parentId = t1.id) ELSE '' END)as quoteMessage FROM `usersChat` LEFT JOIN users ON users.id = usersChat.senderId WHERE ((senderId= ? and receiverId = ?) OR(senderId=? and receiverId=?)) AND usersChat.id > ? ORDER BY usersChat.id ASC";
    
    
    var sql= "SELECT usersChat.id, CONCAT(users.firstName,' ',users.lastName) as userName,message,url,isRead,usersChat.receiverId,usersChat.senderId,datetime as timeStamp,type,dm.msgDelType, (CASE WHEN parentId != 0 THEN (SELECT (CASE WHEN message !='' THEN CONVERT(message USING utf8) ELSE url END) as message FROM usersChat as t1 WHERE usersChat.parentId = t1.id) ELSE '' END)as quoteMessage FROM `usersChat` LEFT JOIN users ON users.id = usersChat.senderId LEFT JOIN deletedMessage as dm ON dm.msgId = usersChat.id AND dm.senderId = (CASE WHEN usersChat.senderId = ? THEN usersChat.senderId ELSE usersChat.receiverId END) WHERE ((usersChat.senderId= ? and usersChat.receiverId = ?  AND msgDelType IS NULL) OR(usersChat.senderId=? and usersChat.receiverId=? AND usersChat.isFriend=? AND msgDelType IS NULL)) AND usersChat.id > ? ORDER BY usersChat.id ASC";
    
    
       db.query(sql,[data.senderId,data.senderId, data.receiverId,data.receiverId, data.senderId,data.isFriend, data.messageId], function(err, res){
          if(err) console.log(err);
          else{
              
              
            
            
            let newData = res.map((elem) => {
          	        return {...elem, message: elem.message.toString('utf8')}
                });
                
                cb(newData);
          }
          
       });
       
   });
   
   socket.on('userTyping', function(data, cb){
       var senderId = data.senderId;
       var receiverId = data.receiverId;
       var loginMember = socketByUser[data.receiverId];
       
      if(loginMember != undefined){
          if(loginMember.connected == true){
            var check = loginMember.emit('typingOn',{'status':data.status,'receiverId':receiverId,'senderId':senderId});
            console.log(check.connected);
          }
          
      }else{
          
          if(loginMember != undefined){
              if(loginMember.connected != true){
                  var check = loginMember.emit('typingOn',{'status':false,'receiverId':receiverId,'senderId':senderId});
              }
          }
      }
   });
   
   socket.on('getFrienStatus',function(data,callback){
          var userId = data.userId;
          var friendId = data.friendId;
          getUserFriendStatus(userId,friendId).then((res)=>{

               var loginMember = socketByUser[friendId];
               if(loginMember != undefined){
                   if(loginMember.connected === true){

                        var send = loginMember.emit('getMatchStatus',{'userId':userId,'isFriend':res.isFriend});
                        callback({'message':'Match status sent to your friend successfully.'})
                   } 
               }
          })
   });
   
   socket.on('onlineUsersMessageStatusUpdate', function(data,cb){
       var senderId= data.senderId;
       
       onlineUsersMessageStatusUpdateList(senderId).then((res)=>{
            res.forEach(function(users){
              var loginMember = socketByUser[data.userId];

              if(loginMember != undefined ){

                  if(loginMember.connected === true){
                    var check = loginMember.emit('onlineUsersMessageStatusUpdateOn',{'status':true});
                  }
              }
            });
           allMessageStatusUpdate(senderId).then((res)=>{
               console.log("all message reading successfully");
           });
       });
   });
//==========blockUser=================//

   socket.on('blockUser',function(data,callback){

       var userId = data.userId;
       var friendIds = data.friendIds;
       var isFriend = data.isFriend;
       //console.log(friendIds);
       var j =1;
       var Action = false;
       for(var i=0;i<friendIds.length;i++)
       {
          console.log(userId);
          if(isFriend !== 1)
          {
                removeMatch(userId,friendIds[i]).then((res)=>{
                  console.log(res.status+' user1');
                });

                removeSheduledDates(userId,friendIds[i]).then((res)=>{
                  console.log(res.status+' user2');
                });

                removefaveList(userId,friendIds[i]).then((res)=>{
                    console.log(res.status+' user3');
                });

          }else{

              console.log('friends');
              removePostEventFromUser(userId,friendIds[i]).then((res)=>{
                  console.log(res.status+' postDeleted');
              });

              removeFromMatch(userId,friendIds[i]).then((res)=>{
                  console.log(res.status+' matchRemoved');
              });
          }
          

          removeChatList(userId,friendIds[i]).then((res)=>{
                   console.log(res.status+' user4');
          });

          var blocked = "INSERT INTO `blockedUser`(`senderId`, `blockedUserId`, `blockStatus`) VALUES (?,?,?)";
          db.query(blocked,[userId,friendIds[i],1],function(err,db_messageData){
            console.log('blocked User');
          });

          var loginMember = socketByUser[friendIds[i]];
          if(loginMember != undefined ){

            if(loginMember.connected === true)
                var check = loginMember.emit('blockedStatus',{'blocked':1,'isFriend':isFriend,'userId':userId});   
          }

          if(j === friendIds.length)
          {
             Action = true;
          }

          j++;
       }

       if(Action){
        callback({'status':true});
       }else
        callback({'status':false});
       
   });


 function removeFromMatch(userId,friendId)
 {
    return new Promise((resolve, reject) => {
        var removeMatchSql = "INSERT INTO `likedUsers`(`userId`, `matchedUserId`, `matchedStatus`, `isCurated`, `isLocked`, `isMissedLocked`, `isMissed`) VALUES (?,?,?,?,?,?,?)";
        db.query(removeMatchSql,[userId,friendId,0,0,0,0,0],function(err,removeFromMatch){
          if(err){
                reject(err);
            }else{

                resolve({'status':true});
            }
        });
    });
 }    

 function removePostEventFromUser(userId,friendId)
 {

    return new Promise((resolve, reject) => {
      var selectEventPost = "SELECT * FROM `usersEventPost` WHERE `userId`=?";

      var deleteEventPost = "INSERT INTO `deletPostEventFromUser`(`userId`, `postEventId`) VALUES (?,?)";
      db.query(selectEventPost,[friendId],function(err,dbPostEventData){
            if(err){
                reject(err);
            }else{

                var lenOfPOst = dbPostEventData.length;
                var i=1;
                var status=false;
                dbPostEventData.forEach(function(dbPostEventData){
                    var eventPostId = dbPostEventData.id;
                    db.query(deleteEventPost,[userId,eventPostId],function(err,dbPostEventDeleted){
                        if(err){
                              console.log(err);
                          }   
                    });

                    i++;
                });

                db.query(selectEventPost,[userId],function(err,UserPostEventData){
                          var lengthOfPOst = UserPostEventData.length;
                          var j=1;
                          UserPostEventData.forEach(function(dbPostEventData){
                              var userEventPostId = dbPostEventData.id;
                              db.query(deleteEventPost,[friendId,userEventPostId],function(err,dbPostEventDeleted){
                                  if(err){
                                    console.log(err);
                                  }
                              });
                              j++;
                          });

                  });

               resolve({'status':true});    
            }   
      });
    });

  }

   
   
   socket.on('checkOnline',function(data,cb){
      var senderId = data.userId;
      var receiverId = data.receiverId;

      var loginMember = socketByUser[receiverId];
      getUserFriendStatus(senderId,receiverId).then((res)=>{
          
          //console.log({'status':true,'isSubscribed':res.isSubscribed,'privacyReadReceipt':res.privacyReadReceipt,'blocked':res.blockStatus,'isFriend':res.isFriend});
          
          if(loginMember != undefined){

              if(loginMember.connected === true)
              {
                  cb({'status':true,'isSubscribed':res.isSubscribed,'privacyReadReceipt':res.privacyReadReceipt,'blocked':res.blockStatus,'isFriend':res.isFriend});
              }else{
                  cb({'status':false,'isSubscribed':res.isSubscribed,'privacyReadReceipt':res.privacyReadReceipt,'blocked':res.blockStatus,'isFriend':res.isFriend});
              }
          }else
            cb({'status':false,'isSubscribed':res.isSubscribed,'privacyReadReceipt':res.privacyReadReceipt,'blocked':res.blockStatus,'isFriend':res.isFriend});  
      
      });

   });
   
   socket.on('onlineUsers', function(data,cb){
       var senderId= data.senderId;
       onlineUser(senderId).then((res)=>{
           
            res.forEach(function(res){
              var loginMember = socketByUser[res.userId];
             
              if(loginMember != undefined){

                  if( loginMember.connected === true){
                    var check = loginMember.emit('onlineUsersOn',{'status':true});
                  }
              }
          });
       });

       allMessageStatusUpdate(senderId).then((res)=>{
          console.log("all message reading successfully");
       });

   });
   
   
   socket.on('deleteMultiUserChat',function(data,callback){
       var userId = data.userId;
       var senderIds = data.senderId;
       
       
       var delQuery = "SELECT usersChat.* FROM `usersChat` LEFT JOIN deletedMessage as dm ON dm.msgId = usersChat.id AND dm.senderId = ? WHERE ( usersChat.`senderId` = ? AND `receiverId`=? AND dm.msgDelType IS NULL) OR (usersChat.`senderId` = ? AND `receiverId` = ? AND dm.msgDelType IS NULL)";
       for(var i=0; i<senderIds.length;i++)
       {
             console.log(userId);
             db.query(delQuery,[userId,userId,senderIds[i],senderIds[i],userId],function(err,db_messageData){
                 if(err){
                     console.log(err);
                 }else{ 
                     
                     deleteUsersMessage(db_messageData,userId).then((res)=>{
                         
                         if(i === senderIds.length)
                         {
                             callback({deleted:res.status});
                         }
                         
                     });
                 }
                 
             });
       }  
   });
   
   
   
   socket.on('getAllUnreadCount',function(data,callback){
       
       var userId = data.senderId;
       var senderId = data.receiverId;
       
       var getUnreadQuery = "SELECT * FROM `usersChat` LEFT JOIN deletedMessage as dm ON dm.msgId = usersChat.id AND dm.senderId = ? WHERE (usersChat.`senderId`=? AND usersChat.`receiverId`=? AND usersChat.`isRead`=? AND dm.msgDelType IS NULL) OR (usersChat.`senderId`=? AND usersChat.`receiverId`=? AND usersChat.`isRead`=? AND dm.msgDelType IS NULL)";
       
       db.query(getUnreadQuery,[userId,userId,senderId,0,userId,senderId,1],function(err,res){
           if(err)
           {
               console.log(err);
               
           }else{
               
               let newData = res.map((elem) => {
          	        return {...elem, message: elem.message.toString('utf8')}
                });
                
               callback({unreadMessages:newData});
           }
           
       });
   });
   
   
   
   socket.on('getAllUser',function(data,callback){
       
       var filteredCuratedData=[];
       var userId = data.userID;
       var isFriend = data.isFriend;
       
       //var getLatestMessageSql = "SELECT blockedUser.blockStatus,users.firstName,users.lastName,users.email,users.profilePic,t1.url,t1.datetime,t1.message,t1.isRead,t1.type,t1.id as messageId, (CASE WHEN t1.receiverId = ? THEN t1.senderId ELSE t1.receiverId END) as userId,t1.senderId,t1.receiverId,(SELECT count(*) FROM usersChat WHERE (receiverId=? AND isRead=0 AND senderId = (CASE WHEN t1.receiverId = ? THEN t1.senderId ELSE t1.receiverId END)) OR (receiverId=? AND isRead=1 AND senderId = (CASE WHEN t1.receiverId = ? THEN t1.senderId ELSE t1.receiverId END))) as unReadMessage FROM `usersChat` as t1 INNER JOIN ( SELECT max(usersChat.id) as id, usersChat.senderId, usersChat.receiverId , dm.msgId, dm.msgDelType FROM usersChat LEFT JOIN deletedMessage as dm ON dm.msgId = usersChat.id AND dm.senderId = (CASE WHEN usersChat.senderId = ? THEN usersChat.senderId ELSE usersChat.receiverId END) WHERE (usersChat.senderId = ? AND msgDelType IS NULL ) OR (usersChat.receiverId = ? AND msgDelType IS NULL) GROUP BY CASE WHEN usersChat.receiverId = ? THEN usersChat.senderId ELSE usersChat.receiverId END) as t2 ON t1.id = t2.id LEFT JOIN blockedUser ON (t1.senderId = blockedUser.senderId AND t1.receiverId = blockedUser.blockedUserId) OR (t1.receiverId = blockedUser.senderId AND t1.senderId = blockedUser.blockedUserId) INNER JOIN users ON (CASE WHEN t1.receiverId = ? THEN t1.senderId=users.id ELSE t1.receiverId=users.id END) order by t1.datetime DESC";
    
    
       var getLatestMessageSql = "SELECT users.firstName,blockedUser.blockStatus,users.lastName,users.email,users.profilePic,users.isSubscribed,users.readReceipt as readReceipt,t1.url,t1.datetime,t1.message,t1.isRead,t1.type,t1.isFriend,t1.id as messageId, (CASE WHEN t1.receiverId = ? THEN t1.senderId ELSE t1.receiverId END) as userId,t1.senderId,t1.receiverId,(SELECT count(*) FROM usersChat LEFT JOIN deletedMessage as dn ON dn.msgId = usersChat.id AND dn.senderId = (CASE WHEN usersChat.senderId = ? THEN usersChat.senderId ELSE usersChat.receiverId END) WHERE (receiverId=? AND isRead=0 AND usersChat.senderId = (CASE WHEN t1.receiverId = ? THEN t1.senderId ELSE t1.receiverId END) AND dn.msgDelType IS NULL) OR (receiverId=? AND isRead=1 AND usersChat.senderId = (CASE WHEN t1.receiverId = ? THEN t1.senderId ELSE t1.receiverId END) AND dn.msgDelType IS NULL)) as unReadMessage FROM `usersChat` as t1 INNER JOIN ( SELECT max(usersChat.id) as id, usersChat.senderId, usersChat.receiverId , dm.msgId, dm.msgDelType FROM usersChat LEFT JOIN deletedMessage as dm ON dm.msgId = usersChat.id AND dm.senderId = (CASE WHEN usersChat.senderId = ? THEN usersChat.senderId ELSE usersChat.receiverId END) WHERE (usersChat.senderId = ? AND usersChat.isFriend = ? AND msgDelType IS NULL ) OR (usersChat.receiverId = ? AND usersChat.isFriend = ? AND msgDelType IS NULL) GROUP BY CASE WHEN usersChat.receiverId = ? THEN usersChat.senderId ELSE usersChat.receiverId END) as t2 ON t1.id = t2.id LEFT JOIN blockedUser ON (t1.senderId = blockedUser.senderId AND t1.receiverId = blockedUser.blockedUserId) OR (t1.receiverId = blockedUser.senderId AND t1.senderId = blockedUser.blockedUserId) INNER JOIN users ON (CASE WHEN t1.receiverId = ? THEN t1.senderId=users.id ELSE t1.receiverId=users.id END) order by t1.datetime DESC";
       console.log(getLatestMessageSql);
       console.log(userId);
       console.log(isFriend);
       let queryResult=db.query(getLatestMessageSql, [userId,userId,userId,userId,userId,userId,userId,userId,isFriend,userId,isFriend,userId,userId], function(err, db_datas){
           if(err){
             console.log(err);
           }else{               
                
                let newData = db_datas.map((elem) => {
          	        return {...elem, message: elem.message.toString('utf8'),profilePic:"http://auracle.ai/FindingOona/public/uploads/"+elem.profilePic.toString('utf8') }
                });

                var curatedSql = "SELECT users.firstName,users.id as userId,users.lastName,users.email,users.profilePic FROM likedUsers INNER JOIN users ON likedUsers.matchedUserId = users.id WHERE  (likedUsers.`userId`=? AND likedUsers.`isCurated`=? AND likedUsers.`isMissed`=? AND likedUsers.`created_at` > TIMESTAMP(NOW() - INTERVAL 24 HOUR)) UNION SELECT users.firstName,users.id as userId,users.lastName,users.email,users.profilePic FROM likedUsers INNER JOIN users ON likedUsers.matchedUserId = users.id WHERE (likedUsers.`matchedUserId`=? AND likedUsers.`isCurated`=? AND likedUsers.`isMissed`=? AND likedUsers.`created_at` > TIMESTAMP(NOW() - INTERVAL 24 HOUR))";
                 
                db.query(curatedSql,[userId,1,0,userId,1,0], function(err, curatedDatas){
                        
                     var filteredCuratedData = curatedDatas.map((elem) => {
                    
      	                return {...elem, profilePic:"http://auracle.ai/FindingOona/public/uploads/"+elem.profilePic.toString('utf8') }
                    })

                   callback({users:newData,curatedUsers:filteredCuratedData});
                })  
           }  
        })
      //console.log(queryResult.sql) 
   });
   
   socket.on('chatDelete',function(data,callback){
       var senderId = data.senderId;
       var delsql = "";
       
       var messageIds = data.messageId;
       var delQuery='';
       for(var i=0;i<messageIds.length;i++)
       {
           delQuery += " ("+senderId+","+messageIds[i]+")";
           if(i <= messageIds.length-2)
           {
              delQuery += ","; 
           }
       }
           
      delsql = "INSERT INTO deletedMessage (`senderId`,`msgId`) VALUES "+delQuery+"";
          
      db.query(delsql,[], function(err, data){
          if(err){
               
              console.log(err);
               
          }else{
               
              callback({deleted:true});
          }
      })    
   });
   
   
   
   
   
   socket.on('deleteAllChat',function(data,callback){
      var senderId = data.senderId;
      var userId = data.userId;
      var lastMsgId = data.lastMessageId; 
      var selectMessages = "SELECT * FROM `usersChat` WHERE (`senderId`=? AND receiverId=? AND id <= ?) OR (receiverId=? AND senderId =? AND id <= ?)";
      
      
      db.query(selectMessages,[senderId,userId,lastMsgId,senderId,userId,lastMsgId],function(err,data){
         if(err){
             console.log(err); 
         }else{
                var delQuery='';
               for(var i=0;i<data.length;i++)
               {
                   var msgId = data[i].id;
                   delQuery += " ("+userId+","+msgId+")";
                   if(i <= data.length-2)
                   {
                      delQuery += ","; 
                   }
                   
               }
               
               var deleteSql = "INSERT INTO deletedMessage (`senderId`,`msgId`) VALUES "+delQuery+"";
               
               db.query(deleteSql,[],function(err,data){
                   
                   callback({deleted:true});
                   
               });
         }
      })
   });
   
   socket.on('manualDisconnect', function (data,callback) {
     // onlinecount--;
     console.log('manualDisconnect called........................');
        var userId = data.userId;
        delete socketByUser[userId];
        onlineUsers.splice(onlineUsers.indexOf(socket.id),1);
        var obj = {"status":1};
        callback(obj);
    });

      socket.on('disconnect', function (data,callback) {
        console.log('disconnect called........................',data);

     // onlinecount--;
        // var userId = data.userId;
        // delete socketByUser[userId];
        // onlineUsers.splice(onlineUsers.indexOf(socket.id),1);
        // var obj = {"status":1};

         let socket_key = getKeyByValue(socketByUser, socket);
        delete socketByUser[socket_key];
        onlineUsers.splice(onlineUsers.indexOf(socket.id),1);
      console.log("online users ", onlineUsers.length);
        
    }); 
});

    function getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }

   function removeChatList(userId,friendId)
   {
    return new Promise((resolve, reject) => { 
      var removeFromChatList    = "DELETE FROM `usersChat` WHERE (`senderId`=? AND `receiverId`=?) OR (`receiverId`=? AND `senderId`=?)";
      db.query(removeFromChatList,[userId,friendId,userId,friendId],function(err,db_data){
        if(err){
          reject(err);
        }else{
          resolve({'status':true});
        }
      })
    });
   }

function removefaveList(userId,friendId)
{

    return new Promise((resolve, reject) => {

        var removeFromFaveListSql = "DELETE FROM `favorite` WHERE (`userId`=? AND `friendId`=?) OR (`friendId`=? AND `userId`=?)";
        db.query(removeFromFaveListSql,[userId,friendId,userId,friendId],function(err,db_data){
          if(err){
            reject(err);
          }else{
            resolve({'status':true});
          }
        })
    });
}

function removeSheduledDates(userId,friendId){

    return new Promise((resolve, reject) => {

        var removeSheduledDates =   "DELETE FROM `usersSheduleDates` WHERE (`userId`=? AND `matchedId`=?) OR (`userId`=? AND `matchedId`=?)";
        db.query(removeSheduledDates,[userId,friendId,friendId,userId],function(err,db_data){
            if(err){
               reject(err);
            }else{
              resolve({'status':true});
            }
        })
    });
}

   function removeMatch(userId,friendId){
    return new Promise((resolve, reject) => {
         var removeMatchSql = "UPDATE `likedUsers` SET `matchedStatus`=0,`isCurated`=0,`isLocked`=0,`isMissedLocked`=0,`isMissed`=0 WHERE (`userId`=? AND `matchedUserId`=?) OR (`matchedUserId`=? AND `userId`=?)";
         db.query(removeMatchSql,[userId,friendId,userId,friendId],function(err,db_data){
            if(err){
                 reject(err);
            }else{
                 resolve({'status':true});
            }
         })
      }); 
   }

function getUserFriendStatus($userId,$receiverId)
{
    return new Promise((resolve,reject)=>{

        var sql = "SELECT * FROM `users` LEFT JOIN blockedUser ON (blockedUser.senderId = users.id AND blockedUser.blockedUserId = ?) OR (blockedUser.senderId = ? AND blockedUser.blockedUserId = users.id) LEFT JOIN likedUsers ON (likedUsers.userId = users.id AND likedUsers.matchedUserId = ? AND likedUsers.matchedStatus = ?) OR (likedUsers.userId = ? AND likedUsers.matchedUserId = users.id AND likedUsers.matchedStatus = ?)  WHERE users.`id`=?"
        //var sql = "SELECT * FROM `users` LEFT JOIN blockedUser ON (blockedUser.senderId = users.id AND blockedUser.blockedUserId = ?) OR (blockedUser.senderId = ? AND blockedUser.blockedUserId = users.id)  WHERE users.`id`=?";
        //console.log(sql+' blockUser status');
        db.query(sql,[$userId,$userId,$userId,2,$userId,2,$receiverId],function(err,data){
          if (err) {
              console.log(err)
              reject(err);
          }else{
            
            var privacyReadReceipt = data[0].readReceipt;
            var isSubscribed = data[0].isSubscribed;
            
            var blockStatus;
            if(data[0].blockStatus !== '' && data[0].blockStatus !== null)
               blockStatus = data[0].blockStatus;
            else
              blockStatus = 0;

            var isFriend;
            if(data[0].matchedStatus !== '' && data[0].matchedStatus !== null)
              isFriend = 0;
            else
              isFriend = 1;



              resolve({isSubscribed:isSubscribed,privacyReadReceipt:privacyReadReceipt,blockStatus:blockStatus,isFriend:isFriend});
          }
        })
    });
}

function deleteUsersMessage(messageData,userId)
{
    return new Promise((resolve,reject)=>{
        for(var i =0;i<messageData.length;i++)
        {
            console.log(messageData[i].id);
            var sql = "INSERT INTO `deletedMessage`(`msgDelType`, `msgId`, `senderId`, `delStatus`) VALUES (?,?,?,?)";
            db.query(sql,[0,messageData[i].id,userId,1],function(err,data){
                if(err){
                    console.log(err)
                    reject(err);
                    
                }else{
                   
                    if(i === messageData.length)
                    {
                        
                        resolve({status:true});
                    }else{
                        console.log(false);
                    }
                    
                }
            })
            
        }
    });
}

function onlineUsersMessageStatusUpdateList(senderId){
    return new Promise((resolve, reject)=>{
       var sql = "SELECT t1.id as messageId, (CASE WHEN t1.receiverId = ? THEN t1.senderId ELSE t1.receiverId END) as userId FROM `usersChat` as t1 WHERE senderId = ? OR receiverId = ? AND isRead = ? GROUP BY userId";
       db.query(sql, [senderId, senderId, senderId, 0], function(err, data){
           if(err){
               reject(err);
           }else{
               resolve(data);
           }
       })
    });
}

function onlineUser(senderId){
    return new Promise((resolve, reject)=>{
       var sql = "SELECT t1.id as messageId, (CASE WHEN t1.receiverId = ? THEN t1.senderId ELSE t1.receiverId END) as userId FROM `usersChat` as t1 WHERE senderId = ? OR receiverId = ? GROUP BY userId";
       db.query(sql, [senderId, senderId, senderId], function(err, data){
           if(err){
               reject(err);
           }else{
               resolve(data);
           }
       })
    });
}


function messageStatusUpdate(messageId, isRead){
    return new Promise((resolve, reject) => {
       var updateState = "UPDATE `usersChat` SET isRead=? WHERE id = ? "; 
       db.query(updateState, [isRead, messageId], function(err, data){
           if(err){
               console.log(err);
               reject(err);
           }else{
               console.log(data);
               resolve(data);
           }
       });
    });
}

function allMessageStatusUpdate(senderId){

    return new Promise((resolve, reject) => {
       var updateState = "UPDATE `usersChat` SET isRead=? WHERE receiverId = ? AND isRead =?"; 
       db.query(updateState, [1, senderId,0], function(err, data){
           if(err){
               reject(err);
           }else{
               resolve(data);
           }
       });
    });

}


function getCurrentMessage(id){
    return new Promise((resolve, reject) => {
       var sql = "SELECT usersChat.id, CONCAT(users.firstName,' ',users.lastName) as userName,message,url,isRead,receiverId,senderId,datetime as timeStamp,type, (CASE WHEN parentId != 0 THEN (SELECT (CASE WHEN message !=''THEN CONVERT(message USING utf8) ELSE url END) as message FROM usersChat as t1 WHERE usersChat.parentId = t1.id) ELSE '' END)as quoteMessage FROM `usersChat` LEFT JOIN users ON users.id = usersChat.senderId WHERE usersChat.id = ?";
       db.query(sql,[id], function(err,data){
            if(err){
                reject(err);
            }else{
                
                let newData = data.map((elem) => {
          	        return {...elem, message: elem.message.toString('utf8')}
                });
                resolve(newData);
            }
        })
    });
}


function getUserName(senderId)
{
    return new Promise((resolve, reject) => {
        var getSender = "SELECT * from users where id = ?";
        db.query(getSender,[senderId],function(err,Data){
            if(err){
                reject(err); 
            }
            resolve(Data);
        });   
   })     
}

