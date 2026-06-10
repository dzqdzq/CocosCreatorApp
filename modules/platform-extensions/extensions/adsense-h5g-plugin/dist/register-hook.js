async function register(e) {
  if (
    true !==
    (await Editor.Profile.getConfig("utils", "features.adsense-h5g-plugin"))
  ) {
    delete e.contributions;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
