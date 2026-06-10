function promisify(i) {
  return (...t) =>
    new Promise((e, n) => {
      t.push((t, i) => {
        if (t) {
          n(t);
        } else {
          e(i);
        }
      });

      i(...t);
    });
}
function isObject(t) {
  return typeof t == "object" && t !== null;
}
function isString(t) {
  return typeof t == "string";
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.promisify = promisify;
exports.isObject = isObject;
exports.isString = isString;
