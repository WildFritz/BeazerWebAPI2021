var express = require('express')
var app = express()
var mongoose = require('mongoose')
const { createBrotliCompress } = require('zlib')
const { setFlagsFromString } = require('v8')
const { RSA_NO_PADDING } = require('constants')
var serv = require('http').Server(app)
var io = require('socket.io')(serv, {})
var debug = true
var numAsteroids = 10
var gameRunning = false

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

var randomRange = function(high, low){
    return Math.random() * ( high - low) + low;
} 

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

   

    self.updateSpeed = function(){
        if(self.up == true){
            self.spY = -10;
        }
        else{
            self.spY = 5;
        }
    
        if(self.left == true){
            self.spX = -5;
        }
        else if(self.right == true){
            self.spX = 5;
        }
        else{
            self.spX = 0;
        }
    }


    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
        }
    }

    self.getUpdatePack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
        }
    }

    Player.list[id] = self
    initPack.player.push(self.getInitPack())

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

    socket.emit('init', {
        player:Player.getAllInitPack(),
        asteroid:Asteroid.getAllInitPack(),
    })
}

Player.getAllInitPack = function(){
    var players = []
    for(var i in Player.list){
        players.push(Player.list[i].getInitPack())
    }
    return players
}


Player.onDisconnect = function(socket){
    delete Player.list[socket.id]
    removePack.player.push(socket.id)
}

Player.update = function(){
    var pack = []
    
    for (var i in Player.list) {
        var player = Player.list[i]
        player.update()
       // console.log(player)
        pack.push(player.getUpdatePack())
    }

    return pack
}

var Asteroid = function(){
    var self = GameObject()
    self.id = Math.random()
    self.x = randomRange(800,0)
    self.y = randomRange(0,-600)
    //self.spY = randomRange(10,5)
   // self.spX = 0


    self.timer = 0
    self.toRemove = false

    var asteroidUpdate = self.update

    self.update = function(){
        if(self.y > 600){
            self.x = randomRange(800,0)
            self.y = randomRange(0,-600)
        }
        self.updateSpeed()
        asteroidUpdate()
        for(var i in Player.list){
            var p = Player.list[i]
            if(self.getDist(p)<15){
                

                //delete the player
                delete Player.list[i]
                
                
                console.log("dead")
                
                //self.toRemove = true
                
            }
        }
    }
    self.updateSpeed = function(){
        self.spY = randomRange(20,5)
    }

    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            spY:self.spY
        }
    }

    self.getUpdatePack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            spY:self.spY
        }
    }
    Asteroid.list[self.id] = self

    initPack.asteroid.push(self.getInitPack())
    return self
}
Asteroid.list = {}

Asteroid.update = function(){

    var pack = []
    
    for (var i in Asteroid.list) {
        var asteroid = Asteroid.list[i]
        asteroid.update()
        // if(asteroid.toRemove){
        //     delete Asteroid.list[i]
        //     removePack.asteroid.push(asteroid.id)
        // }
        // else{
        //     pack.push(asteroid.getUpdatePack())
            
        // }
        pack.push(asteroid.getUpdatePack())
        
    }

    return pack
}

Asteroid.getAllInitPack = function(){
    var asteroids = []
    for(var i in Asteroid.list){
        asteroids.push(Asteroid.list[i].getInitPack())
    }
    return asteroids
}


var gameStart= function() {
    //for loop to create all instances of asteroids
    for (var i = 0; i < numAsteroids; i++) {
        
        var asteroid = new Asteroid();
        //console.log(asteroid)
    }
    
}

//Connection to the game
io.sockets.on('connection', function(socket){
    console.log("Socket Connected")
    if(!gameRunning){
        gameRunning = true
        gameStart()
       // console.log('The game has started')
    }
    socket.id = Math.random()

    //add something to socketList
    socketList[socket.id] = socket
    
    Player.onConnect(socket)
    
    socket.emit('connected', socket.id)


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

var initPack = {
    player:[], 
    asteroid:[]
}

var removePack = {
    player:[], 
    asteroid:[]
}

//setup update loop
setInterval(function () {
    var pack = {
        player:Player.update(),
        asteroid:Asteroid.update()
    }
    //var pack = Player.update()
    for (var i in socketList) {
        var socket = socketList[i]
        socket.emit('init', initPack)
        socket.emit('update', pack)
        socket.emit('remove', removePack)
    }

    // if(Asteroid.list < numAsteroids){
    //     var asteroid = new Asteroid();
    // }
    initPack.player = []
    removePack.player = []
    // initPack.asteroid = []
    // removePack.asteroid = []
    

}, 1000 / 30)