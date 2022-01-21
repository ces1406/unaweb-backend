const {Router} = require('express');
require('../model/connectdb');
const { Catedras, Secciones, Apuntes, Temas, Comentarios} = require('../model/mongodb');
const validator = require('validator');

class RutasSecciones {
    constructor(){
        this.router = Router();
        start();
        this.routes();
    }
    getSections = async (req,res)=>{
        try {
            //const secciones = await Secciones.findAll();
            const secciones = await Secciones.findOne();
            for await(let seccion of secciones) {
                if(seccion.idSeccion===5){
                    seccion.cantTemas = await Catedras.find().count();
                }else if(seccion.idSeccion===9){
                    seccion.cantTemas = await Apuntes.find().count();
                }else{
                    seccion.cantTemas = await Temas.find({idSeccion:seccion.idSeccion}).count();  
                }                                              
            }
            res.status(200).json({secciones})
        } catch (err){
            res.status(200).send({msg: err.msg})
        }        
    }
    getSection = async (req,res)=>{
        try {
            let temas = await Temas.findAll({idSeccion:req.params.idSec})
                .sort({fechaCreacion: -1})
                .skip((req.params.pagActiva-1)*req.params.cantTems)
                .limit(parseInt(req.params.cantTems,10));
            /* let temas = await Temas.findAll({
                where:{idSeccion:req.params.idSec},
                order:[['fechaCreacion','DESC']],
                offset:(req.params.pagActiva-1)*req.params.cantTems,
                limit:parseInt(req.params.cantTems,10)
            }); */
            for await (let tema of temas) {      
                tema.comentarioInicial = validator.unescape(tema.comentarioInicial);
                tema.cantComentarios = await Comentarios.find({idTema:tema.idTema}).count();//await Comentarios.count({where:{idTema:tema.idTema}});
            }
            res.status(200).json({temas})
        } catch (error) {
            res.status(500).send();            
        }
    }
    checkSection = async (req,res)=>{
        try {
            //let busq = await Secciones.count({where:{[Op.and]:[{idSeccion:req.params.idSec},{nombreSeccion:req.params.nombSec}]}});
            let busq = await Secciones.find({idSeccion:req.params.idSec, nombreSeccion:req.params.nombSec}).count();
            res.status(200).json({rta:(busq!==0)?true:false})
        } catch (error) {
            res.status(500).send();            
        }
    }
    routes(){
        this.router.get('/', this.getSections);
        this.router.get('/checksection/:idSec/:nombSec',this.checkSection);
        this.router.get('/:idSec/:pagActiva/:cantTems', this.getSection);        
    }
}

module.exports = RutasSecciones;