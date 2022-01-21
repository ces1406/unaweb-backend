const {Router} = require('express');
require('../model/connectdb');
const { Apuntes} = require('../model/mongodb');
const {sanitizaApunte, sanitizaLink} = require('../middlewares/sanitize');
const {validaApunte, validaEnlace} = require('../middlewares/validate');
const {autenticacionjwt} = require('../middlewares/passport');
const isAdmin = require('../middlewares/isAdmin');
const validator = require('validator');

class RutasApuntes {
    constructor(){
        this.router = Router();
        this.routes();
    }
    uploadApunte = async (req,res)=>{
        try {
            if(await Apuntes.count({dirurl:req.body.link})!==0){
                res.statusMessage='Ya existe un enlace a ese apunte';
                res.status(400).send();
            }else{
                const apunte = new Apuntes({
                    autores:req.body.autor,
                    materia:req.body.materia,
                    titulo:req.body.titulo,
                    dirurl:req.body.link,
                    catedra:req.body.catedra,
                    usuario:req.usuario.idUser,
                    fechaSubida: new Date()
                });
                await apunte.save();
                res.status(201).send({msg:'El apunte fue subido'}); 
            }
        } catch (error) {
            res.status(500).send();
        }
    }
    search = async (req,res) => {
        try {
            await Apuntes.find({autores:new RegExp(req.body.autor), materia:new RegExp(req.body.materia),titulo:new RegExp(req.body.titulo), catedra:new RegExp(req.body.catedra)})
            .sort({fechaSubida:'asc'})
            .skip((req.params.pagActiva-1)*req.params.cantPorPag)
            .limit(parseInt(req.params.cantPorPag,10))
            .populate('usuario')
            .exec((err,rta)=>{
                for await(const elem of rta) { 
                    elem.dirurl = validator.unescape(elem.dirurl);
                    elem.autores = validator.unescape(elem.autores);
                    elem.titulo = validator.unescape(elem.titulo);
                    elem.catedra = validator.unescape(elem.catedra);
                    elem.materia = validator.unescape(elem.materia);
                }
                let cantApunt = await Apuntes.find({autores:new RegExp(req.body.autor), materia:new RegExp(req.body.materia),titulo:new RegExp(req.body.titulo), catedra:new RegExp(req.body.catedra)}).count();
                return res.status(201).json({apuntes:rta,cantApuntes:cantApunt});
            });            
            
        } catch (err) {
            res.status(500).send();
        }
    }
    delete = async (req,res) => {
        try {
            //await Apuntes.destroy({where:{idApunte:req.body.idApunte}});
            await Apuntes.findByIdAndDelete(req.body.idApunte);
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