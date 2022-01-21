const {ExtractJwt} = require('passport-jwt');
const StrategyJwt = require('passport-jwt').Strategy;
const passport = require('passport');
require('../model/connectdb');
const {Usuarios} = require('../model/mongodb');
//const {start,Usuarios} = require('../model/db');

// Initializing passport and setting his verification's callback:
var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;

const verifyCallback = async (jwtPayload,done)=>{ 
    //start();
    //let user = await Usuarios.findOne({where:{idUsuario:jwtPayload.id}});
    let user = await Usuarios.findOne({_id:jwtPayload.id})
    done(null,true,{usuario:{apodo:jwtPayload.nick,idUser:jwtPayload.id,rol:jwtPayload.rol}});
}
const pasaporteJwt = new StrategyJwt(opts,verifyCallback);

// Authentication callback:
const autenticacionjwt = (req,res,next) => {
    passport.authenticate('autenticacionjwt', {session:false},(err,encontrado,user)=>{
        if (err) {
            return next(err);
        }
        if(!encontrado){
            let error = new Error();
            error.code = 401;
            error.message = 'Error en el loggeo';
            next(error);
        }else{
            req.usuario = user.usuario;
            next();
        }     
    })(req,res,next)
};

module.exports = {pasaporteJwt, autenticacionjwt}