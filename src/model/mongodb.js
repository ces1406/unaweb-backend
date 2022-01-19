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
    "redSocial4":String,
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
        ref:"Usuarios"
    },
    "idSeccion":{
        type:Schema.Types.ObjectId,
        ref:"Secciones"
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
    "idTema":{
        type:Schema.Types.ObjectId,
        ref:"Temas"
    },
    "idUsuario":{
        type:Schema.Types.ObjectId,
        ref:"Usuarios"
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
    "idCatedra":{
        type:Schema.Types.ObjectId,
        ref:"Catedras"
    },
    "idUsuario":{
        type:Schema.Types.ObjectId,
        ref:"Usuarios"
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
    "idAutor":{
        type:Schema.Types.ObjectId,
        ref:"Usuarios"
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
    "usuario":{
        type:Schema.Types.ObjectId,
        ref:"Usuarios"
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

exports.Usuarios = model('unaUsuarios',usuariosSchema);
exports.Secciones = model('unaSecciones',seccionesSchema);
exports.Temas = model('unaTemas',temasSchema);
exports.Comentarios = model('unaComentarios',comentariosSchema);
exports.ComentariosCatedras = model('unaComentarioXcatedra',comentariosCatedrasSchema);
exports.Catedras = model('unaCatedras',catedrasSchema);
exports.Apuntes = model('unaApuntes',apuntesSchema);