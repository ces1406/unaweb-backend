const {Router} = require('express');
const path = require('path');
const {start,Usuarios} = require('../model/db');
const cargarImg = require('../middlewares/multer');
const mailer = require ('../common_utilities/mailer');
const {sanitizaRegistro, sanitizaLogin, sanitizaUserRecup} = require('../middlewares/sanitize');
const {validaRegistro, validaLogin, validadUserRecup} = require('../middlewares/validate');
const {Op} = require('sequelize');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const validator = require('validator');
const {autenticacionjwt} = require('../middlewares/passport');
const isAdmin = require('../middlewares/isAdmin');
const jwt = require ('jsonwebtoken');

class RutasUsuarios {
    constructor(){
        this.router = Router();
        start();
        this.routes();
    }    
    mailExist = (unMail) => {
        return new Promise(async (res,rej)=>{
            const cant = await Usuarios.count({where:{mail:unMail}});
            if(cant===0) {
                res(true); //por devolver algo
            }else{
                rej({ code: 400,msj:'El mail indicado ya esta registrado' })
            }
        })
    }
    nicknameExist = (unApodo) => {
        return new Promise(async (res,rej)=>{
            const cant = await Usuarios.count({where:{apodo:unApodo}})
            if(cant===0) {
                res(true);
            }else{
                res(false);
            }
        })
    }
    crearRandomString = () => {
        return new Promise((res,rej) => {
            crypto.randomBytes(17, (err,buff)=>{
                if(err) rej({code:500})
                res (buff.toString('hex'));
            });      
        })
    }
    crearToken = (iduser,apodo,rol)=>{
        return jwt.sign({id:iduser,nick:apodo,rol:rol}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME});
    }
    validarImg = (req, res, next) => {
        cargarImg(req, res, function (err) {
            if (err) {
                res.statusMessage = (err.code === 'LIMIT_FILE_SIZE') ? 'la imagen es demasiado grande (debe ser menor a 10 Kb)' :
                    'El tipo de imagen y su extension son erroneos (deben ser jpg, jpeg, png, o webp)';
                res.status(409).send(err.msg)
                next(err)
            } else {
                next();
            }
        })
    }
    postUsuario = async (req,res)=>{
        this.mailExist(req.body.mail)
            .then(async (rta) => {
                if(await this.nicknameExist(req.body.apodo) ){
                    return true;
                }else{
                    throw ({ code:400, msj:'El apodo indicado ya esta registrado' });
                }
            })
            .then(rta => bcrypt.genSalt(10))
            .then(salt => bcrypt.hash(req.body.pass1, salt) )
            .then(async(hash)=>{
                let token = await this.crearRandomString();
                var user = await Usuarios.create({
                    apodo:req.body.apodo,
                    contrasenia:hash,
                    mail:req.body.mail,
                    rol:'USER',
                    fechaIngreso: (new Date()).toJSON().slice(0,19).replace('T',' '),
                    estadoCuenta:'SINCONF',
                    token: token,
                    dirImg: req.file? ('user-'+req.body.apodo+path.extname(req.file.originalname).toLowerCase() ): null,
                    redSocial1:req.body.facebook,
                    redSocial2:req.body.blog,
                    redSocial3:req.body.youtube });
                return {user,token};
            })
            .then(rta => {                
                let asunto = 'Registro en el sitio UNAweb';
                let contenido = 'Hola '+req.body.apodo+', haz click en el siguiente enlace para finalizar tu registro en el sitio:\n';
                contenido += process.env.URL_BACKEND + '/usuarios/confirmregister/' + rta.user.idUsuario+ '/' + rta.token;              
                mailer(req.body.mail,asunto,contenido);
            })
            .then(rta => {
                if (req.file) {
                    fs.rename(  path.join(__dirname, '../../usersimgs/' + req.file.filename), 
                                path.join(__dirname, '../../usersimgs/user-' + req.body.apodo + path.extname(req.file.originalname).toLowerCase()), 
                                (errf) => {
                                    if (errf) throw errf
                                });
                }
            })
            .then(rta=>{
                res.status(201).send({msj: 'Te has unido a unaweb, te enviamos un mail para confirmar tu registro.'});
            })
            .catch(err=>{
                if (req.file) {
                    fs.unlink(path.join(__dirname, '../../usersimgs/' + req.file.filename), (errf) => {
                        if (errf) throw errf
                    });
                }
                res.statusMessage = err.msj
                res.status(err.code||409).send()
            })
    }
    checkNickname = async (req,res)=>{
        try {
            if(await this.nicknameExist(validator.escape(validator.trim(req.params.nick)))){
                res.status(200).send({disponible: true});
            }else{
                res.status(200).send({disponible: false});
            }            
        } catch (error) {
            return res.status(500).send();
        }        
    }
    habilitaUsuario = async (req,res)=>{
        try{      
            let users = await Usuarios.findAll({where:{idUsuario:req.params.idUsuario}});        
            if (req.params.token === users[0].token){
                await Usuarios.update({estadoCuenta:'HABILIT'},{where:{idUsuario:req.params.idUsuario}});
                res.sendFile('index.html', {
                    root: path.join(__dirname, 'confirm'),
                    dotfiles: 'deny',
                    headers: {
                      'x-timestamp': Date.now(),
                      'x-sent': true
                    }
                  }, function (err) {
                    if (err) { next(err); } 
                  });
            }      
        }catch (err) {
            return res.status(500).send();
        }         
    }
    login = async (req,res)=>{
        try{
            if( await this.nicknameExist(req.body.apodo)) throw ({code:400});
            let user = await Usuarios.findAll({where:{apodo:req.body.apodo}});
            bcrypt.compare(req.body.password,user[0].contrasenia,(err,rta)=>{
                if(rta){
                    if(err) throw err;
                    if(user[0].estadoCuenta === 'HABILIT'){
                        return res.status(201).json({usuario:{
                            apodo:user[0].apodo, 
                            idUsuario:user[0].idUsuario,
                            mail:validator.unescape(user[0].mail),
                            redSocial1: (user[0].redSocial1 === null) ? null : validator.unescape(user[0].redSocial1), 
                            redSocial2: (user[0].redSocial2 === null) ? null : validator.unescape(user[0].redSocial2),
                            redSocial3: (user[0].redSocial3 === null) ? null : validator.unescape(user[0].redSocial3), 
                            dirImg: user[0].dirImg, rol: user[0].rol
                        },token: this.crearToken(user[0].idUsuario, user[0].apodo,user[0].rol), msj: 'bienvenido a unaWeb'})
                    }else{
                        res.statusMessage = 'todavía no estas habilitado, chequea tu casilla de mail para terminar de registrarte'
                        return res.status(401).send()
                    }
                }else{
                    res.statusMessage = 'Error en el usuario o contraseña';
                    return res.status(401).send()
                }
            })            
        }catch(err){
            res.statusMessage = err.msj;
            return res.status(err.code||500).send();
        }
    }
    recuperarpassw = async (req,res)=>{
        try{
            if( await this.nicknameExist(req.body.apodo)) throw ({code:400});
            if( await Usuarios.count({where:{mail:req.body.mail}}) === 0) {throw ({code:400});}
            let user1 = await Usuarios.findAll({where:{apodo:req.body.apodo}});
            let user2 = await Usuarios.findAll({where:{mail:req.body.mail}});
            if(user1[0].idUsuario !== user2[0].idUsuario){
                res.statusMessage = 'Error en el usuario o el mail indicado';
                return res.status(401).send()
            }else{
                var pass = crypto.randomBytes(4);
                let asunto = 'olvido de contraseña en unavisuales';
                let contenido = 'Hola ' + req.body.apodo + ', tu nueva contraseña es: ' + pass.toString('hex') + ' .Si nunca solicitaste una nueva contraseña'
                contenido += ' entonces otra persona esta en conocimiento de tu apodo y tu dirección de mail registrados en nuestro sitio.';
                mailer(req.body.mail,asunto,contenido);
                bcrypt.hash(pass.toString('hex'), 10, (err, hash) => { 
                    if (err) throw ({ code: 500, msj: 'Tuvimos un inconviente, intenta mas tarde' });
                    Usuarios.update({contrasenia:hash},{where:{idUsuario:user1[0].idUsuario}});
                });
                res.status(201).send({ msj: 'Revisa tu correo para conocer tu nueva contraseña' })
            }            
        }catch(err){
            return res.status(500).send();
        }
    }
    updateUsuario = async (req,res)=>{
            switch (req.body.tipo) {
                case 'img':
                        if (req.file) {
                            // Eliminar la imagen anterior si existe
                            if (fs.existsSync(path.join(__dirname, '../../usersimgs/user-' +req.usuario.apodo+'.webp'))) {
                                fs.unlinkSync(path.join(__dirname, '../../usersimgs/user-' + req.usuario.apodo+'.webp'));
                            }else if(fs.existsSync(path.join(__dirname, '../../usersimgs/user-' +req.usuario.apodo+'.jpeg'))){
                                fs.unlinkSync(path.join(__dirname, '../../usersimgs/user-' + req.usuario.apodo+'.jpeg'));
                            }else if(fs.existsSync(path.join(__dirname, '../../usersimgs/user-' +req.usuario.apodo+'.jpg'))){
                                fs.unlinkSync(path.join(__dirname, '../../usersimgs/user-' + req.usuario.apodo+'.jpg'));
                            }else if(fs.existsSync(path.join(__dirname, '../../usersimgs/user-' +req.usuasrio.apodo+'.png'))){
                                fs.unlinkSync(path.join(__dirname, '../../usersimgs/user-' + req.usuario.apodo+'.png'));
                            }
                            fs.rename(path.join(__dirname,  '../../usersimgs/' + req.file.filename),
                                path.join(__dirname, '../../usersimgs/user-' + req.usuario.apodo + path.extname(req.file.originalname).toLowerCase()),
                                (err1) => {
                                    if (err1){
                                        res.statusMessage = 'Tuvimos un inconviente, intenta mas tarde' 
                                        res.status(500).send();
                                    }else{
                                        Usuarios.update({dirImg:'user-'+req.usuario.apodo+path.extname(req.file.originalname).toLowerCase()},{where:{idUsuario:req.usuario.idUser}});
                                        res.status(201).send({ msj: 'La imagen fue reemplazada con exito' })
                                    }
                                });
                        }                        
                    break;
                case 'pass': 
                    if (validator.isEmpty(validator.escape(validator.trim(req.body.pass0))) ||
                        validator.isEmpty(validator.escape(validator.trim(req.body.pass1))) ||
                        validator.isEmpty(validator.escape(validator.trim(req.body.pass2)))) {
                        return res0.status(401).send()
                    } else {
                        let usuario = await Usuarios.findAll({where:{idUsuario:req.usuario.idUser}});
                        if (usuario[0] === undefined) return res0.status(401).send();
                        if (usuario[0].contrasenia) {
                            bcrypt.compare(req.body.pass0, usuario[0].contrasenia, (err, rta) => {
                                if (rta) {
                                    if (err) return res0.status(401).send();
                                    if (usuario[0].estadoCuenta === 'HABILIT') {
                                        bcrypt.hash(req.body.pass1, 10)
                                            .then(passHashed => Usuarios.update({contrasenia:passHashed},{where:{idUsuario:req.usuario.idUser}}) )
                                            .then(rta => { res.status(201).send({ msj: 'tu contraseña ha sido modificada' }) })
                                            .catch((err) => {
                                                res.statusMessage = err.msj || err;
                                                res.status(409).send();
                                            });
                                    } else {
                                        return res.status(401).send();
                                    };
                                } else {
                                    // contrasenia incorrecta
                                    res.statusMessage = 'Error en el usuario o contraseña';
                                    return res.status(401).send()
                                }
                            });
                        } else {
                            // contrasenia vacía
                            res.statusMessage = 'Error en el usuario o contraseña';
                            return res.status(401).send()
                        }
                    }
                    break;
                case 'mail':
                    if (!validator.isEmail(validator.escape(validator.trim(req.body.mail)))) {
                        res.status(409).send()
                    } else {
                        let user = await Usuarios.findOne({where:{mail:req.body.mail}})
                        if(user === null){
                            await Usuarios.update({mail:req.body.mail},{where:{idUsuario:req.usuario.idUser}});
                            res.status(201).send({ msj: 'Se modifico tu dirección de mail'})
                        }else{
                            res.status(409).send();
                        }
                    }
                    break;
                case 'redSoc1':
                    let redSoc1 = (validator.trim(req.body.redSoc1)).startsWith('http')?validator.escape(validator.trim(req.body.redSoc1)):validator.escape('http://'+validator.trim(req.body.redSoc1));        
                    Usuarios.update({redSocial1:redSoc1},{where:{idUsuario:req.usuario.idUser}})
                        .then(rta => {
                            res.status(201).send({ msj:'Se modifico tu dirección red social' })
                        })
                        .catch((err) => {
                            res.statusMessage = err.msj || err;
                            res.status(409).send()
                        });
                    break;
                case 'redSoc2':
                    let redSoc2 = (validator.trim(req.body.redSoc2)).startsWith('http')?validator.escape(validator.trim(req.body.redSoc2)):validator.escape('http://'+validator.trim(req.body.redSoc2));
                    Usuarios.update({redSocial2:redSoc2},{where:{idUsuario:req.usuario.idUser}})
                        .then(rta => {
                            res.status(201).send({ msj:'Se modifico tu dirección red social' })
                        })
                        .catch((err) => {
                            res.statusMessage = err.msj || err;
                            res.status(409).send()
                        });
                    break;
                case 'redSoc3':
                    let redSoc3 = (validator.trim(req.body.redSoc3)).startsWith('http')?validator.escape(validator.trim(req.body.redSoc3)):validator.escape('http://'+validator.trim(req.body.redSoc3));
                    Usuarios.update({redSocial3:redSoc3},{where:{idUsuario:req.usuario.idUser}})
                        .then(rta => {
                            res.status(201).send({ msj: 'Se modifico tu dirección red social' })
                        })
                        .catch((err) => {
                            res.statusMessage = err.msj || err;
                            res.status(409).send()
                        });
                    break;
                case 'estado':
                    if(req.usuario.rol==='ADMIN'){
                        if (validator.isEmpty(validator.escape(validator.trim(req.body.estado)))) {
                            res.status(409).send()
                        } else {
                            Usuarios.update({estadoCuenta:req.body.estado},{where:{idUsuario:req.body.idUser}})
                                .then(rta => {
                                    res.status(201).send({ msj:'Estado de cuanta del usuario modificado' })
                                })
                                .catch((err) => {
                                    res.status(409).send()
                                });
                        }
                    }else{
                        res.status(403).send();
                    }                    
                    break;
                default:
                    break;
            }
    }
    getUsuarioData = async(req,res)=>{
        try {
            let user = await Usuarios.findOne({where:{apodo:req.params.apodo}})
            if(user==undefined){
                return res.status(200).send()
            }else{
                return res.status(200).json({
                    apodo:user.apodo,
                    idUsuario:user.idUsuario,
                    estadoCuenta:user.estadoCuenta,
                    redSocial1:(user.redSocial1 == undefined) ? null : validator.unescape(user.redSocial1),
                    redSocial2:(user.redSocial2 == undefined) ? null : validator.unescape(user.redSocial2),
                    redSocial3:(user.redSocial3 == undefined) ? null : validator.unescape(user.redSocial3),
                    fechaIngreso:user.fechaIngreso
                })  
            }
        } catch (err) {
            res.statusMessage = err.msj;
            return res.status(err.code||500).send()
        }
    }
    getAvatar = async (req,res)=>{
        try{
            let user = await Usuarios.findOne({where:{apodo:req.params.dir.slice(5, req.params.dir.lastIndexOf("."))}});
            var img = fs.createReadStream(path.join(__dirname, '../../usersimgs', user.dirImg));
            img.on('open', () => {
                res.set('Content-type', 'image/' + path.extname(req.params.dir).slice(1))
                img.pipe(res)
            })
            img.on('error', (err) => {
                res.set('Content-Type', 'text/plain');
                res.status(404).send('not found')
            })
        }catch(err){
            return res.status(500).send();
        } 
    }
    routes(){
        this.router.post('/', this.validarImg, sanitizaRegistro, validaRegistro, this.postUsuario);
        this.router.post('/login',sanitizaLogin, validaLogin, this.login);
        this.router.post('/recuperapass',sanitizaUserRecup, validadUserRecup, this.recuperarpassw);
        this.router.post('/update/', autenticacionjwt, this.validarImg,this.updateUsuario);
        this.router.get('/getuserdata/:apodo',autenticacionjwt,isAdmin,this.getUsuarioData);      
        this.router.get('/checknick/:nick',this.checkNickname);
        this.router.get('/avatar/:dir',this.getAvatar);
        this.router.get('/confirmregister/:idUsuario/:token',this.habilitaUsuario);
    }
}

module.exports = RutasUsuarios;