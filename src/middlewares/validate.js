const validator = require('validator');

const validaRegistro = (req, res, next) => {
    if (!validator.isEmail(req.body.mail)) res.status(409).send();
    if (validator.isEmpty(req.body.apodo) || validator.isEmpty(req.body.pass1) || validator.isEmpty(req.body.pass2)) res.status(409).send();
    if (!validator.equals(req.body.pass1, req.body.pass2)) res.status(409).send();
    if (req.body.apodo.length > 40) res.status(409).send();
    if ((req.body.facebook!=undefined && req.body.facebook.length > 140) || 
        (req.body.blog!=undefined && req.body.blog.length > 140) || 
        (req.body.youtube!=undefined &&req.body.youtube.length > 140)) res.status(409).send();
    if (req.body.pass1.length > 8 || req.body.pass1.length < 6 || req.body.pass1 !== req.body.pass2){
        res.status(409).send();
    }else { 
        next();
    }
};
const validaLogin = (req, res, next) => {
    if (validator.isEmpty(req.body.apodo) || validator.isEmpty(req.body.password) || (req.body.password.length > 8 || req.body.password.length < 6) ){
        res.statusMessage = 'Usuario o contraseña erróneos';
        res.status(400).send()
        next(new Error());
    } else {
        next()
    }
}
const validadUserRecup = (req, res, next) => {
    if (!validator.isEmail(req.body.mail)) {
        res.statusMessage = 'mail incorrecto';
        res.status(400).send();
    }
    if (validator.isEmpty(req.body.apodo)) {
        res.statusMessage = 'apodo incorrecto';
        res.status(400).send();
    };
    next();
}
const validaApunte = (req,res,next) => {
    if ((req.body.titulo != undefined && req.body.titulo.length > 100) || 
        (req.body.autor != undefined && req.body.autor.length > 120) || 
        (req.body.materia != undefined && req.body.materia.length > 120) || 
        (req.body.catedra != undefined && req.body.catedra.length > 100) ) {
        res.status(201).send({ msj: 'Algunos campos son demasiado extensos' })        
    } else {
        next();
    }
}
const validaEnlace = (req,res,next) => {
    if (req.body.link.length > 270) {
        res.status(201).send({ msj: 'Dirección del enlace demasiado extensa' })        
    } else {
        next();
    }
}
const validaForo = (req, res, next) => {
    if (req.body.profesor > 100 || req.body.materia.length > 120 || req.body.catedra.length > 60) {
        res.status(500).send({ msj: 'algunos campos son demasiado extensos' })
    } else {
        next();
    }
}
const validaOpinion = (req, res, next) => {
    if (!validator.isInt(req.body.idCatedra)) {
        res.status(400).send()
    } else if (req.body.contenido.length === 0 || req.body.contenido.length > 20000) {
        res.status(201).send({ msj: 'completa correctamente el comentario' });
    } else {
        next();
    }
}
const validaTema = (req, res, next) => {
    if (req.body.msj.length > 20000) {
        res.status(201).send({ msj: 'mensaje demasiado extenso' })
    } else if (req.body.titulo.length > 180 || req.body.titulo.length == 0) {
        res.status(201).send({ msj: 'completa el titulo del tema correctamente' });
    } else if (req.body.pal1.length > 24 || req.body.pal2.length > 24 || req.body.pal3.length > 24 || req.body.pal1.length == 0 || req.body.pal2.length == 0 || req.body.pal3.length == 0) {
        res.status(201).send({ msj: 'completa correctamente las 3 palabras relacionadas' });
    } else {
        next();
    }
}
const validaComentario = (req, res, next) => {
    if (!validator.isInt(req.body.idTema)) {
        res.status(201).send({ msj: 'Error-idTema' });
    } else if (req.body.comentario.length === 0 || req.body.comentario.length > 20000) {
        res.status(201).send({ msj: 'completa correctamente el comentario' });
    } else {
        next();
    }
}
module.exports = {
    validaRegistro,validaLogin,validadUserRecup,validaApunte,validaEnlace,validaForo,validaOpinion,validaTema,validaComentario
}