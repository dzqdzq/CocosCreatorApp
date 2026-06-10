Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
let tempState;
exports.methods = {
  open() {
    Editor.Panel.open("assets");
  },
  "open-preview"() {
    Editor.Panel.open("assets.preview");
  },
  staging(e) {
    if (e) {
      tempState = e;
      Editor.Profile.setTemp("assets", "state", e);
    }
  },
  async unstaging() {
    return tempState || (await Editor.Profile.getTemp("assets", "state"));
  },
};
