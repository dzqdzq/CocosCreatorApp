import { setBaseUrl } from "./base-url.js";
import { setImportMap } from "./import-map.js";
import { systemJSPrototype } from "systemjs-source/system-core.js";
export default function ({
  pathname = "/",
  importMap,
  importMapUrl,
  defaultHandler,
  handlers,
}) {
  var s = "no-schema:";
  setBaseUrl(s + pathname);
  setImportMap(importMap, s + "/" + importMapUrl);

  if (defaultHandler) {
    hookInstantiationOverSchema(s, wrapHandler(defaultHandler));
  }

  if (handlers) {
    for (const a of Object.keys(handlers)) {
      hookInstantiationOverSchema(a, wrapHandler(handlers[a]));
    }
  }
}
function isThenable(t) {
  return Boolean(t && typeof t.then == "function");
}
function wrapHandler(n) {
  return function (t) {
    const e = this;
    let r;
    try {
      r = n(t);
    } catch (t) {
      return Promise.reject(t);
    }
    return isThenable(r)
      ? new Promise((t) =>
          r.then(() => {
            t(e.getRegister());
          })
        )
      : e.getRegister();
  };
}
function hookInstantiationOverSchema(n, o) {
  const systemJSPrototype_instantiate = systemJSPrototype.instantiate;
  systemJSPrototype.instantiate = function (t, e) {
    var r = t.substr(0, n.length) === n ? t.substr(n.length) : null;
    return r === null
      ? systemJSPrototype_instantiate.call(this, t, e)
      : o.call(this, r, e);
  };
}
