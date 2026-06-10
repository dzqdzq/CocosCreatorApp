Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
let tempState;
exports.methods = {
  open() {
    Editor.Panel.open("inspector");
  },
  staging(e) {
    if (e) {
      tempState = e;
    }
  },
  async unstaging() {
    return tempState || null;
  },
};
