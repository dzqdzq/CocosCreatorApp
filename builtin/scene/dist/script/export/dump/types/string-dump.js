Object.defineProperty(exports, "__esModule", { value: true });
exports.stringDump = undefined;
class StringDump {
  encode(e, t, r) {
    t.value = e;
  }
  decode(e, t, r, s) {
    r.value += "";
    e[t.key] = r.value;
  }
}
exports.stringDump = new StringDump();
