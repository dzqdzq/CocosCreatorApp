const defaultOption = { glsl1: true, glsl3: true, glsl4: true };
function stripEditorSupport(e, t = defaultOption) {
  for (const l of e.shaders) {
    delete l.varyings;

    if (!t.glsl4) {
      delete l.glsl4;
    }

    if (!t.glsl3) {
      delete l.glsl3;
    }

    if (!t.glsl1) {
      delete l.glsl1;
    }

    for (const o of l.defines) {
      delete o.defines;
      delete o.editor;
    }
  }
  for (const r of e.techniques) {
    for (const d of r.passes) {
      delete d.migrations;
      var d_properties = d.properties;
      if (d_properties) {
        for (const i in d_properties) {
          delete d_properties[i].editor;
        }
      }
    }
  }
  delete e.dependencies;
  return e;
}
module.exports = { stripEditorSupport };
