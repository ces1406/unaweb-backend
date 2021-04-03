const {Router} = require('express');
const path = require('path');
const {start,Secciones,Temas,Catedras,Apuntes,Comentarios} = require('../model/db');
const {Op} = require('sequelize');
const validator = require('validator');

class RutasSecciones {
    constructor(){
        this.router = Router();
        start();
        this.routes();
    }
    getSections = async (req,res)=>{
        try {
            const secciones = await Secciones.findAll();
            for await(let seccion of secciones) {
                if(seccion.idSeccion===5){
                    seccion.dataValues.cantTemas = await Catedras.count();
                }else if(seccion.idSeccion===9){
                    seccion.dataValues.cantTemas = await Apuntes.count();
                }else{
                    seccion.dataValues.cantTemas = await Temas.count({where:{idSeccion:seccion.idSeccion}})  
                }                                              
            }
            res.status(200).json({secciones})
        } catch (err){
            res.status(200).send({msg: errr.msg})
        }        
    }
    getSection = async (req,res)=>{
        try {
            let temas = await Temas.findAll({
                where:{idSeccion:req.params.idSec},
                order:[['fechaCreacion','DESC']],
                offset:(req.params.pagActiva-1)*req.params.cantTems,
                limit:parseInt(req.params.cantTems,10)
            });
            for await (let tema of temas) {      
                tema.comentarioInicial = validator.unescape(tema.comentarioInicial);
                tema.dataValues.cantComentarios = await Comentarios.count({where:{idTema:tema.idTema}});
            }
            res.status(200).json({temas})
        } catch (error) {
            res.status(500).send();            
        }
    }
    checkSection = async (req,res)=>{
        try {
            let busq = await Secciones.count({where:{[Op.and]:[{idSeccion:req.params.idSec},{nombreSeccion:req.params.nombSec}]}});
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