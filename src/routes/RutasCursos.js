const {Router} = require('express');
require('../model/connectdb');
const cambiarId = require('../common_utilities/cambiarId');
const { Catedras, ComentariosCatedras} = require('../model/mongodb');
const {sanitizaForo,sanitizaOpinion} = require('../middlewares/sanitize');
const {validaForo,validaCreador,validaOpinion} = require('../middlewares/validate');
const {autenticacionjwt} = require('../middlewares/passport');
const isAdmin = require('../middlewares/isAdmin');
const validator = require('validator');

class RutasCursos {
    constructor(){
        this.router = Router();
        this.routes();
    }
    postForo = async (req,res)=>{
        try { 
            if(await Catedras.find({profesores:req.body.profesor,materia:req.body.materia,catedra:req.body.catedra}).count() === 0){
                console.log('postForo->',req.body)
                let catedra = await new Catedras({
                    materia:req.body.materia,
                    catedra:req.body.catedra,
                    profesores:req.body.profesor,
                    idAutor:req.body.idAutor,
                    fechaHora: new Date()
                });
                await catedra.save();
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
            let rta = await Catedras.find({
                                        profesores:(req.body.profesor==''||req.body.profesor==null)? /./:new RegExp(req.body.profesor,"i"), 
                                        materia:(req.body.materia==''||req.body.materia==null)? /./: req.body.materia, 
                                        catedra:(req.body.catedra==''||req.body.catedra==null)? /./: new RegExp(req.body.catedra,"i")})
                                    .sort({fechaHora:'asc'})
                                    .skip((req.params.pagActiva-1)*req.params.cantPorPag)
                                    .limit(parseInt(req.params.cantPorPag,10));
            let resp =[];
            for await( const e of rta){
                resp.push(cambiarId(e,'idCatedra'));
            } 
            res.status(201).json(resp);
        } catch (error) {
            res.status(500).send();
        }
    }
    postOpinion = async (req,res)=>{
        console.log('postenado opinion-req.body: ',req.body);
        console.log('postenado opinion-req.usuario: ',req.usuario)
        try {
            let opinion = await new ComentariosCatedras({
                contenido: req.body.contenido,
                idCatedra: req.body.idCatedra,
                idUsuario: req.usuario.idUser,
                fechaHora: new Date()
            });
            await opinion.save()
            res.status(201).send({msg:'se cargo tu opinion'});
        } catch (error) {
            res.status(500).send();
        }
    }
    deleteForo = async (req,res)=>{
        try {
            await Catedras.findByIdAndDelete(req.body.idCatedra)
            res.status(201).send({ msj: 'el foro se elimino' });
        } catch (error) {
            res.status(500).send();
        }
    }
    getOpiniones = async (req,res)=>{
        try {
            await ComentariosCatedras.find({idCatedra:req.params.idCatedra})
                .sort({fechaHora:'asc'})
                .skip((req.params.pagActiva-1)*req.params.cantPorPag)
                .limit(parseInt(req.params.cantPorPag,10))
                .populate('idCatedra')
                .populate('idUsuario')
                .exec(async(err,rta)=>{
                    let coments =[];
                    console.log('rta: ',rta)
                    //console.log('rta.length: '+ rta.length)
                    if(rta.length !== 0){
                        if(rta !=null){
                            for await (let com of rta) {   
                                let comAux = cambiarId(com,'idComentario')
                                comAux.Catedra = comAux.idCatedra;
                                delete comAux.idCatedra;
                                comAux.Usuario = comAux.idUsuario;  
                                delete comAux.idUsuario;
                                comAux.Usuario.redSocial1 = (comAux.Usuario.redSocial1 == undefined) ? null : validator.unescape(comAux.Usuario.redSocial1);
                                comAux.Usuario.redSocial2 = (comAux.Usuario.redSocial2 == undefined) ? null : validator.unescape(comAux.Usuario.redSocial2);
                                comAux.Usuario.redSocial3 = (comAux.Usuario.redSocial3 == undefined) ? null : validator.unescape(comAux.Usuario.redSocial3);  
                                comAux.contenido = validator.unescape(comAux.contenido); 
                                coments.push(comAux)
                            }
                        }
                    }                    
                    return res.status(200).json(coments);
                });
        } catch (error) {
            res.status(500).send();
        }
    }
    getCatedra = async (req,res)=>{
        try {
            let rta = await Catedras.findById(req.params.idCatedra);
            let aux = cambiarId(rta,'idCatedra')
            aux.cantOpiniones = await ComentariosCatedras.find({idCatedra:req.params.idCatedra}).count();
            return res.status(200).json(aux)
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