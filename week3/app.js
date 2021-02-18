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
serv.listen(3000, function(){
    console.log('Connected on localhost 3000')
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
    self.down = false
    self.attack = false
    self.mouseAngle = 0
    self.speed = 10
    self.hp = 10,
    self.hpMax = 10,
    self.score = 0

    var playerUpdate = self.update

    self.update = function(){
        self.updateSpeed()
        playerUpdate()
        
     //   if(Math.random() < 0.1){
     //       self.shoot(Math.random()*360)
     //   }
     if(self.attack){
        self.shoot(self.mouseAngle)
    }
    }

    self.shoot = function(angle){
        var b = Bullet(self.id, angle)
        b.x = self.x
        b.y = self.y  
    }

    self.updateSpeed = function(){
        if(self.right){
            self.spX = self.speed
        }     
        else if(self.left){
            self.spX = -self.speed
        }
        else{
            self.spX = 0
        }
        if(self.up){
            self.spY = -self.speed
        }  
        else if(self.down){
            self.spY = self.speed
        }
        else{
           self.spY = 0
        }
    }

    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            hp:self.hp,
            hpMax:self.hpMax,
            score:self.score
        }
    }

    self.getUpdatePack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            hp:self.hp,
            score:self.score
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
        if (data.inputId === 'down')
            player.down = data.state
        if (data.inputId === 'left')
            player.left = data.state
        if (data.inputId === 'right')
            player.right = data.state

        if (data.inputId === 'attack')
            player.attack = data.state
        if (data.inputId === 'mouseAngle')
            player.mouseAngle = data.state
    })

    socket.emit('init', {
        player:Player.getAllInitPack(),
        bullet:Bullet.getAllInitPack(),

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

var Bullet = function(parent, angle){
    var self = GameObject()
    self.id = Math.random()
    self.spX = Math.cos(angle/180 * Math.PI) * 10
    self.spY = Math.sin(angle/180 * Math.PI) * 10
    self.parent = parent

    self.timer = 0
    self.toRemove = false

    var bulletUpdate = self.update
    self.update = function(){
        if(self.timer++ > 100){
            self.toRemove = true
        }
        bulletUpdate()
        for(var i in Player.list){
            var p =Player.list[i]
            if(self.getDist(p)<25 && self.parent !== p.id){
                //damage or hp for health
                p.hp -= 1

                if(p.hp <=0){
                    var shooter = Player.list[self.parent]

                    if(shooter){
                        shooter.score += 1
                    }

                    p.hp = p.hpMax
                    p.x = Math.random() * 800
                    p.y = Math.random() * 600
                }
                
                
                
                
                self.toRemove = true
                
            }
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
    Bullet.list[self.id] = self

    initPack.bullet.push(self.getInitPack())
    return self
}
Bullet.list = {}

Bullet.update = function(){
    //create bullets
    //if(Math.random() < 0.1){
    //  Bullet(Math.random()*360)
    //}

    var pack = []
    
    for (var i in Bullet.list) {
        var bullet = Bullet.list[i]
        bullet.update()
        if(bullet.toRemove){
            delete Bullet.list[i]
            removePack.bullet.push(bullet.id)
        }
        else{
            pack.push(bullet.getUpdatePack())
        }

        
    }

    return pack
}

Bullet.getAllInitPack = function(){
    var bullets = []
    for(var i in Bullet.list){
        bullets.push(Bullet.list[i].getInitPack())
    }
    return bullets
}

//======== User Collection setup
var Players = {
    "Matt": "123",
    "Dylan": "111",
    "Ronny": "222",
    "Maleek": "777",
}

var isPasswordValid = function(data, cb){
    PlayerData.findOne({username:data.username}, function(err,username){
        //console.log(username)
        cb(data.password == username.password)
    })

    //return Players[data.username] === data.password
}

var isUsernameTaken = function(data, cb){
    PlayerData.findOne({username:data.username}, function(err,username){
        //console.log(username)
       // cb(data.username == username.username)
        if(username == null){
            cb(false)
        }else{
            cb(true)
        }
    })
  
    // return Players[data.username]
}

var addUser = function(data){
   // Players[data.username] = data.password
   new PlayerData(data).save()
}

//Connection to the game
io.sockets.on('connection', function(socket){
    console.log("Socket Connected")

    socket.id = Math.random()
   // socket.x = 0
   // socket.y = Math.floor(Math.random() * 600)
   // socket.number = Math.floor(Math.random() * 10)

    //add something to socketList
    socketList[socket.id] = socket
    
    
    

    //signIn event
    socket.on('signIn',function(data){
       
    //    if(isPasswordValid(data)){
    //        Player.onConnect(socket)
    //        //send the id to the client
    //        socket.emit('connected', socket.id)
    //        socket.emit('signInResponse', {success:true})
    //    }else{
    //     socket.emit('signInResponse', {success:false})

    isPasswordValid(data, function(res){
        if(res) {
            Player.onConnect(socket)

            socket.emit('connected', socket.id)
            socket.emit('signInResponse', {success: true})
        } else{
            socket.emit('signInReponse', {success: true})
        }
    })
       
})

      //signUp event
      socket.on('signUp',function(data){
        // if(isUsernameTaken(data)){
        //     socket.emit('signUpResponse', {success:false})
        // }else{
        //     addUser(data)
        //     socket.emit('signUpResponse', {success:true})
        // }

        isUsernameTaken(data, function(res){
            if(res){
                socket.emit('signUpResponse', {success:false})
            }else{
            addUser(data)
            socket.emit('signUpResponse', {success:true})
        }

     })

    })
 


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
    //old examples from wednesday
    // socket.on('sendMsg', function(data){
    //     console.log(data.message)
    // })

    // socket.on('sendBtnMsg', function(data){
    //     console.log(data.message)
    // })

    // socket.emit('messageFromServer', {
    //     message: 'Hey Maleek do you like the way I WOO'
    // })
})

var initPack = {
    player:[], 
    bullet:[]
}

var removePack = {
    player:[], 
    bullet:[]
}

//setup update loop
setInterval(function () {
    var pack = {
        player:Player.update(),
        bullet:Bullet.update()
    }
    //var pack = Player.update()
    for (var i in socketList) {
        var socket = socketList[i]
        socket.emit('init', initPack)
        socket.emit('update', pack)
        socket.emit('remove', removePack)
    }
    initPack.player = []
    initPack.bullet = []
    removePack.player = []
    removePack.bullet = []

}, 1000 / 30)