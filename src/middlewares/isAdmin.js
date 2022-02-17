const isAdmin = (req,res,next)=>{
    if(req.usuario.rol==='ADMI'){
        next();
    }else{
        res.status(403).send();
    }
}
module.exports = isAdmin;