const {Schema, model} = require('mongoose');

const usuariosSchema = new Schema({
    "apodo":{
        type:String,
        required: true
    },
    "contrasenia":{
        type:String,
        required: true
    },
    "mail":{
        type:String,
        required: true
    },
    "rol":{
        type:String,
        required: true
    },
    "fechaIngreso":{
        type:Date,
        required: true
    },
    "estadoCuenta":{
        type:String,
        required: true
    },
    "dirImg":String,
    "token":String,
    "redSocial1":String,
    "redSocial2":String,
    "redSocial3":String,
    "redSocial4":String
});
const seccionesSchema = new Schema({
    "nombreSeccion":{
        type:String,
        required: true
    },
    "descripcion":{
        type:String,
        required: true
    },
    "img":String
});
const temasSchema = new Schema({
    "idUsuario":{
        type:Schema.Types.ObjectId,
        ref:"unausuario"
    },
    "idSeccion":{
        type:Schema.Types.ObjectId,
        ref:"unaseccione"
    },
    "titulo":{
        type:String,
        required: true
    },
    "comentarioInicial":{
        type:String,
        required: true
    },
    "palabraClave1":{
        type:String,
        required: true
    },
    "palabraClave2":{
        type:String,
        required: true
    },
    "palabraClave3":{
        type:String,
        required: true
    },
    "fechaCreacion":{
        type:Date,
        required: true
    }
});
const comentariosSchema = new Schema({
    //"idComentario":Schema.Types.ObjectId,
    "idTema":{
        type:Schema.Types.ObjectId,
        ref:"unatema"
    },
    "idUsuario":{
        type:Schema.Types.ObjectId,
        ref:"unausuario"
    },
    "contenido":{
        type:String,
        required: true
    },
    "fechaHora":{
        type:Date,
        required: true
    }
});
const comentariosCatedrasSchema = new Schema({
    //"idComentario":Schema.Types.ObjectId,
    "idCatedra":{
        type:Schema.Types.ObjectId,
        ref:"unacatedra"
    },
    "idUsuario":{
        type:Schema.Types.ObjectId,
        ref:"unausuario"
    },
    "contenido":{
        type:String,
        required: true
    },
    "fechaHora":{
        type:Date,
        required: true
    }
});
const catedrasSchema = new Schema({
    //"idCatedra":Schema.Types.ObjectId,
    "idAutor":{
        type:Schema.Types.ObjectId,
        ref:"unausuario"
    },
    "catedra":{
        type:String,
        required: true
    },
    "materia":{
        type:String,
        required: true
    },
    "profesores":{
        type:String,
        required: true
    },
    "fechaHora":{
        type:Date,
        required: true
    }
});
const apuntesSchema = new Schema({
    //"idApunte":Schema.Types.ObjectId,
    "usuario":{
        type:Schema.Types.ObjectId,
        ref:"unausuario"
    },
    "autores":{
        type:String,
        required: false
    },
    "materia":{
        type:String,
        required: false
    },
    "titulo":{
        type:String,
        required: false
    },
    "catedra":{
        type:String,
        required: false
    },
    "dirurl":{
        type:String,
        required: true
    },
    "fechaSubida":{
        type:Date,
        required: true
    }
});

exports.Usuarios = model('unausuario',usuariosSchema);
exports.Secciones = model('unaseccione',seccionesSchema);
exports.Temas = model('unatema',temasSchema);
exports.Comentarios = model('unacomentario',comentariosSchema);
exports.ComentariosCatedras = model('unacomentarioxcatedra',comentariosCatedrasSchema);
exports.Catedras = model('unacatedra',catedrasSchema);
exports.Apuntes = model('unaapunte',apuntesSchema);