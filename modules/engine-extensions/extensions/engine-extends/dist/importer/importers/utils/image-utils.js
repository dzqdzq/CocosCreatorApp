async function changeImageDefaultType(e, a) {
  if (e && e.imported === false && e.init === false && e.task > 0) {
    e.userData.type = a;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeImageDefaultType = undefined;
exports.changeImageDefaultType = changeImageDefaultType;
