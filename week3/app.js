var express = require('express')
var app = express()
var serv = require('http').Server(app)
var io = require('socket.io')(serv, {})

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
var playerList = {}

var Player = function(id){
    var self = {
        x:400,
        y:300,
        id: id,
        number:  Math.floor(Math.random() * 10),
        right:  false,
        left:  false,
        up:  false,
        down:  false,
        speed:  10
    }
    self.updatePosition = function(){
        if(self.right)
        self.x += self.speed
        if(self.left)
        self.x -= self.speed
        if(self.up)
        self.y -= self.speed
        if(self.down)
        self.y += self.speed
    }
    return self
}

io.sockets.on('connection', function(socket){
    console.log("Socket Connected")

    socket.id = Math.random()
   // socket.x = 0
   // socket.y = Math.floor(Math.random() * 600)
   // socket.number = Math.floor(Math.random() * 10)

    //add something to socketList
    socketList[socket.id] = socket
    

    var player = new Player(socket.id)
    playerList[socket.id] = player

    //disconnection event
    socket.on('disconnect',function(){
        delete socketList[socket.id]
        delete playerList[socket.id]
    })

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

//setup update loop
setInterval(function () {
    var pack = []
    
    for (var i in playerList) {
        var player = playerList[i]
        player.updatePosition()
       // console.log(player)
        pack.push({
            x: player.x,
            y: player.y,
            number:player.number
        })
    }
    for (var i in socketList) {
        var socket = socketList[i]
        socket.emit('newPositions', pack)
    }
}, 1000 / 30)