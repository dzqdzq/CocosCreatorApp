"use strict";
const e = {
  "cc.ClickEvent": "cc-event-prop",
  "cc.CurveRange": "cc-curve-range",
  "cc.GradientRange": "cc-gradient-range",
  "cc.Gradient": "cc-gradient",
  "cc.ShapeModule": "cc-shape-module",
};
function t(a, r, n, l, i) {
  let s = n.value;
  let o = n.type;
  n.name = l.displayName ? l.displayName : Editor.UI.toHumanText(r);
  n.path = a;
  n.attrs = Object.assign({}, l);

  if (o) {
    if ("visible" in n) {
      n.attrs.visible = n.visible;
    }
  } else {
    n.attrs.visible = false;
  }

  let c = i[o];
  let u = false;
  let d = false;
  let p = Editor.UI.getProperty(o);

  if (c &&
    c.extends) {
    u = "cc.Asset" === o || -1 !== c.extends.indexOf("cc.Asset");
    d = -1 !== c.extends.indexOf("cc.Object");
  }

  if (!Array.isArray(n.value) || ("default" in l && !Array.isArray(l.default))) {
    if (u) {
      n.type = "cc.Asset";
      n.attrs.assetType = l.type;
    } else {
      if (d) {
        n.type = "cc.Node";
        n.attrs.typeid = l.type;

        if (c) {
          n.attrs.typename = c.name;
        }
      } else {
        if (!p) {
          n.type = "Object";

          if (c) {
            n.attrs.typename = c.name;
          }
        }
      }
    }
  } else {
    n.type = "Array";
    n.elementType = o;

    if (u) {
      n.elementType = "cc.Asset";
      n.attrs.assetType = l.type;
    } else {
      if (d) {
        n.elementType = "cc.Node";
        n.attrs.typeid = l.type;

        if (c) {
          n.attrs.typename = c.name;
        }
      } else {
        if (!p) {
          n.elementType = "Object";
        }
      }
    }
  }

  n.compType = "cc-prop";
  let _ = false;

  if (!("Object" !== n.type || (null !== n.value && void 0 !== n.value))) {
    _ = true;
  }

  let m = false;

  if (false === _ &&
      n.attrs.type &&
      o !== n.attrs.type) {
    if (c && c.extends) {
      if (-1 === c.extends.indexOf(n.attrs.type)) {
        m = true;
      }
    } else {
      m = true;
    }
  }

  if (_) {
    c = i[n.attrs.type];
    n.attrs.typename = c ? c.name : n.attrs.type;
    n.compType = "cc-null-prop";
  } else {
    if (m) {
      n.compType = "cc-type-error-prop";
    } else {
      if ("Array" === n.type) {
        n.compType = "cc-array-prop";
        for (let e = 0; e < s.length; ++e) {
          t(`${a}.${e}`, `[${e}]`, s[e], l, i);
        }
      } else {
        if ("Object" === n.type) {
          let r = e[o];
          n.compType = r || "cc-object-prop";
          let l = i[o];
          for (let e in n.value) {
            let r = n.value[e];
            let s = l.properties[e];

            if (r && s) {
              t(`${a}.${e}`, e, r, s, i);
            } else {
              delete n.value[e];
            }
          }
        }
      }
    }
  }
}
function a(e, a, r) {
  let n = a.type;
  if (!n) {
    Editor.warn("Type can not be null");
    return;
  }
  let l = r[n];

  if (l) {
    if (l.editor) {
      a.__editor__ = l.editor;
    }

    a.__displayName__ = l.name ? l.name : n;
  }

  for (let n in a.value) {
    let i = a.value[n];
    let s = l.properties[n];

    if (i && s) {
      t(`${e}.${n}`, n, i, s, r);
    } else {
      delete a.value[n];
    }
  }
}
let r = /^target\.__comps__\.(\d+)/;
const n = require("fire-url");
const { promisify: l } = require("util");

