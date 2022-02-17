const {Router} = require('express');
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
                let apunte = await Apuntes.create({
                    autores:req.body.autor,
                    materia:req.body.materia,
                    titulo:req.body.titulo,
                    dirurl:req.body.link,
                    catedra:req.body.catedra,
                    usuario:req.usuario.idUser,
                    fechaSubida: (new Date()).toLocaleString('sv-SE',{timeZone:'America/Argentina/Buenos_Aires'})
                });
                res.status(201).send(apunte.dataValues); 
            }
        } catch (error) {
            res.status(500).send();
        }
    }
    sanitizarValidar = (req,res,next)=>{        
        if(req.query.titulo != undefined){req.query.titulo = validator.escape(validator.trim(req.query.titulo));}else{req.query.titulo=''}
        if(req.query.materia != undefined) {req.query.materia = validator.escape(validator.trim(req.query.materia));}else{req.query.materia=''}
        if(req.query.catedra != undefined) {req.query.catedra = validator.escape(validator.trim(req.query.catedra));}else{req.query.catedra=''}
        if(req.query.autor != undefined) {req.query.autor = validator.escape(validator.trim(req.query.autor));}else{req.query.autor=''}
        if ((req.query.titulo != undefined && req.query.titulo.length > 100) || 
            (req.query.autor != undefined && req.query.autor.length > 120) || 
            (req.query.materia != undefined && req.query.materia.length > 120) || 
            (req.query.catedra != undefined && req.query.catedra.length > 100) ) {
            res.status(404).send({ msj: 'Algunos campos son demasiado extensos' })        
        } else {
            next();
        }
    }
    search = async (req,res) => {
        try{
            let rta = await Apuntes.findAll({
                include:[{
                    model:Usuarios,
                    required:true,
                    attributes:['apodo'],                    
                }],
                where:{
                    [Op.and]:[
                        {autores:{[Op.like]:'%'+req.query.autor+'%'}},
                        {materia:{[Op.like]:'%'+req.query.materia+'%'}},
                        {titulo:{[Op.like]:'%'+req.query.titulo+'%'}},
                        {catedra:{[Op.like]:'%'+req.query.catedra+'%'}}
                    ]
                },
                order:[['fechaSubida','ASC']],
                offset:(req.params.pagActiva-1)*req.params.cantPorPag,
                limit:parseInt(req.params.cantPorPag,10)
            })
            for await(const elem of rta) { 
                elem.dirurl = validator.unescape(elem.dirurl);
                elem.autores = validator.unescape(elem.autores);
                elem.titulo = validator.unescape(elem.titulo);
                elem.catedra = validator.unescape(elem.catedra);
                elem.materia = validator.unescape(elem.materia);
            }
            let cantApunt = await Apuntes.count(
                {where:{
                    [Op.and]:[
                        {autores:{[Op.like]:'%'+req.query.autor+'%'}},
                        {materia:{[Op.like]:'%'+req.query.materia+'%'}},
                        {titulo:{[Op.like]:'%'+req.query.titulo+'%'}},
                        {catedra:{[Op.like]:'%'+req.query.catedra+'%'}}
                    ]
                }
            });
            return res.status(200).json({apuntes:rta,cantApuntes:cantApunt});
        } catch (err) {
            res.status(500).send();
        }
    }
    delete = async (req,res) => {
        try {
            await Apuntes.destroy({where:{idApunte:req.params.idapunte}});
            res.status(202).send({ msj: 'el apunte se elimino' });
        } catch (error) {
            res.status(500).send();
        }
    }
    routes(){
        this.router.post('/', sanitizaLink, sanitizaApunte, validaApunte, validaEnlace, autenticacionjwt, this.uploadApunte);
        /* this.router.get('/:pagActiva/:cantPorPag/:materia/:titulo/:catedra/:autores', this.sanitizarValidar, this.search);
        this.router.get('/:pagActiva/:cantPorPag/:materia/:titulo/:catedra', this.sanitizarValidar, this.search);
        this.router.get('/:pagActiva/:cantPorPag/:materia/:titulo', this.sanitizarValidar, this.search);
        this.router.get('/:pagActiva/:cantPorPag/:materia', this.sanitizarValidar, this.search); */
        this.router.get('/:pagActiva/:cantPorPag/', this.sanitizarValidar, this.search);
        this.router.delete('/:idapunte', autenticacionjwt, isAdmin, this.delete); 
    }
}

module.exports = RutasApuntes;