Object.defineProperty(exports, "__esModule", { value: true });
exports.componentDump = undefined;
class ComponentDump {
  encode(e, o, u) {
    o.value = { uuid: (e && e.uuid) || "" };
  }
  decode(e, o, u, n) {
    e[o.key] = cce.Component.query(u.value.uuid);
  }
}
exports.componentDump = new ComponentDump();
