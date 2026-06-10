Object.defineProperty(exports, "__esModule", { value: true });
const DontSave = cc.Object.Flags.DontSave;
const HideInHierarchy = cc.Object.Flags.HideInHierarchy;
class WireframeNode extends cc.Node {
  _isWireframeNode = true;
  constructor(e) {
    super(e);
    this.objFlags |= DontSave | HideInHierarchy;
  }
  get isWireframeNode() {
    return this._isWireframeNode;
  }
}
exports.default = WireframeNode;
