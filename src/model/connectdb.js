const mongoose = require('mongoose');
(async()=>{
    try {
        const db = await mongoose.connect(process.env.DATABASE_URL,{useNewUrlParser:true, useUnifiedTopology:true});
        console.log('conexion a la mongoDB unaWebDB -> ',db.connection.name);        
    } catch (error) {
        console.log('error en la conexion a la mongoDB unaWebDB: ',error)   
    }
})();
mongoose.connection.on('open',()=>{console.log('UnaWebDB mongo->conectada...')});
mongoose.connection.on('error',()=>{console.log('UnaWebDB mongo->error...')});