const express = require('express');
const helmet = require('helmet');
const path = require('path');
const passport = require('passport');
const {pasaporteJwt} = require ('./middlewares/passport');
const RutasSecciones = require('./routes/RutasSecciones');
const RutasUsuarios = require('./routes/RutasUsuarios');
const RutasTemas = require('./routes/RutasTemas');

class Applicacion {
    constructor(){
        this.app = express();
        this.setPort();
        this.setMiddlewares();
        this.enrutar();
    }
    setPort = ()=>{
        this.app.set('port',process.env.PORT||5000);
    }
    setMiddlewares = ()=>{
        this.app.use(express.urlencoded({extended:false}));
        this.app.use(express.json());
        this.app.use(this.handleCors);
        this.app.use(helmet.hidePoweredBy());
        this.app.use(helmet.noSniff());
        this.app.use(helmet.ieNoOpen());
        this.app.use(helmet.xssFilter());
        this.app.use(passport.initialize());
        passport.use('autenticacionjwt',pasaporteJwt);
        this.app.use(express.static(path.join(__dirname,'../static_files')));
    }
    enrutar = ()=>{
        const rutasSecciones = new RutasSecciones();
        const rutasUsuarios = new RutasUsuarios();
        const rutasTemas = new RutasTemas();
        this.app.use('/sections',rutasSecciones.router);
        this.app.use('/user',rutasUsuarios.router);
        this.app.use('/temas',rutasTemas.router);
    }
    handleCors = (req,res,next)=>{
        res.set('Access-Control-Allow-Origin','*');
        if(req.method==='OPTIONS'&&req.headers['origin']&&req.headers['access-control-request-method']){
            res.set('Access-Control-Allow-Methods','POST,DELETE,UPDATE');
            res.set('Access-Control-Allow-Headers','Content-Type, Authorization');
            res.status(200).send();  
            return;        
        }else{
            next(); 
        }
    }
    startServer = ()=>{
        this.app.listen(this.app.get('port'));
    }
}

module.exports = Applicacion;