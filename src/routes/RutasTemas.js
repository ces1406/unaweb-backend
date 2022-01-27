const {Router} = require('express');
const RutasApuntes = require('./RutasApuntes');
const RutasCursos = require('./RutasCursos');
require('../model/connectdb');
const cambiarId = require('../common_utilities/cambiarId');
const { Catedras, Secciones, Temas, Comentarios, ComentariosCatedras} = require('../model/mongodb');
const {sanitizaTema,sanitizaComentario} = require('../middlewares/sanitize');
const {validaTema,validaComentario} = require('../middlewares/validate');
const isAdmin = require('../middlewares/isAdmin');
const validator = require('validator');
const { autenticacionjwt } = require('../middlewares/passport');

class RutasTemas {
    constructor(){
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
            await Temas.findOne({idTema:req.params.idTema}).populate('idUsuario').exec(async(err,rta)=>{
                let tema = cambiarId(rta,'idTema');
                tema.cantComents = await Comentarios.count({where:{idTema:req.params.idTema}});
                tema.idUsuario = rta.idUsuario._id;
                tema.Usuario ={
                    apodo: rta.idUsuario.apodo,
                    dirImg: (rta.idUsuario.dirImg == undefined)?null:rta.idUsuario.dirImg,
                    redSocial1 : (rta.idUsuario.redSocial1 == undefined)? null : validator.unescape(rta.idUsuario.redSocial1),
                    redSocial2 : (rta.idUsuario.redSocial2 == undefined)? null : validator.unescape(rta.idUsuario.redSocial2),
                    redSocial3 : (rta.idUsuario.redSocial3 == undefined)? null : validator.unescape(rta.idUsuario.redSocial3),
                }; 
                return res.status(200).json({rta:tema})
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
                    let coments = [];
                    for await (let com of rta) {
                        let item = cambiarId(com,'idComentario');     
                        item.Usuario = com.idUsuario
                        item.Usuario.idUsuario = com.idUsuario._id;
                        delete item.Usuario.contrasenia;                        
                        item.idUsuario = com.idUsuario._id;
                        item.Usuario.redSocial1 = (com.idUsuario.redSocial1 == undefined) ? null : validator.unescape(com.idUsuario.redSocial1);
                        item.Usuario.redSocial2 = (com.idUsuario.redSocial2 == undefined) ? null : validator.unescape(com.idUsuario.redSocial2);
                        item.Usuario.redSocial3 = (com.idUsuario.redSocial3 == undefined) ? null : validator.unescape(com.idUsuario.redSocial3);  
                        item.contenido = validator.unescape(com.contenido);
                        coments.push(item)
                    }
                    return res.status(200).json(coments);
                });
        } catch (error) {
            res.status(500).send();
        }        
    }
    postTema = async (req,res)=>{
        console.log('req.body->',req.body)
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
    deleteTema = async (req,res)=>{
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
            await coment.save();
            res.status(201).send({ msg: 'tema comentado' })            
        } catch (error) {
            res.status(500).send();
        }
    }
    ultimosComentarios = async (req,res)=>{
        try {
            let idSeccionCat = await Secciones.find({nombreSeccion:'Opiniones de cátedras y profesores'});
            let rta =[];            
            let rta1 = await Comentarios.find().sort({fechaHora:-1})
                .limit(10)
                .populate('idUsuario')
                .populate("idTema")
                .exec();

            for await(let coment of rta1){
                let elem = cambiarId(coment,'idComentario');
                elem.idUsuario = coment.idUsuario._id;
                elem.contenido = validator.unescape(coment.contenido);
                elem.mili=coment.fechaHora.getTime();
                elem.origen ={};
                //console.log('coment.fechaHora.getTime(): ',coment.fechaHora.getTime())

                await Temas.findById(elem.idTema).populate('idSeccion').exec(async(err,rta)=>{
                    //console.log('rta: ',rta)
                    elem.origen.idTema = rta._id;
                    elem.origen.titulo = rta.titulo;
                    elem.origen.palabraClave1 = rta.palabraClave1;
                    elem.origen.palabraClave2 = rta.palabraClave2;
                    elem.origen.palabraClave3 = rta.palabraClave3;
                    elem.origen.fechaCreacion = rta.fechaCreacion;
                    elem.origen.comentarioInicial = rta.comentarioInicial;
                    elem.origen.idUsuario = rta.idUsuario;
                    elem.origen.idSeccion = rta.idSeccion._id;
                    elem.origen.Seccion = cambiarId(rta.idSeccion,'idSeccion');
                });

                elem.Usuario ={
                    apodo:coment.idUsuario.apodo,
                    dirImg:coment.idUsuario.dirImg
                }
                elem.idTema = coment.idTema._id;
                rta.push(elem);
            }

            let rta2 = await ComentariosCatedras.find().sort({fechaHora:-1}).limit(10).populate('idUsuario').populate("idCatedra").exec();
            for await (let com of rta2) {
                let elem = cambiarId(com,'idComentario');
                elem.contenido = validator.unescape(com.contenido);
                elem.mili=com.fechaHora.getTime();
                elem.idSeccion=idSeccionCat._id;
                elem.origen={
                    idCatedra: com.idCatedra._id,
                    catedra: com.idCatedra.catedra,
                    materia: com.idCatedra.materia,
                    profesores: com.idCatedra.profesores,
                    fechaHora: com.idCatedra.fechaHora,
                    idAutor: com.idCatedra.idAutor
                }                
                elem.Usuario ={
                    apodo:com.idUsuario.apodo,
                    dirImg:com.idUsuario.dirImg
                }
                elem.idUsuario = com.idUsuario._id;
                elem.idCatedra = com.idCatedra._id;
                rta.push(elem);
            }
            let r=rta.sort((a,b)=>b.mili-a.mili).slice(0,10)
            console.log('ultimosComentarios[2].origen->',r[2].origen)
            //return res.status(200).json(rta.sort((a,b)=>b.mili-a.mili).slice(0,10));
            return res.status(200).json(r);
        } catch (error) {
            console.log('error->',error)
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
        this.router.post('/deleteTema',autenticacionjwt,isAdmin,this.deleteTema);
        this.router.post('/comentar',sanitizaComentario,validaComentario,autenticacionjwt,this.comentar);
    }
}

module.exports = RutasTemas;