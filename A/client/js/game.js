var socket = io()

var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')
var chatText = document.getElementById('chat-text')
var chatInput = document.getElementById('chat-input')
var chatForm = document.getElementById('chat-form')
var px = 0
var py = 0
var clientId
ctx.font = "30px Arial"
// var cookieSprite = new Image();

// cookieSprite.src = "images/cookie.png";


// cookieSprite.onload = function(){
//     main();
// }


function randomRange(high, low) {
    return Math.random() * (high - low) + low;
}


var Player= function(initPack){
    var self = {}
    self.id = initPack.id
   // self.number = initPack.number
    self.x = initPack.x
    self.y = initPack.y
    self.up = false
    self.left = false
    self.right = false

    self.draw = function(){
        ctx.save();
        // ctx.save();
        ctx.translate(this.x,this.y);


        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.moveTo(0, -10);
        ctx.lineTo(10, 10);
        ctx.lineTo(-10, 10);
        ctx.lineTo(0, -10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    Player.list[self.id] = self
    return self
}

Player.list = {}

var Asteroids = function(initPack){
    var self = {}
    self.id = initPack.id
    self.x = initPack.x
    self.y = initPack.y

    self.color = "black";

    self.draw = function(){ 
        //ctx.fillRect(self.x-5, self.y-5, 10, 10)

        ctx.save();
        //draws original circles for asteroids
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = self.color;
        ctx.arc(self.x, self.y, 10, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
        //ctx.drawImage(cookieSprite, self.x, self.y, 10, 10)
        ctx.restore();
        
    }

    Asteroids.list[self.id] = self
    return self
}

Asteroids.list = {}


socket.on('connected', function (data) {
    clientId = data
    console.log(clientId)
})

socket.on('init', function(data){
    for(var i =0;i<data.player.length;i++){
        new Player(data.player[i])
    }

    for(var i =0;i<data.asteroid.length;i++){
        new Asteroids(data.asteroid[i])
    }

})

socket.on('update', function(data){
    //sets player position
    for(var i =0; i<data.player.length; i++){
        if(clientId == data.player[i].id){
            px = data.player[i].x
            py = data.player[i].y
        }
        //ctx.fillText(data.player[i].number, data.player[i].x, data.player[i].y)
        var pack = data.player[i]
        var p = Player.list[pack.id]

        if(p){
            if(pack.x !== undefined){
                p.x = pack.x
            }
            if(pack.y !== undefined){
                p.y = pack.y
            }
            
        }

    }

    for(var i =0;i<data.asteroid.length;i++){
        var pack = data.asteroid[i]
        var a = Asteroids.list[pack.id]
        if(a){
            if(pack.x !== undefined){
                a.x = pack.x
            }
            if(pack.y !== undefined){
                a.y = pack.y
               // console.log(a.y)
            }
        }
    }

})


//remove
socket.on('remove', function(data){
    for(var i =0;i<data.player.length;i++){
        delete Player.list[data.player[i]]
    }
    // for(var i =0;i<data.asteroid.length;i++){
    //     delete Asteroid.list[data.asteroid[i]]
    // }


})

setInterval(function(){
    if (!clientId)
        return;
    ctx.clearRect(0, 0, 800, 600)
    for(var i in Player.list){
        //Draw function will go here
        Player.list[i].draw()
    }
    for(var i in Asteroids.list){
        //Draw function will go here
        Asteroids.list[i].draw()
    }
},1000/30)



//Event listeners for keypresses and mouseclicks and mouse position
document.addEventListener('keydown', keyPressDown)
document.addEventListener('keyup', keyPressUp)

    function keyPressDown(e) {
        if (e.keyCode === 87)//up
            socket.emit('keypress', { inputId: "up", state: true })
        // else if (e.keyCode === 83)//down
        //     socket.emit('keypress', { inputId: "down", state: true })
        else if (e.keyCode === 65)//left
            socket.emit('keypress', { inputId: "left", state: true })
        else if (e.keyCode === 68)//right
            socket.emit('keypress', { inputId: "right", state: true })

    }

    function keyPressUp(e) {
        if (e.keyCode === 87)//up
            socket.emit('keypress', { inputId: "up", state: false })
        // else if (e.keyCode === 83)//down
        //     socket.emit('keypress', { inputId: "down", state: false })
        else if (e.keyCode === 65)//left
            socket.emit('keypress', { inputId: "left", state: false })
        else if (e.keyCode === 68)//right
            socket.emit('keypress', { inputId: "right", state: false })

    }



// socket.on('newPositions', function(data){
//     ctx.clearRect(0,0,canvas.width,canvas.height)
//     for(var i =0; i<data.player.length; i++){
//         if(clientId == data.player[i].id){
//             px = data.player[i].x
//             py = data.player[i].y
//         }
//         ctx.fillText(data.player[i].number, data.player[i].x, data.player[i].y)
        

//         ctx.restore();
//     }

// })

socket.on('addToChat', function(data){
    chatText.innerHTML += `<div>${data}</div>`
})

socket.on('evalResponse', function(data){
    chatText.innerHTML += `<div>${data}</div>`
    console.log(data)
})


chatForm.onsubmit = function(e){
    e.preventDefault()

    if(chatInput.value[0]==='/'){
        socket.emit('evalServer', chatInput.value.slice(1))  
    }else{
        socket.emit('sendMessageToServer', chatInput.value)
    }
    
    //clear out the input field
    chatInput.value = ""
}
