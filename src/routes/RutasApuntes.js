const {Router} = require('express');
require('../model/connectdb');
const { Apuntes} = require('../model/mongodb');
const {sanitizaApunte, sanitizaLink} = require('../middlewares/sanitize');
const {validaApunte, validaEnlace} = require('../middlewares/validate');
const {autenticacionjwt} = require('../middlewares/passport');
const isAdmin = require('../middlewares/isAdmin');
const validator = require('validator');
const cambiarId = require('../common_utilities/cambiarId')

class RutasApuntes {
    constructor(){
        this.router = Router();
        this.routes();
    }
    uploadApunte = async (req,res)=>{
        try {
            console.log('link del apunte: ',req.body.link);
            console.log('Apuntes.count->'+ Apuntes.count({dirurl:req.body.link}))
            if(await Apuntes.count({dirurl:req.body.link})!==0){
                console.log('existe el apuntes')
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
            await Apuntes.find({autores:new RegExp(req.body.autor,"i"), materia:new RegExp(req.body.materia,"i"),titulo:new RegExp(req.body.titulo,"i"), catedra:new RegExp(req.body.catedra,"i")})
            .sort({fechaSubida:'asc'})
            .skip((req.params.pagActiva-1)*req.params.cantPorPag)
            .limit(parseInt(req.params.cantPorPag,10))
            .populate('usuario')
            .exec(async (err,rta)=>{
                let rtaAux =[];
                console.log('apuntes')
                for await(const elem of rta) { 
                    let apte = cambiarId(elem,'idApunte');
                    apte.dirurl = validator.unescape(apte.dirurl);
                    apte.autores = validator.unescape(apte.autores);
                    apte.titulo = validator.unescape(apte.titulo);
                    apte.catedra = validator.unescape(apte.catedra);
                    apte.materia = validator.unescape(apte.materia);
                    apte.Usuario ={apodo: elem.usuario.apodo};
                    apte.usuario = elem.usuario._id;
                    //delete apte.usuario;
                    rtaAux.push(apte);
                }
                let cantApunt = await Apuntes.find({autores:new RegExp(req.body.autor,"i"), materia:new RegExp(req.body.materia,"i"),titulo:new RegExp(req.body.titulo,"i"), catedra:new RegExp(req.body.catedra,"i")}).count();
                return res.status(201).json({apuntes:rtaAux,cantApuntes:cantApunt});
            });            
            
        } catch (err) {
            res.status(500).send();
        }
    }
    delete = async (req,res) => {
        try {
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