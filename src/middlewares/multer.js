const multer = require('multer');
const path = require('path');

const guardarImg = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, path.join(__dirname, '../../usersimgs')) },
    filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname).toLowerCase()) }
});
const filterImg = (req, file, cb) => {
    const fileTypes = /jpeg|png|webp|jpg/;
    const mimeTypes = fileTypes.test(file.mimetype);
    const extension = fileTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimeTypes && extension) {
        return cb(null, true)
    } else {
        return cb("Tipo de archivo de la imagen no soportado", false)
    }
};

const cargarImg = multer({ storage: guardarImg, limits: { fileSize: 10000 }, fileFilter: filterImg }).single('imgAvatar');

module.exports = cargarImg;