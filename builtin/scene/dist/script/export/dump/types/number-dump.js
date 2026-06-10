Object.defineProperty(exports, "__esModule", { value: true });
exports.numberDump = undefined;
class NumberDump {
  encode(e, u, r) {
    u.value = e;
  }
  decode(e, u, r, s) {
    var a = +r.value;

    if (!isNaN(a)) {
      r.value = a;
    }

    e[u.key] = r.value;
  }
}
exports.numberDump = new NumberDump();
