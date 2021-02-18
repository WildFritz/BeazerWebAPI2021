var express = require('express')
var app = express()
var mongoose = require('mongoose')
const { createBrotliCompress } = require('zlib')
var serv = require('http').Server(app)
var io = require('socket.io')(serv, {})
var debug = true


require('./db')
require('./models/Player')

var PlayerData = mongoose.model('player')

//file comminication
app.get('/', function(req,res){
    res.sendFile(__dirname+ '/client/index.html')
})

app.use('/client', express.static(__dirname+'/client'))



//Server side communication
serv.listen(5000, function(){
    console.log('Connected on localhost 5000')
})


var socketList = {}
//var playerList = {}


var GameObject = function(){
    var self = {
        x:400,
        y:300,
        spX:0,
        spY:0,
        id:"",
    }
    self.update = function(){
        self.updatePosition()
    }
    self.updatePosition = function(){
        self.x += self.spX
        self.y += self.spY

        if(self.y > 600 - 10){
            self.y = 600 - 10;
            self.vy = 0;
        }
        //right boundary of screen
        if(self.x > 800 - 10 ){
            self.x = 800 - 10;
            self.vx = 0;
        }
        //left boundary of screen
        if(self.x < 0 + 10 ){
            self.x = 0 + 10;
            self.vx = 0;
        }

        //top boundary of screen
        if(self.y < 0 + 10){
            self.y = 0 + 10;
            self.vy = 0;
        }
    }
    self.getDist = function(point){
        return Math.sqrt(Math.pow(self.x - point.x,2)+Math.pow(self.y-point.y,2))
    }
    return self
}

var Player = function(id){
    var self = GameObject()
    self.id = id
    self.number = Math.floor(Math.random() * 10)
    self.right = false
    self.left = false
    self.up = false
    self.speed = 10

    var playerUpdate = self.update

    self.update = function(){
        self.updateSpeed()
        playerUpdate()
        
    }

   

    self.updateSpeed = function(){
        if(self.up == true){
            self.spY = -10;
        }
        else{
            self.spY = 3;
        }
    
        if(self.left == true){
            self.spX = -3;
        }
        else if(self.right == true){
            self.spX = 3;
        }
        else{
            self.spX = 0;
        }
    }
    Player.list[id] = self


    return self
}

Player.list = {}

//List of functions for player connection and movement
Player.onConnect = function(socket){
    var player = new Player(socket.id)

    //recieved player input
    socket.on('keypress', function(data){
        if (data.inputId === 'up')
            player.up = data.state
        // if (data.inputId === 'down')
        //     player.down = data.state
        if (data.inputId === 'left')
            player.left = data.state
        if (data.inputId === 'right')
            player.right = data.state

        // if (data.inputId === 'attack')
        //     player.attack = data.state
        // if (data.inputId === 'mouseAngle')
        //     player.mouseAngle = data.state
    })
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id]
}

Player.update = function(){
    var pack = []
    
    for (var i in Player.list) {
        var player = Player.list[i]
        player.update()
       // console.log(player)
        pack.push({
            x: player.x,
            y: player.y,
            number:player.number,
            id:player.id
        })
    }

    return pack
}

var Asteroid = function(){
    
}



//======== User Collection setup
// var Players = {
//     "Matt": "123",
//     "Dylan": "111",
//     "Ronny": "222",
//     "Maleek": "777",
// }


//Connection to the game
io.sockets.on('connection', function(socket){
    console.log("Socket Connected")

    socket.id = Math.random()

    //add something to socketList
    socketList[socket.id] = socket
    
    Player.onConnect(socket)
    
 


    //disconnection event
    socket.on('disconnect',function(){
        delete socketList[socket.id]
        Player.onDisconnect(socket)
    })

    //handeling chat
    socket.on('sendMessageToServer',function(data){
       var playerName = (" " + socket.id).slice(2, 7)
       for(var i in socketList){
           socketList[i].emit('addToChat', playerName + ": " + data)
       }
    })

    socket.on('evalServer',function(data){
        if(!debug){
            return
        }
        var res = eval(data)
        socket.emit('evalResponse', res)
     })
    
})

//setup update loop
setInterval(function () {
    var pack = {
        player:Player.update()
    }
    //var pack = Player.update()
    for (var i in socketList) {
        var socket = socketList[i]
        socket.emit('newPositions', pack)
    }
}, 1000 / 30)