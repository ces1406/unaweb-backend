const {Router} = require('express');
require('../model/connectdb');
const { Catedras, Secciones, Apuntes, Temas, Comentarios} = require('../model/mongodb');
const validator = require('validator');
const cambiarId = require('../common_utilities/cambiarId')

class RutasSecciones {
    constructor(){
        this.router = Router();
        this.routes();
    }
    getSections = async (req,res)=>{
        try {
            let secciones = await Secciones.find()
            let seccs = [];
            for await (let e of secciones){
                seccs.push(cambiarId(e,'idSeccion'))
            }
            for await(let e of seccs) {
                if(e.nombreSeccion==='Opiniones de cátedras y profesores'){
                    e.cantTemas = await Catedras.find().count();
                }else if(e.nombreSeccion==='Apuntes'){
                    e.cantTemas = await Apuntes.find().count();
                }else{
                    e.cantTemas = await Temas.find({idSeccion:e.idSeccion}).count();  
                }  
            } 
            res.status(200).json({secciones:seccs})
        } catch (err){
            res.status(200).send({msg: err.msg})
        }        
    }
    getSection = async (req,res)=>{        
        try {
            let rta =[];
            let temas = await Temas.find({idSeccion:req.params.idSec})
                .sort({fechaCreacion: -1})
                .skip((req.params.pagActiva-1)*req.params.cantTems)
                .limit(parseInt(req.params.cantTems,10));
            for await (let tema of temas) {      
                let item =cambiarId(tema,'idTema');
                item.comentarioInicial = validator.unescape(tema.comentarioInicial);
                item.cantComentarios = await Comentarios.find({idTema:tema.idTema}).count();//await Comentarios.count({where:{idTema:tema.idTema}});
                rta.push(item)
            }
            res.status(200).json({temas:rta})
        } catch (error) {
            res.status(500).send();            
        }
    }
    checkSection = async (req,res)=>{
        try {
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