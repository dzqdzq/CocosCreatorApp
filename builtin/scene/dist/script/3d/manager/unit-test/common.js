function returnFalseWithLog(e) {
  console.error(e);
  return false;
}
function getPrefabInfo(e) {
  return e._prefab;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnFalseWithLog = returnFalseWithLog;
exports.getPrefabInfo = getPrefabInfo;
