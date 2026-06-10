Object.defineProperty(exports, "__esModule", { value: true });
exports.deserialize = undefined;
exports.serialize = undefined;
exports.VirtualElement = undefined;
var virtual_1 = require("./virtual");

Object.defineProperty(exports, "VirtualElement", {
  enumerable: true,
  get() {
    return virtual_1.VirtualElement;
  },
});

var serialize_1 = require("./serialize");

Object.defineProperty(exports, "serialize", {
  enumerable: true,
  get() {
    return serialize_1.serialize;
  },
});

Object.defineProperty(exports, "deserialize", {
  enumerable: true,
  get() {
    return serialize_1.deserialize;
  },
});
