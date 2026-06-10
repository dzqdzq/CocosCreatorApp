Object.defineProperty(exports, "__esModule", { value: true });
exports.Builder = undefined;
const serialization_1 = require("cc/editor/serialization");
class Builder {
  constructor(i) {
    this.minify = !!i.minify;
    this.stringify = !("stringify" in i && !i.stringify);
    this._useCCON = i.useCCON ?? false;
  }
  dump() {
    return this._useCCON ? this._dumpAsCCON() : this._dumpAsJson();
  }
  get hasBinaryBuffer() {
    return this._useCCON;
  }
  get mainBufferBuilder() {
    return this._mainBufferBuilder;
  }
  stringify;
  minify;
  _mainBufferBuilder = new serialization_1.BufferBuilder();
  _dumpAsJson() {
    var i = this.finalizeJsonPart();
    return this.stringify ? JSON.stringify(i, null, this.minify ? 0 : 2) : i;
  }
  _dumpAsCCON() {
    var i = this.finalizeJsonPart();
    var e = this._mainBufferBuilder;
    var e = e.byteLength === 0 ? [] : [e.get()];
    return new serialization_1.CCON(i, e);
  }
}
exports.Builder = Builder;
