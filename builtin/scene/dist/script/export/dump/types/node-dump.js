Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeDump = undefined;
class NodeDump {
  encode(e, u, d) {
    u.value = { uuid: (e && e.uuid) || "" };

    if (u.default) {
      u.default = null;
    }
  }
  decode(e, u, d, o) {
    var r;

    if (d.value && d.value.uuid) {
      r = cce.Node.query(d.value.uuid);

      u.key === "parent"
        ? ((d = !("keepWorldTransform" in d) || d.keepWorldTransform),
          e.setParent(r, d))
        : (e[u.key] = r);
    } else {
      e[u.key] = null;
    }
  }
}
exports.nodeDump = new NodeDump();
