const {Sequelize, DataTypes} = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_NAME,process.env.DATABASE_USER,process.env.DATABASE_PASS,{
    host: process.env.DATABASE_HOSTNAME,
    dialect: 'mysql',
    timezone:'America/Argentina/Buenos_Aires',
    dialectOptions:{
        timezone:'local'
    }
});
const Usuarios = sequelize.define('Usuario',{
    idUsuario:{type: DataTypes.INTEGER, allowNull:false, autoIncrement:true ,unique:true, primaryKey:true},
    apodo:{type: DataTypes.STRING(40), allowNull:false, unique:true},
    contrasenia:{type: DataTypes.STRING(255), allowNull:false},
    mail:{type: DataTypes.STRING(80), allowNull:false, unique:true},
    rol:{type: DataTypes.STRING(4)},
    fechaIngreso:{type: DataTypes.DATE},
    estadoCuenta:{type: DataTypes.STRING(7)},
    dirImg:{type: DataTypes.STRING(45)},
    token:{type: DataTypes.STRING(35)},
    redSocial1:{type: DataTypes.STRING(140)},
    redSocial2:{type: DataTypes.STRING(140)},
    redSocial3:{type: DataTypes.STRING(140)},
    redSocial4:{type: DataTypes.STRING(140)}
},{timestamps:false, tableName:'unaUsuarios'});
const Apuntes = sequelize.define('Apunte',{
    idApunte:{type: DataTypes.INTEGER, allowNull:false, autoIncrement:true ,unique:true, primaryKey:true},
    autores:{type: DataTypes.STRING(100)},
    titulo:{type: DataTypes.STRING(100)},
    materia:{type: DataTypes.STRING(120)},
    catedra:{type: DataTypes.STRING(60)},
    fechaSubida:{type: DataTypes.DATE},
    dirurl:{type: DataTypes.STRING(270)}
},{timestamps:false, tableName:'unaApuntes'});
const Secciones = sequelize.define('Seccion',{
    idSeccion:{type: DataTypes.INTEGER, allowNull:false, unique:true, primaryKey:true},
    nombreSeccion:{type: DataTypes.STRING(45), allowNull:false},
    descripcion:{type: DataTypes.STRING(100), allowNull:false},
    img: {type: DataTypes.STRING(12), allowNull:null}
},{timestamps:false, tableName:'unaSecciones'});
const Catedras = sequelize.define('Catedra',{
    idCatedra:{type: DataTypes.INTEGER, allowNull:false, autoIncrement:true ,unique:true, primaryKey:true},
    catedra:{type: DataTypes.STRING(60)},
    materia:{type: DataTypes.STRING(120)},
    profesores:{type: DataTypes.STRING(100)},
    fechaHora:{type: DataTypes.DATE},
},{timestamps:false, tableName:'unaCatedras'});
const ComentariosCatedra = sequelize.define('ComentarioDeCatedra',{
    idComentario:{type: DataTypes.INTEGER, allowNull:false, autoIncrement:true ,unique:true, primaryKey:true},
    contenido:{type: DataTypes.TEXT, allowNull:false},
    fechaHora:{type: DataTypes.DATE}
},{timestamps:false, tableName:'unaComentarioXcatedra'});
const Temas = sequelize.define('unaTema',{
    idTema :{type: DataTypes.INTEGER, allowNull:false, autoIncrement:true ,unique:true, primaryKey:true},
    titulo :{type: DataTypes.STRING(180), allowNull:false},
    palabraClave1:{type: DataTypes.STRING(24), allowNull:true},
    palabraClave2:{type: DataTypes.STRING(24), allowNull:true},
    palabraClave3:{type: DataTypes.STRING(24), allowNull:true},
    fechaCreacion:{type: DataTypes.DATE, allowNull:false},
    comentarioInicial:{type: DataTypes.TEXT, allowNull:false}
},{timestamps:false, tableName:'unaTemas'});
const Comentarios = sequelize.define('Comentario',{
    idComentario:{type: DataTypes.INTEGER, allowNull:false, autoIncrement:true ,unique:true, primaryKey:true},
    contenido:{type: DataTypes.TEXT, allowNull:false},
    fechaHora:{type: DataTypes.DATE}
},{timestamps:false, tableName:'unaComentarios'})
const start = async()=>{
    try{
        Usuarios.hasMany(Apuntes,{foreignKey:'usuario'});
        Usuarios.hasMany(Catedras,{foreignKey:'idAutor'});
        Usuarios.hasMany(ComentariosCatedra,{foreignKey:'idUsuario'});
        Usuarios.hasMany(Temas,{foreignKey:'idUsuario'});
        Usuarios.hasMany(Comentarios,{foreignKey:'idUsuario'});
        Apuntes.belongsTo(Usuarios,{foreignKey:'usuario'});
        Catedras.belongsTo(Usuarios,{foreignKey:'idAutor'});
        Catedras.hasMany(ComentariosCatedra,{foreignKey:'idCatedra'});
        Secciones.hasMany(Temas,{foreignKey:'idSeccion'});
        ComentariosCatedra.belongsTo(Usuarios,{foreignKey:'idUsuario'});
        ComentariosCatedra.belongsTo(Catedras,{foreignKey:'idCatedra'});
        Temas.belongsTo(Secciones,{foreignKey:'idSeccion'});
        Temas.belongsTo(Usuarios,{foreignKey:'idUsuario'});
        Temas.hasMany(Comentarios,{foreignKey:'idTema'});
        Comentarios.belongsTo(Usuarios,{foreignKey:'idUsuario'});
        Comentarios.belongsTo(Temas,{foreignKey:'idTema'});
        await sequelize.authenticate();
    }catch(err){ }    
}

module.exports = {start,Secciones,Usuarios,Temas,Apuntes,Catedras,ComentariosCatedra,Comentarios};