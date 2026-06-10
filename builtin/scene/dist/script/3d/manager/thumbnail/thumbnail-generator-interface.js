Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseThumbnailGenerator = undefined;
class BaseThumbnailGenerator {
  width;
  height;
  constructor() {
    this.width = 128;
    this.height = 128;
  }
  getThumbnail(e, t) {
    return new Promise(() => {});
  }
  setSize(e, t) {
    this.width = e;
    this.height = t;
  }
}
exports.BaseThumbnailGenerator = BaseThumbnailGenerator;
