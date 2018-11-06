  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyAo39iVLAq0CQ1JrUt1qnMTTwk7SYGYsx4",
    authDomain: "firstproject-ae554.firebaseapp.com",
    databaseURL: "https://firstproject-ae554.firebaseio.com",
    projectId: "firstproject-ae554",
    storageBucket: "firstproject-ae554.appspot.com",
    messagingSenderId: "15647467718"
  };
  firebase.initializeApp(config);

  var database = firebase.database();
  var username = null;
  var input_message = $("#input_message");
  renderChatAppOptions("chatroom","chatroom");
 
  //renderChatAppOptions("members","members");
//check localStorage get username from chatapp
if(localStorage.chatappUsername == undefined){
    input_message.attr("placeholder","Enter your name.");
}else{
    username=localStorage.chatappUsername;
    input_message.attr("placeholder","Enter your message");
}

//update chatroom message when user select another chatroom.
$("#chatroom").on("change",function(){
    currentChatRoom = $("#chatroom").val();
    $("#chat_box").empty();
    database.ref("messages/"+currentChatRoom).limitToLast(10).once("value").then(function(snapshot){
        //this get multiple messages in one return.
        var messages = snapshot.val();
        for(var key in messages){
            var item = messages[key];
            var message = renderMessage(item);
            $("#chat_box").append(message);
        }
    });
    
})

//insert message into firebase.
$("form").submit(function(){
    event.preventDefault();
        var chatroom = "messages/" + $("#chatroom").val();
        var input = input_message.val();
        var today = new Date();
        var timestamp = today.getTime();
        //set username 
        if(username == null){
            username = input; 
            localStorage.chatappUsername = input;
            input_message.attr("placeholder","Enter your message");
        }else{
            var post = {
                username: username,
                timestamp: timestamp,
                message: input
            }
            database.ref(chatroom).push(post)
        }
        input_message.val("");
});

//set listener to pick up new messages, only display message that belong to current chatroom.
function setDBListener(chatRoomId){

    var chatroom = "messages/" + chatRoomId;
    //Display messages from selected chatroom.
    database.ref((chatroom)).limitToLast(10).on("child_added",function(snapshot){
        var snapshotValue = snapshot.val();
        var param = {
                    timestamp: snapshotValue.timestamp,
                    username: snapshotValue.username,
                    message: snapshotValue.message}
        var chatroom = snapshot.ref.path.pieces_[1]
        var message = renderMessage(param);
        //not best practice to load all the messages.
        if(chatroom == $("#chatroom").val()){
            $("#chat_box").append(message);
        }
    });
}

//Not in use since we are creating new chatrooms from Google Map marker.
function createChatRoom(chatRoomName,x,y){
    var path = "chatroom/" + chatRoomName;
    var param = {
        x: x,
        y: y,
        title: chatRoomName
    }
    
    database.ref(path).update(param);
    //refresh chatroom selections.
    renderChatAppOptions("chatroom","chatroom");
}

//set timestamp for the messages in chatbox.
function getTimeStamp(timestamp){

    var date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString(); 
}

//get all chatrooms.
//create option element for each chatroom.
function renderChatAppOptions(group,class_name){
    database.ref(group).once("value").then(function(snapshot){
        var chatRoomIds = Object.keys(snapshot.val());
        class_name = "#"+class_name;
        $(class_name).empty();
        for ( var i = 0; i < chatRoomIds.length;i++){
            var currentChatRoom = snapshot.val()[chatRoomIds[i]];        
            var option = $("<option>",{value:chatRoomIds[i], text:chatRoomIds[i]});
            addMarker({lat:currentChatRoom.x,lng:currentChatRoom.y})
            $(class_name).append(option);
            setDBListener(chatRoomIds[i]);
        }
        
    });
    
}

//get username,timestamp and message, convert them into HTML element.
function renderMessage(param){
    var message = $("<div>");
    var idDiv = $("<div>").text(getTimeStamp(param.timestamp));
    idDiv.css("font-size","10px");
    var messageDiv = $("<div>");
    var usernameDiv = $("<div>").css("font-size","12px");;
    usernameDiv
    if(param.username == localStorage.chatappUsername){
        message.css("text-align","right");
        messageDiv.text(param.message);
        usernameDiv.text(param.username);
    }else{
        message.css("text-align","left");
        messageDiv.text(param.message);
        usernameDiv.text(param.username);
    }
    message.append(idDiv);
    message.append(messageDiv);
    message.append(usernameDiv);
    return message;
}

//switch chatroom. Taken lat, long from Google Map Marker.
function changeChatRoom(x, y){
    var coord = x.toFixed(3).toString() + "," + y.toFixed(3).toString();
    database.ref("chatroom").orderByChild("coord").equalTo(coord).on("child_added",function(snapshot)
    {
        var chatRoom = snapshot.ref.path.pieces_[1];
        $("#chatroom").val(chatRoom);
        $("#chat_box").empty();
        database.ref("messages/"+chatRoom).once("value").then(function(snapshot){
            //this get multiple messages in one return.
            var messages = snapshot.val();
            for(var key in messages){
                var item = messages[key];
                var message = renderMessage(item);
                $("#chat_box").append(message);
            }
        });
    })
}