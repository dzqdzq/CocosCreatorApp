Object.defineProperty(exports, "__esModule", { value: true });
exports.attach = attach;
exports.detach = detach;
exports.init = init;
exports.getConfig = getConfig;
const pluginsGroup = {};
let started = false;
function attach(e) {
  if (
    e.info.contributions?.console?.extendConfig &&
    e.info.contributions.console?.extendConfig.length !== 0 &&
    !pluginsGroup[e.name]
  ) {
    pluginsGroup[e.name] = e.info.contributions.console.extendConfig;
  }
}
function detach(e) {
  if (
    e.info.contributions?.console?.extendConfig &&
    e.info.contributions.console?.extendConfig.length !== 0 &&
    pluginsGroup[e.name]
  ) {
    delete pluginsGroup[e.name];
  }
}
function init() {
  if (!started) {
    started = true;
    Editor.Package.getPackages({ enable: true }).forEach(attach);
  }
}
async function getConfig() {
  return (
    await Object.entries(pluginsGroup).reduce(async (e, [t, n]) => {
      e = await e;
      for (const s of n) {
        var { value, show } =
          (await Editor.Profile.getConfig(t, s.key, "global")) ?? {};
        s.value = value ?? false;
        s.show = show ?? false;
        s.name = t;
      }
      e.push(...n);
      return e;
    }, Promise.resolve([]))
  ).filter((e) => e.show);
}
