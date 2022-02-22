const {Router} = require('express');
const RutasApuntes = require('./RutasApuntes');
const RutasCursos = require('./RutasCursos');
const path = require('path');
const {start,Secciones,ComentariosCatedra,Temas,Comentarios,Usuarios,Catedras} = require('../model/db');
const {Op} = require('sequelize');
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
            let rta = await Temas.findOne({
                include:[{
                    model:Usuarios,
                    required:true,
                    attributes:['apodo','dirImg','redSocial1','redSocial2','redSocial3'],                    
                }],
                where:{idTema:req.params.idTema}
            });
            rta.dataValues.cantComents = await Comentarios.count({where:{idTema:req.params.idTema}});
            rta.comentarioInicial = validator.unescape(rta.comentarioInicial);
            rta.Usuario.redSocial1 = (rta.Usuario.redSocial1 == undefined)? null : validator.unescape(rta.Usuario.redSocial1);
            rta.Usuario.redSocial2 = (rta.Usuario.redSocial2 == undefined)? null : validator.unescape(rta.Usuario.redSocial2);
            rta.Usuario.redSocial3 = (rta.Usuario.redSocial3 == undefined)? null : validator.unescape(rta.Usuario.redSocial3);
            return res.status(200).json({rta})
        } catch (error) {
            res.status(500).send();
        }
    }
    getComentarios = async (req,res)=>{
        try {
            let rta = await Comentarios.findAll({
                include:[{
                    model:Usuarios,
                    required:true,
                    attributes:['apodo','dirImg','redSocial1','redSocial2','redSocial3']
                }],
                where:{idTema:req.params.idTema},
                order:[['fechaHora','ASC']],
                offset:(req.params.pagActiva-1)*req.params.cantPorPag,
                limit:parseInt(req.params.cantPorPag,10)
            });
            for await (let com of rta) {     
                com.Usuario.redSocial1 = (com.Usuario.redSocial1 == undefined) ? null : validator.unescape(com.Usuario.redSocial1);
                com.Usuario.redSocial2 = (com.Usuario.redSocial2 == undefined) ? null : validator.unescape(com.Usuario.redSocial2);
                com.Usuario.redSocial3 = (com.Usuario.redSocial3 == undefined) ? null : validator.unescape(com.Usuario.redSocial3);  
                com.contenido = validator.unescape(com.contenido);
            }
            return res.status(200).json(rta);
        } catch (error) {
            res.status(500).send();
        }        
    }
    postTema = async (req,res)=>{
        try {
            await Temas.create({
                titulo:req.body.titulo,
                idSeccion:req.body.idSec,
                idUsuario:req.usuario.idUser,
                palabraClave1:req.body.pal1,
                palabraClave2:req.body.pal2,
                palabraClave3:req.body.pal3,
                comentarioInicial:req.body.msj,
                fechaCreacion:(new Date()).toLocaleString('sv-SE',{timeZone:'America/Argentina/Buenos_Aires'})
            })
            res.status(201).send({ msj: 'el tema fue creado' })
        } catch (error) {
            res.status(500).send();
        }
    }
    deletTema = async (req,res)=>{
        try {
            await Temas.destroy({
                where:{idTema:req.body.idTema}
            });
            res.status(201).send({ msj: 'el tema se elimino' });
        } catch (err) {
            return res.status(500).send();
        }
    }
    comentar = async (req,res)=>{
        try {
            await Comentarios.create({
                contenido:req.body.comentario,
                idTema:req.body.idTema,
                idUsuario:req.usuario.idUser,
                fechaHora:(new Date()).toLocaleString('sv-SE',{timeZone:'America/Argentina/Buenos_Aires'})
            })
            res.status(201).send({ msg: 'tema comentado' })            
        } catch (error) {
            res.status(500).send();
        }
    }
    ultimosComentarios = async (req,res)=>{
        try {
            let idSeccionCat = await Secciones.findOne({
                where:{nombreSeccion:'Opiniones de cátedras y profesores'}
            })
            let rta =[];
            let rta1 = await Comentarios.findAll({
                include:[{
                    model:Usuarios,
                    required:true,
                    attributes:['apodo','dirImg']
                }],
                order:[['fechaHora','DESC']],
                limit:parseInt(10)
            });
            let rta2 = await ComentariosCatedra.findAll({
                include:[{
                    model:Usuarios,
                    required:true,
                    attributes:['apodo','dirImg']
                }],
                order:[['fechaHora','DESC']],
                limit:parseInt(10)
            });
            for await (let com of rta=(rta1.concat(rta2))) {
                com.contenido = validator.unescape(com.contenido);
                com.dataValues.mili=com.fechaHora.getTime();
                if(com.idTema==undefined){
                    com.dataValues.idSeccion=idSeccionCat.idSeccion;
                    let catedra =await Catedras.findOne({where:{idCatedra:com.idCatedra}});
                    catedra.dataValues.materia = validator.unescape(catedra.dataValues.materia);                                
                    com.dataValues.origen= catedra;
                }else{
                    com.dataValues.origen=await Temas.findOne({
                        include:[{
                            model:Secciones,
                            required:true,
                        }],
                        where:{idTema:com.idTema}
                    });
                }
            }
            return res.status(200).json(rta.sort((a,b)=>b.dataValues.mili-a.dataValues.mili).slice(0,10));
        } catch (error) {
            res.status(500).send();
        }
    }
    buscaPalabra = async (req,res)=>{
        try {
            let rta = null;
            req.params.palabra = validator.escape(validator.trim(req.params.palabra));
            if (req.params.palabra.length === 0 || req.params.palabra.length > 30) {
                res.status(201).send({ msj: 'completa correctamente el comentario' });
            }else{
                rta = await Temas.findAll({
                    include:[{
                        model:Secciones,
                        required:true,
                        attributes:['nombreSeccion','idSeccion']
                    }],
                    where:{
                        [Op.or]:[
                            {palabraClave1:{[Op.like]:'%'+req.params.palabra+'%'}},
                            {palabraClave2:{[Op.like]:'%'+req.params.palabra+'%'}},
                            {palabraClave3:{[Op.like]:'%'+req.params.palabra+'%'}}
                        ]
                    },
                });
                for await (let com of rta) { 
                    com.fechaCreacion = new Date(com.fechaCreacion)
                    com.dataValues.mili=com.fechaCreacion.getTime();
                    com.comentarioInicial = validator.unescape(com.comentarioInicial);
                }
                return res.status(200).json(rta);
            } 
        } catch (error) {
            res.status(500).send();            
        }
    }
    deleteComent = async (req,res)=>{
        try {
            await Comentarios.destroy({
                where:{idComentario:req.params.idcomentario}
            });
            res.status(201).send({ msj: 'Comentario eliminado' });
        } catch (err) {
            return res.status(500).send();
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
        this.router.delete('/comentarios/:idcomentario',autenticacionjwt, isAdmin, this.deleteComent);
    }
}

module.exports = RutasTemas;