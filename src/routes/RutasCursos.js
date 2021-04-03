const {Router} = require('express');
const path = require('path');
const {start,Catedras, ComentariosCatedra, Usuarios} = require('../model/db');
const {sanitizaForo,sanitizaOpinion} = require('../middlewares/sanitize');
const {validaForo,validaCreador,validaOpinion} = require('../middlewares/validate');
const {autenticacionjwt} = require('../middlewares/passport');
const isAdmin = require('../middlewares/isAdmin');
const {Op} = require('sequelize');
const validator = require('validator');

class RutasCursos {
    constructor(){
        this.router = Router();
        start();
        this.routes();
    }
    postForo = async (req,res)=>{
        try {
            if(await Catedras.count({where:{
                [Op.and]:[
                    {profesores:req.body.profesor},
                    {materia:req.body.materia},
                    {catedra:req.body.catedra}
                ]
            }}) ===0){
                await Catedras.create({
                    materia:req.body.materia,
                    catedra:req.body.catedra,
                    profesores:req.body.profesor,
                    autor:req.body.idAutor,
                    fechaHora: (new Date()).toJSON().slice(0,19).replace('T',' ')
                });
                res.status(201).send({ msg: 'el foro se creó' })
            }else{
                res.statusMessage ='Ya existe un foro para esa materia, catedra y profesor/es' 
                res.status(400).send()
            }
        } catch (error) {
            res.status(500).send();
        }
    }
    searchForo = async (req,res)=>{
        try {
            let rta = await Catedras.findAll({
                where:{
                    [Op.and]:[
                        {profesores:{[Op.like]:'%'+req.body.profesor+'%'}},
                        {materia:{[Op.like]:'%'+req.body.materia+'%'}},
                        {catedra:{[Op.like]:'%'+req.body.catedra+'%'}}
                    ]
                },
                order:[['fechaHora','ASC']],
                offset:(req.params.pagActiva-1)*req.params.cantPorPag,
                limit:parseInt(req.params.cantPorPag,10)
            });
            res.status(201).json(rta);
        } catch (error) {
            res.status(500).send();
        }
    }
    postOpinion = async (req,res)=>{
        try {
            await ComentariosCatedra.create({
                contenido:req.body.contenido,
                idCatedra:req.body.idCatedra,
                idUsuario:req.usuario.idUser,
                fechaHora: (new Date()).toJSON().slice(0,19).replace('T',' ')
            })
            res.status(201).send({msg:'se cargo tu opinion'});
        } catch (error) {
            res.status(500).send();
        }
    }
    deleteForo = async (req,res)=>{
        try {
            await Catedras.destroy({where:{idCatedra:req.body.idCatedra}});
            res.status(201).send({ msj: 'el foro se elimino' });
        } catch (error) {
            res.status(500).send();
        }
    }
    getOpiniones = async (req,res)=>{
        try {
            let rta = await ComentariosCatedra.findAll({
                include:[{
                    model:Catedras,
                    required:true,                   
                },{
                    model:Usuarios,
                    required:true,
                    attributes:['apodo','dirImg','redSocial1','redSocial2','redSocial3']
                }],
                where:{idCatedra:req.params.idCatedra},
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
    getCatedra = async (req,res)=>{
        try {
            let rta = await Catedras.findOne({where:{idCatedra:req.params.idCatedra}});
            rta.dataValues.cantOpiniones = await ComentariosCatedra.count({where:{idCatedra:req.params.idCatedra}});
            return res.status(200).json(rta)
        } catch (error) {
            res.status(500).send();
        }
    }
    routes(){
        this.router.post('/',sanitizaForo,validaForo,autenticacionjwt,this.postForo);
        this.router.post('/search/:pagActiva/:cantPorPag',sanitizaForo,validaForo,this.searchForo);
        this.router.post('/opinion',sanitizaOpinion,validaOpinion,autenticacionjwt, this.postOpinion);
        this.router.post('/delforo',autenticacionjwt,isAdmin,this.deleteForo);
        this.router.get('/opiniones/:idCatedra/:pagActiva/:cantPorPag',this.getOpiniones);
        this.router.get('/:idCatedra',this.getCatedra)
    }
}

module.exports = RutasCursos;