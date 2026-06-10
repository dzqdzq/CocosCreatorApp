Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageProtocolScene = getMessageProtocolScene;
let getMessageProtocolSceneResult = "";
let getMessageProtocolSceneStartTime = Date.now();
function getMessageProtocolScene(e) {
  if (
    !(
      (
        getMessageProtocolSceneResult &&
        Date.now() - getMessageProtocolSceneStartTime < 1000
      ) /* 1e3 */
    )
  ) {
    getMessageProtocolSceneResult = "";

    for (getMessageProtocolSceneStartTime = Date.now(); e; ) {
      if ((e = e.parentElement || e.getRootNode().host) && e.messageProtocol) {
        getMessageProtocolSceneResult = e.messageProtocol.scene;
        break;
      }
    }

    getMessageProtocolSceneResult = getMessageProtocolSceneResult || "scene";
  }
  return getMessageProtocolSceneResult;
}
