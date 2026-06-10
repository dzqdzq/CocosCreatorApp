async function changeImageDefaultType(e, t) {
  if (e && e.imported === false && e.init === false && e.task > 0) {
    e.userData.type = t;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeImageDefaultType = changeImageDefaultType;
