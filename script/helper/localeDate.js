module.exports = (function toLocaleTimeStringSupportsLocales() {
  try {
    new Date().toLocaleTimeString('i');
  }catch (e){
    return e.name === 'RangeError';
  }
  return false;
})();
