var mongoose = require('mongoose')
var Schema = mongoose.Schema

var GameSchema = new Schema({
    score:{
        type:String,
        required:true
    },
    pName:{
        type:String,
        required:true
    }
})

mongoose.model('game', GameSchema)