module.exports = {
  buildNode: function (e, t, r) {
    let n = t.__type__;
    if (!n) {
      Editor.warn("Type can not be null");
      return;
    }
    let l = r[n];

    if (l) {
      if (l.editor) {
        t.__editor__ = l.editor;
      }

      if (l.name) {
        t.__displayName__ = l.name;
      }
    }

    for (let n in t) {
      if ("__type__" === n || "__displayName__" === n || "uuid" === n) {
        continue;
      }
      if ("__comps__" === n) {
        let l = t[n];
        for (let t = 0; t < l.length; ++t) {
          a(`${e}.__comps__.${t}`, l[t], r);
        }
        continue;
      }
      let i = t[n];
      i.path = `${e}.${n}`;
      i.readonly = false;
      let s = l.properties[n];

      if (s) {
        t[n].readonly = !!s.readonly;
      }
    }
  },
  compPath: function (e) {
    let t = r.exec(e);
    return t ? t[0].replace(r, "target.__comps__[$1]") : "";
  },
  normalizePath: function (e) {
    return (e = (e = e.replace(/^target\./, "")).replace(
      /^__comps__\.\d+\./,
      ""
    ));
  },
  findRootVue: function (e) {
    for (var t = null; e; ) {
      if (e.__vue__) {
        t = e;
        break;
      }
      e = e.parentElement;
    }
    return t.__vue__;
  },
  syncObjectProperty: function (e, t, a, r) {
    for (
      var n,
        l = t.match(/target\.__comps__\.\d+/)[0],
        i = t.match(/target\.__comps__\.\d+\.(\S*)/)[1],
        s = l.split("."),
        o = e,
        c = 0;
      c < s.length;
      c++
    ) {
      if (null == o) {
        cc.warn('Failed to parse "%s", %s is nil', t, s[c]);
        return null;
      }
      o = n = o[s[c]];
    }
    Editor.Ipc.sendToPanel("scene", "scene:set-property", {
      id: n.value.uuid.value,
      path: i,
      type: a,
      value: r,
    });
  },
  checkDuplicateNameForBuiltinBundle: async function (e) {
    try {
      if ("folder" !== e.__assetType__ || !e.isBundle) {
        return false;
      }
      let t;
      let a = Object.values(cc.AssetManager.BuiltinBundleName);
      let r = {};
      let i = await l(Editor.remote.assetdb.queryMetas)("db://**", "folder");
      let s = e.multiValues.uuid;

      i.forEach((e) => {
        if (e.isBundle && !s.includes(e.uuid)) {
          let t = Editor.assetdb.remote.uuidToUrl(e.uuid);
          let a = e.bundleName || n.basename(t);
          r[a] = t;
        }
      });

      e.metas.bundleName;
      for (let l = 0; l < e.metas.length; ++l) {
        let i = e.metas[l];
        let s = Editor.assetdb.remote.uuidToUrl(i.uuid);
        let o = i.bundleName || n.basename(s);
        if (a.includes(o)) {
          t = Editor.T(
            "MESSAGE.asset_bundle.duplicate_reserved_keyword_message",
            { name: o }
          );
          break;
        }
        if (r[o] && r[o] !== s) {
          t = Editor.T("MESSAGE.asset_bundle.duplicate_name_message", {
            name: o,
            url: r[o],
          });
          break;
        }
        for (let a = 0; a < e.metas.length; ++a) {
          let r = e.metas[a];
          if (
            l !== a &&
            o ===
              (r.bundleName ||
                n.basename(Editor.assetdb.remote.uuidToUrl(r.uuid)))
          ) {
            let e = Editor.assetdb.remote.uuidToUrl(r.uuid);
            t = Editor.T("MESSAGE.asset_bundle.duplicate_name_message", {
              name: o,
              url: e,
            });
            break;
          }
        }
        if (t) {
          break;
        }
      }
      if (t) {
        Editor.Dialog.messageBox({
          type: "warning",
          title: " ",
          buttons: [Editor.T("MESSAGE.sure")],
          message: t,
          noLink: true,
          defaultId: 0,
        });

        return true;
      }
    } catch (e) {
      console.log(e);
    }
    return false;
  },
};
