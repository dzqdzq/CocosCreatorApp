Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewBase = undefined;
class PreviewBase {
  previewBuffer;
  async queryPreviewData(e) {
    return await this.previewBuffer.getImageData(e.width, e.height);
  }
  queryPreviewDataQueue(e, r) {
    this.previewBuffer.getImageDataInQueue(e.width, e.height, r);
  }
  clearPreviewBuffer() {
    this.previewBuffer.clear();
  }
  init(e, r) {}
}
exports.PreviewBase = PreviewBase;
