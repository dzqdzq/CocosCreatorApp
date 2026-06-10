function load() {}
function unload() {}
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.state = undefined;
exports.load = load;
exports.unload = unload;
exports.state = { baking: false };

exports.methods = {
  query() {
    var e;
    var o;
    var c = cc.director.getScene();
    if (c) {
      o = "lightProbeInfo";
      e = cc.Class.attr(c._globals, o);

      o = cce.Dump.encode.encodeObject(c._globals[o], e, c._globals);

      o.name = "Light Probe Info";
      return o;
    }
  },
  async update(e) {
    var o = cc.director.getScene();
    await cce.Dump.decode.decodePatch(e.name, e, o._globals.lightProbeInfo);

    cce.Gizmo.execGizmoMethods(
      cc.js.getClassName(ccm.LightProbeGroup),
      "lightProbeInfoChanged"
    );

    cce.Engine.repaintInEditMode();
    cce.SceneFacadeManager.recordNode(o);
    cce.SceneFacadeManager.snapshot();
  },
  refresh() {
    Editor.Message.send("light-probe", "refresh");
  },
  clear() {
    var e = cc.director.getScene();
    e._globals.lightProbeInfo.onProbeBakeCleared();

    cce.Gizmo.execGizmoMethods(
      cc.js.getClassName(ccm.LightProbeGroup),
      "lightProbeInfoChanged"
    );

    cce.Engine.repaintInEditMode();
    cce.SceneFacadeManager.recordNode(e);
    cce.SceneFacadeManager.snapshot();
    Editor.Message.broadcast("light-probe:clear");
  },
};
