Object.defineProperty(exports, "__esModule", { value: true });
exports.createPreviewNode = createPreviewNode;
const cc_1 = require("cc");
const DontSave = cc_1.CCObject.Flags.DontSave;
const HideInHierarchy = cc_1.CCObject.Flags.HideInHierarchy;
function createPreviewNode(e) {
  e = new cc_1.Node(e);
  e.isPrivatePreview = true;
  e.objFlags |= DontSave | HideInHierarchy;
  return e;
}
