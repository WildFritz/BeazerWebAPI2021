var express = require('express')
var mongoose = require('mongoose')
var app = express()
var path = require('path')
var bodyparser = require('body-parser')


app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))
app.use(express.json())


mongoose.connect('mongodb://localhost:27017/scoreEntries', {
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

app.use(express.static(__dirname+"/AsteroidGame/AsteroidAvoidance"))
app.listen(5000, function()
{
    console.log("Listening on port 5000")
}) 
