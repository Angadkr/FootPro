const express = require('express')
const passport = require('passport')
const router = express.Router()
const {Creater,Player,Comment} = require('../models/football')
const axios = require('axios')
const AppError = require('../appError')
const {PlayerSchema,CreaterSchema} = require('../JoiSchemas')
const { valid } = require('joi')
const wrapAsync = function(fn){
    return function(req,res,next){
        fn(req,res,next).catch((e)=>{next(e)})
    }
}
const isloggedin = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.flash('error','Login first!!')
        req.session.path = req.originalUrl
        res.redirect('/login')
    }else{
        return next()
    }
}
const isAuthor = async(req,res,next)=>{
    const {id} = req.params
    const player = await Player.findById(id).populate('creater')
    if(req.user._id.equals(player.creater._id)){
        return next()
    }else{
        throw new AppError('You are not authorized',401)
    }
}
const isCommentAuthor = async(req,res,next)=>{
    const {cid,id} = req.params
    const comment = await Comment.findById(cid).populate('user')
    if(comment.user._id.equals(req.user._id)){
        return next()
    }else{
        throw new AppError('You are not authorized',401)
    }
}
const validatePlayer = (req,res,next)=>{
    const {error} = PlayerSchema.validate(req.body)
    if(error){
        const msg = error.details.map(el=>el.message).join(',')
        throw new AppError(msg,400)
    }else{
        next()
    }
}
const validateCreater = (req,res,next)=>{
    const {error} = CreaterSchema.validate(req.body)
    if(error){
        const msg = error.details.map(el=>el.message).join(',')
        throw new AppError(msg,400)
    }else{
        next()
    }
}


router.use((req,res,next)=>{
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})


router.get('/home',(req,res)=>{
    res.render('home')
})

router.get('/register',(req,res)=>{
    res.render('register')
})

router.get('/login',(req,res)=>{
    res.render('login')
})

router.post('/register',validateCreater,wrapAsync(async(req,res)=>{
    const {username,password,age,email} = req.body
    const creater = new Creater({username:username,age:age,password:password})
    const newCreater = await Creater.register(creater,password)
    req.logIn(newCreater,(err)=>{
        if(err){
            res.send('Could not register')
        }
        req.flash('success','Registeration is complete!')
        res.redirect('/players')
    })
}))

router.post('/login',passport.authenticate('local',{failureFlash:true,failureRedirect:'/login'}),(req,res)=>{
    const url = req.session.path || '/players'
    req.flash('success','Logged in successfully!')
    res.redirect(url)
})

router.get('/logout',(req,res)=>{
    req.logOut()
    req.flash('success','comeback soon!')
    res.redirect('/players')
})

router.get('/players',wrapAsync(async(req,res)=>{
    const players = await Player.find({}).populate('creater')
    res.render('allPlayers',{players})
}))

router.get('/new',isloggedin,(req,res)=>{
    res.render('newPlayer')
})

router.post('/new',isloggedin,validatePlayer,wrapAsync(async(req,res)=>{
    const {name,age,country,club} = req.body
    const player = new Player({name:name,age:age,club:club,country:country})
    const options = {
        method: 'GET',
        url: 'https://google-search72.p.rapidapi.com/imagesearch',
        params: {
          q: `${name}`,
          gl: 'us',
          lr: 'lang_en',
          num: '10',
          start: '0'
        },
        headers: {
          'X-RapidAPI-Key': 'ecb262da40msha892afcb2c942d3p1d89d0jsn149c9542f7ec',
          'X-RapidAPI-Host': 'google-search72.p.rapidapi.com'
        }
    };
    const dataO = await axios.request(options)
    player.imgSrc = dataO.data.items[0].originalImageUrl;
    player.creater = req.user
    const options1 = {
        method: 'GET',
        url: 'https://wiki-briefs.p.rapidapi.com/search',
        params: {
          q: `${name}`,
          topk: '3'
        },
        headers: {
          'X-RapidAPI-Key': 'ecb262da40msha892afcb2c942d3p1d89d0jsn149c9542f7ec',
          'X-RapidAPI-Host': 'wiki-briefs.p.rapidapi.com'
        }
    };
    const dataO1 = await axios.request(options1)
    player.description = dataO1.data.summary[0];
    await player.save()
    req.flash('success','New player is added in your db!')
    res.redirect('/players')
}))

