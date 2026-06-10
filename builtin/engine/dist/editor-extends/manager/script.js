Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class ScriptManager extends events_1.EventEmitter {
  allow = false;
  _map = {};
  add(e, t) {
    if (
      this.allow &&
      ((this._map[e] = this._map[e] || []), !this._map[e].includes(t))
    ) {
      this._map[e].push(t);
    }
  }
  remove(e, t) {
    if (this.allow && this._map[e] && -1 !== (t = this._map[e].indexOf(t))) {
      this._map[e].splice(t);
    }
  }
  getCtors(e) {
    return (this._map[e] || []).slice();
  }
}
exports.default = ScriptManager;
