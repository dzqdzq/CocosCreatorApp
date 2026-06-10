Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = serialize;
exports.deserialize = deserialize;
const virtual_1 = require("./virtual");
function serialize(e) {
  return (function t(e) {
    e.children.map((e) => t(e));
    return JSON.stringify(e);
  })(e);
}
function deserialize(e) {
  return (function t(e) {
    const r = new virtual_1.VirtualElement(e.tag);
    r.id = e.id;
    r.text = e.text;
    r.attrs = e.attrs;
    r.events = e.events;

    e.children.forEach((e) => {
      e = t(e);
      r.appendChild(e);
    });

    return r;
  })(JSON.parse(e));
}