router.get('/players/:id',wrapAsync(async(req,res)=>{
    const {id} = req.params
    const player = await Player.findById(id).populate('creater').populate({
        path:     'comments',			
        populate: { path:  'user',
                model: 'Creater' }
      })
    if(!player){
        throw new AppError('No player found with at id',400)
    }
    res.render('Player',{player})
}))

router.get('/players/:id/edit',isloggedin,wrapAsync(isAuthor),wrapAsync(async(req,res)=>{
    const {id} = req.params
    const player = await Player.findById(id)
    res.render('edit',{player})
}))

router.patch('/players/:id',isloggedin,wrapAsync(isAuthor),validatePlayer,wrapAsync(async(req,res)=>{
    const {id} = req.params
    const {name,age,country,club} = req.body
    const options = {
        method: 'GET',
        url: 'https://google-search72.p.rapidapi.com/imagesearch',
        params: {
          q: `${name}`,
          gl: 'us',
          lr: 'lang_en',
          num: '10',
          start: '0'
        },
        headers: {
          'X-RapidAPI-Key': 'ecb262da40msha892afcb2c942d3p1d89d0jsn149c9542f7ec',
          'X-RapidAPI-Host': 'google-search72.p.rapidapi.com'
        }
    };
    const dataO = await axios.request(options)
    const imgSrc = dataO.data.items[0].originalImageUrl;
    const options1 = {
        method: 'GET',
        url: 'https://wiki-briefs.p.rapidapi.com/search',
        params: {
          q: `${name}`,
          topk: '3'
        },
        headers: {
          'X-RapidAPI-Key': 'ecb262da40msha892afcb2c942d3p1d89d0jsn149c9542f7ec',
          'X-RapidAPI-Host': 'wiki-briefs.p.rapidapi.com'
        }
    };
    const dataO1 = await axios.request(options1)
    const description = dataO1.data.summary[0];
    await Player.findByIdAndUpdate(id,{name:name,age:age,country:country,club:club,imgSrc:imgSrc,descriptiona:description})
    req.flash('success','Updated successfully!')
    res.redirect('/players')
}))

router.delete('/players/:id',isloggedin,wrapAsync(isAuthor),wrapAsync(async(req,res)=>{
    const {id} = req.params
    const player = await Player.findById(id).populate('comments')
    for(let comment of player.comments){
        await Comment.findByIdAndDelete(comment._id)
    }
    await Player.findByIdAndDelete(id)
    req.flash('success','Deleted successfully!')
    res.redirect('/players')
}))

router.post('/players/:id/comments',isloggedin,wrapAsync(async(req,res)=>{
    const {id} = req.params
    const {body} = req.body
    const newComment = Comment({body:body})
    newComment.user = req.user
    await newComment.save()
    const player = await Player.findById(id)
    player.comments.push(newComment)
    await player.save()
    req.flash('success','Comment added!')
    res.redirect(`/players/${id}`)
}))

router.delete('/players/:id/:cid',isloggedin,wrapAsync(async(req,res,next)=>{
    const {id,cid} = req.params
    const player = await Player.findById(id).populate('creater')
    const comment = await Comment.findById(cid).populate('user')
    if(player.creater._id.equals(req.user._id) || comment.user._id.equals(req.user._id)){
        return next()
    }else{
        throw new AppError('You are not authorized to delete this comment!',401)
    }
}),wrapAsync(async(req,res)=>{
    const {id,cid} = req.params
    await Comment.findByIdAndDelete(cid)
    req.flash('success','Comment deleted')
    res.redirect(`/players/${id}`)
}))

router.get('/players/:id/:cid/edit',isloggedin,wrapAsync(isCommentAuthor),wrapAsync(async(req,res)=>{
    const {cid,id} = req.params
    
    const player = await Player.findById(id).populate('comments')
    for(let comment of player.comments){
        if(comment._id.equals(cid)){
            comment.editToggle()
        }
    }
    res.redirect(`/players/${id}`)
}))
router.patch('/players/:id/:cid',isloggedin,wrapAsync(isCommentAuthor),wrapAsync(async(req,res)=>{
    const {cid,id} = req.params
    const {body} = req.body
    const player = await Player.findById(id).populate('comments')
    for(let comment of player.comments){
        if(comment._id.equals(cid)){
            comment.editToggle()
        }
    }
    await Comment.findByIdAndUpdate(cid,{body:body})
    res.redirect(`/players/${id}`)
}))

router.get('*',(req,res)=>{
    throw new AppError('Page not found!',404)
})


router.use((err,req,res,next)=>{
    const {status=500,message='Something went wrong'}=err
    res.status(status).render('error',{status,message})
})

module.exports = router