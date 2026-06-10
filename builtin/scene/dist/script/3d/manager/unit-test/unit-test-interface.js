async function clearTestDir() {
  if (
    await Editor.Message.request(
      "asset-db",
      "query-asset-meta",
      exports.getTestDir()
    )
  ) {
    await Editor.Message.request(
      "asset-db",
      "delete-asset",
      exports.getTestDir()
    );
  }
}
function getTestDir() {
  return "db://assets/__test__";
}
function delay(t) {
  return new Promise((e) => {
    setTimeout(e, t);
  });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = delay;
exports.clearTestDir = clearTestDir;
exports.getTestDir = getTestDir;
