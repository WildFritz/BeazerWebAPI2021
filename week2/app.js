var express = require('express')
var mongoose = require('mongoose')
var app = express()
var path = require('path')
var bodyparser = require('body-parser')
var router = express.Router()

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))
app.use(express.json())

mongoose.connect('mongodb://localhost:27017/gameEntries', {
    useNewUrlParser:true
}).then(function()
{
    console.log("connected to MangoDB Database")
}).catch(function(err)
{
    console.log(err)
})

//Load in database templates
require('./models/Game')
var Game = mongoose.model('game')

//basic code for savin an entry
/*var Game = mongoose.model('Game', {nameofgame:String})

var game = new Game({nameofgame: "Skyrim"})
game.save().then(function(){
    console.log("Game Saved")
})*/

//Example of a Post Route
app.post('/saveGame', function(req, res){
    console.log("Request Made")
    console.log(req.body)

    new Game(req.body).save().then(function(){
        res.redirect('gamelist.html')
    })
})

app.get('/getData', function(req, res){
    Game.find({}).then(function(game){
        res.json({game})
    })
})

//post route to delete game emtry
app.post('/deleteGame', function(req, res){
    console.log('Game deleted', req.body._id)
    Game.findBYIdAndDelete(req.body._id).exec()
    res.redirect('gamelist.html')
})

app.use(express.static(__dirname+"/views"))
app.listen(3000, function()
{
    console.log("Listening on port 3000")
}) 

console.log("Please Work")