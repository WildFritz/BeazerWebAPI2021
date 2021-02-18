var socket = io()

var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')
var chatText = document.getElementById('chat-text')
var chatInput = document.getElementById('chat-input')
var chatForm = document.getElementById('chat-form')
ctx.font = "30px Arial"
px = 0
py = 0
var clientId

var cookieSprite = new Image();

cookieSprite.src = "images/cookie.png";


cookieSprite.onload = function(){
    main();
}


socket.on('connected',function(data){
    clientId = data
})

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



socket.on('newPositions', function(data){
    ctx.clearRect(0,0,canvas.width,canvas.height)
    for(var i =0; i<data.player.length; i++){
        if(clientId == data.player[i].id){
            px = data.player[i].x
            py = data.player[i].y
        }
        ctx.fillText(data.player[i].number, data.player[i].x, data.player[i].y)
        // ctx.save();
        // ctx.beginPath();
        // ctx.fillStyle = "red";
        // ctx.moveTo(0, -10);
        // ctx.lineTo(10, 10);
        // ctx.lineTo(-10, 10);
        // ctx.lineTo(0, -10);
        // ctx.closePath();
        // ctx.fill();

        ctx.restore();
    }

})

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
