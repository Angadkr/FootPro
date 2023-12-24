const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/football')
    .then(()=>{
        console.log('Connected!')
    }).catch(()=>{
        console.log('Error')
    });
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose')

const createrSchema = new Schema({
    email:{
        type:String,
        required:true,
    },
    age:Number
})

createrSchema.plugin(passportLocalMongoose)

module.exports.Creater = mongoose.model('Creater',createrSchema)

const playerSchema = new Schema({
    name:String,
    imgSrc:String,
    club:String,
    country:String,
    age:Number,
    description:String,
    creater:{type:Schema.Types.ObjectId,ref:'Creater'},
    comments:[{type:Schema.Types.ObjectId,ref:'Comment'}]
})

module.exports.Player = mongoose.model('Player',playerSchema)

const commentSchema = new Schema({
    body:String,
    user:{type:Schema.Types.ObjectId,ref:'Creater'},
    editable:{
        type:Boolean,
        default:false
    }
})

commentSchema.methods.editToggle = async function(){
    this.editable = !this.editable
    return await this.save()
}

module.exports.Comment = mongoose.model('Comment',commentSchema)