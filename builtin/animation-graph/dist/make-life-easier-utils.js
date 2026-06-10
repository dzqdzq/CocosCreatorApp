Object.defineProperty(exports, "__esModule", { value: true });
exports.bindIPC = bindIPC;
exports.instantiateIPCMethods = instantiateIPCMethods;
const ipcMethodBindingsTag = Symbol("[[IPC method bindings]]");
function getIPCMethodBindings(t) {
  if (typeof t == "object" && t) {
    return t.constructor[ipcMethodBindingsTag];
  }
}
function bindIPC(n) {
  return (t, e) => {
    if (!n) {
      if (typeof e != "string") {
        return void console.error(
          "When property key is not string, message name should be explicitly specified."
        );
      }
      n = e;
    }
    (t.constructor[ipcMethodBindingsTag] ??= {})[n] = { propertyKey: e };
  };
}
function instantiateIPCMethods(e) {
  var t = {};
  var n = getIPCMethodBindings(e);
  if (n) {
    for (const [i, o] of Object.entries(n)) {
      t[i] = (...t) => Reflect.apply(e[o.propertyKey], e, t);
    }
  }
  return t;
}
