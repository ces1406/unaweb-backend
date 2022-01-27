function cambiarId(obj, nombCampo) {
  let o = JSON.parse(JSON.stringify(obj));
  o[nombCampo] = o._id;
  delete o._id;
  return o;
}

module.exports = cambiarId;
