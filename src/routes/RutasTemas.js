const {Router} = require('express');
const RutasApuntes = require('./RutasApuntes');
const RutasCursos = require('./RutasCursos');
require('../model/connectdb');
const { Catedras, Secciones, Temas, Comentarios, ComentariosCatedras} = require('../model/mongodb');
const {sanitizaTema,sanitizaComentario} = require('../middlewares/sanitize');
const {validaTema,validaComentario} = require('../middlewares/validate');
const isAdmin = require('../middlewares/isAdmin');
const validator = require('validator');
const { autenticacionjwt } = require('../middlewares/passport');

class RutasTemas {
    constructor(){
        start();
        this.router = Router();
        this.enrutar()
        this.routes();
    }
    enrutar = ()=>{
        const rutasCursos = new RutasCursos();
        const rutasApuntes = new RutasApuntes();
        this.router.use('/cursos',rutasCursos.router);
        this.router.use('/apuntes',rutasApuntes.router);
    }
    getTema = async (req,res)=>{
        try {
            await Temas.findOne({idTema:req.params.idTema}).populate('idUsuario').exec((err,rta)=>{
                rta.dataValues.cantComents = await Comentarios.count({where:{idTema:req.params.idTema}});
                rta.comentarioInicial = validator.unescape(rta.comentarioInicial);
                rta.Usuario.redSocial1 = (rta.Usuario.redSocial1 == undefined)? null : validator.unescape(rta.Usuario.redSocial1);
                rta.Usuario.redSocial2 = (rta.Usuario.redSocial2 == undefined)? null : validator.unescape(rta.Usuario.redSocial2);
                rta.Usuario.redSocial3 = (rta.Usuario.redSocial3 == undefined)? null : validator.unescape(rta.Usuario.redSocial3);
                return res.status(200).json({rta})
            });
        } catch (error) {
            res.status(500).send();
        }
    }
    getComentarios = async (req,res)=>{
        try {
            await Comentarios.find({idTema: req.params.idTema})
                .sort({fechaHora: 'asc'})
                .skip((req.params.pagActiva-1)*req.params.cantPorPag)
                .limit(parseInt(req.params.cantPorPag,10))
                .populate('idUsuario')
                .exec(async(err,rta)=>{
                    for await (let com of rta) {     
                        com.Usuario.redSocial1 = (com.idUsuario.redSocial1 == undefined) ? null : validator.unescape(com.idUsuario.redSocial1);
                        com.Usuario.redSocial2 = (com.idUsuario.redSocial2 == undefined) ? null : validator.unescape(com.idUsuario.redSocial2);
                        com.Usuario.redSocial3 = (com.idUsuario.redSocial3 == undefined) ? null : validator.unescape(com.idUsuario.redSocial3);  
                        com.contenido = validator.unescape(com.contenido);
                    }
                    return res.status(200).json(rta);
                });
        } catch (error) {
            res.status(500).send();
        }        
    }
    postTema = async (req,res)=>{
        try {
            let tema = await new Temas({
                titulo:req.body.titulo,
                idSeccion:req.body.idSec,
                idUsuario:req.usuario.idUser,
                palabraClave1:req.body.pal1,
                palabraClave2:req.body.pal2,
                palabraClave3:req.body.pal3,
                comentarioInicial:req.body.msj,
                fechaCreacion:new Date()
            });
            tema.save();
            res.status(201).send({ msj: 'el tema fue creado' })
        } catch (error) {
            res.status(500).send();
        }
    }
    deletTema = async (req,res)=>{
        try {
            await Temas.findByIdAndDelete(req.body.idTema);
            res.status(201).send({ msj: 'el tema se elimino' });
        } catch (err) {
            return res.status(500).send();
        }
    }
    comentar = async (req,res)=>{
        try {
            let coment = await new Comentarios({
                contenido:req.body.comentario,
                idTema:req.body.idTema,
                idUsuario:req.usuario.idUser,
                fechaHora:new Date()
            });
            res.status(201).send({ msg: 'tema comentado' })            
        } catch (error) {
            res.status(500).send();
        }
    }
    ultimosComentarios = async (req,res)=>{
        try {
            let idSeccionCat = await Secciones.find({nombreSeccion:'Opiniones de cátedras y profesores'});
            let rta =[];
            let rta1 = await Comentarios.find().sort({fechaHora:-1}).limit(10).populate('idUsuario').exec();
            let rta2 = await ComentariosCatedras.find().sort({fechaHora:-1}).limit(10).populate('idUsuario').exec();
            for await (let com of rta=(rta1.concat(rta2))) {
                com.contenido = validator.unescape(com.contenido);
                com.mili=com.fechaHora.getTime();
                if(com.idTema==undefined){
                    com.idSeccion=idSeccionCat.idSeccion;
                    com.origen=await Catedras.findOne({idCatedra:com.idCatedra});
                }else{
                    com.origen= await Temas.findOne({idTema:com.idTema}).populate('idSeccion').exec();
                }
            }
            return res.status(200).json(rta.sort((a,b)=>b.dataValues.mili-a.dataValues.mili).slice(0,10));
        } catch (error) {
            res.status(500).send();
        }
    }
    buscaPalabra = async (req,res)=>{
        try {
            req.params.palabra = validator.escape(validator.trim(req.params.palabra));
            if (req.params.palabra.length === 0 || req.params.palabra.length > 30) {
                res.status(201).send({ msj: 'completa correctamente el comentario' });
            }else{
                await Temas.find({$or:[{palabraClave1:new RegExp(req.params.palabra)},{palabraClave2:new RegExp(req.params.palabra)},{palabraClave3:new RegExp(req.params.palabra)}]})
                    .populate('idSeccion')
                    .exec(async(err,rta)=>{
                        for await (let com of rta) { 
                            com.fechaCreacion = new Date(com.fechaCreacion)
                            com.mili = com.fechaCreacion.getTime();
                            com.comentarioInicial = validator.unescape(com.comentarioInicial);
                        }
                        return res.status(200).json(rta);
                    });
            } 
        } catch (error) {
            res.status(500).send();            
        }
    }
    routes(){
        this.router.get('/ultimoscomentarios',this.ultimosComentarios);
        this.router.get('/:idTema', this.getTema);
        this.router.get('/comentarios/:idTema/:pagActiva/:cantPorPag',this.getComentarios);
        this.router.get('/busqueda/:palabra',this.buscaPalabra);
        this.router.post('/',sanitizaTema,validaTema,autenticacionjwt,this.postTema);
        this.router.post('/deleteTema',autenticacionjwt,isAdmin,this.deletTema);
        this.router.post('/comentar',sanitizaComentario,validaComentario,autenticacionjwt,this.comentar);
    }
}

module.exports = RutasTemas;