const validator = require('validator');

const sanitizaRegistro = (req,res,next)=>{
    req.body.apodo = validator.escape(validator.trim(req.body.apodo));
    if(req.body.facebook!=undefined){
        req.body.facebook =(validator.trim(req.body.facebook)).startsWith('http')? validator.escape(validator.trim(req.body.facebook))
                                                                                :validator.escape('http://'+validator.trim(req.body.facebook));
        req.body.facebook = validator.escape(validator.trim(req.body.facebook));
    }
    if(req.body.blog!=undefined){
        req.body.blog =(validator.trim(req.body.blog)).startsWith('http')? validator.escape(validator.trim(req.body.blog))
                                                                        :validator.escape('http://'+validator.trim(req.body.blog));
        req.body.blog = validator.escape(validator.trim(req.body.blog));
    }
    if(req.body.youtube!=undefined){
        req.body.youtube = (validator.trim(req.body.youtube)).startsWith('http')?   validator.escape(validator.trim(req.body.youtube))
                                                                                :validator.escape('http://'+validator.trim(req.body.youtube));
        req.body.youtube = validator.escape(validator.trim(req.body.youtube));
    }
    req.body.mail = validator.escape(validator.trim(req.body.mail));
    req.body.pass1 = validator.escape(validator.trim(req.body.pass1));
    req.body.pass2 = validator.escape(validator.trim(req.body.pass2));
    next();
}
const sanitizaLogin = (req,res,next)=>{
    req.body.apodo = validator.escape(validator.trim(req.body.apodo.toString()));
    req.body.password = validator.escape(validator.trim(req.body.password.toString()));
    next()
}
const sanitizaUserRecup = (req, res, next) => {
    req.body.apodo = validator.escape(validator.trim(req.body.apodo));
    req.body.mail = validator.escape(validator.trim(req.body.mail));
    next();
}
const sanitizaApunte = (req,res,next) => {
    if(req.body.titulo != undefined){req.body.titulo = validator.escape(validator.trim(req.body.titulo));}
    if(req.body.materia != undefined) {req.body.materia = validator.escape(validator.trim(req.body.materia));}
    if(req.body.catedra != undefined) {req.body.catedra = validator.escape(validator.trim(req.body.catedra));}
    if(req.body.autor != undefined) {req.body.autor = validator.escape(validator.trim(req.body.autor));}
    next();
}
const sanitizaLink = (req,res,next) => {  
    req.body.link = (validator.trim(req.body.link)).startsWith('http')?validator.escape(validator.trim(req.body.link)):validator.escape('http://'+validator.trim(req.body.link));                  
    next();
}
const sanitizaForo = (req, res, next) => {      
    req.body.profesor = validator.escape(validator.trim(req.body.profesor))
    req.body.materia = validator.escape(validator.trim(req.body.materia));
    req.body.catedra = validator.escape(validator.trim(req.body.catedra));
    next();
}
const sanitizaOpinion = (req, res, next) => {
    req.body.idCatedra = req.body.idCatedra.toString();
    req.body.contenido = validator.escape(validator.trim(req.body.contenido));
    next();
}
const sanitizaTema = (req, res, next) => {      
    req.body.titulo = validator.escape(validator.trim(req.body.titulo))
    req.body.pal1 = validator.escape(validator.trim(req.body.pal1));
    req.body.pal2 = validator.escape(validator.trim(req.body.pal2));
    req.body.pal3 = validator.escape(validator.trim(req.body.pal3));
    req.body.msj = validator.escape(validator.trim(req.body.msj));
    next();
}
const sanitizaComentario = (req, res, next) => {
    req.body.idTema = req.body.idTema.toString();
    req.body.comentario = validator.escape(validator.trim(req.body.comentario));
    next();
}
module.exports = {
    sanitizaRegistro,sanitizaLogin,sanitizaUserRecup,sanitizaApunte,sanitizaLink,sanitizaForo,sanitizaOpinion,sanitizaTema,sanitizaComentario
}