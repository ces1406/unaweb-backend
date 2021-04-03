const {Router} = require('express');
const path = require('path');
const {start,Apuntes, Usuarios} = require('../model/db');
const {sanitizaApunte, sanitizaLink} = require('../middlewares/sanitize');
const {validaApunte, validaEnlace} = require('../middlewares/validate');
const {autenticacionjwt} = require('../middlewares/passport');
const isAdmin = require('../middlewares/isAdmin');
const {Op} = require('sequelize');
const validator = require('validator');

class RutasApuntes {
    constructor(){
        this.router = Router();
        start();
        this.routes();
    }
    uploadApunte = async (req,res)=>{
        try {
            if(await Apuntes.count({where:{dirurl:req.body.link}})!==0){
                res.statusMessage='Ya existe un enlace a ese apunte';
                res.status(400).send();
            }else{
                var apunte = await Apuntes.create({
                    autores:req.body.autor,
                    materia:req.body.materia,
                    titulo:req.body.titulo,
                    dirurl:req.body.link,
                    catedra:req.body.catedra,
                    usuario:req.usuario.idUser,
                    fechaSubida: (new Date()).toJSON().slice(0,19).replace('T',' ')
                });
                res.status(201).send({msg:'El apunte fue subido'}); 
            }
        } catch (error) {
            res.status(500).send();
        }
    }
    search = async (req,res) => {
        try {
            let rta = await Apuntes.findAll({
                include:[{
                    model:Usuarios,
                    required:true,
                    attributes:['apodo'],                    
                }],
                where:{
                    [Op.and]:[
                        {autores:{[Op.like]:'%'+req.body.autor+'%'}},
                        {materia:{[Op.like]:'%'+req.body.materia+'%'}},
                        {titulo:{[Op.like]:'%'+req.body.titulo+'%'}}
                    ]
                },
                order:[['fechaSubida','ASC']],
                offset:(req.params.pagActiva-1)*req.params.cantPorPag,
                limit:parseInt(req.params.cantPorPag,10)
            })
            for await(const elem of rta) { 
                elem.dirurl = validator.unescape(elem.dirurl);
            }
            return res.status(201).json(rta);
        } catch (err) {
            res.status(500).send();
        }
    }
    delete = async (req,res) => {
        try {
            await Apuntes.destroy({where:{idApunte:req.body.idApunte}});
            res.status(201).send({ msj: 'el apunte se elimino' });
        } catch (error) {
            res.status(500).send();
        }
    }
    routes(){
        this.router.post('/', sanitizaLink, sanitizaApunte, validaApunte, validaEnlace, autenticacionjwt, this.uploadApunte);
        this.router.post('/search/:pagActiva/:cantPorPag', sanitizaApunte, validaApunte, this.search);
        this.router.post('/delapunte', isAdmin, this.delete); 
    }
}

module.exports = RutasApuntes;