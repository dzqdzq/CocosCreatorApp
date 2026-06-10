async function load() {}
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;

exports.methods = {
  async query() {
    const o = await Editor.Profile.getConfig("device", "");
    const s = [];

    o.deviceConfig.forEach((e) => {
      if (o.enableDevice[e.name]) {
        s.push(e);
      }
    });

    o.custom.forEach((e) => {
      if (o.enableDevice[e.name]) {
        s.push(e);
      }
    });

    return s;
  },
  async customDeviceChanged() {
    Editor.Message.broadcast("device:devices-changed");
  },
};
