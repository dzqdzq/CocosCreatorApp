Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class EventManager extends events_1.EventEmitter {
  emit(e, ...t) {
    try {
      return super.emit(e, ...t);
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
exports.default = EventManager;
