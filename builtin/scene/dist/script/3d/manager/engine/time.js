Object.defineProperty(exports, "__esModule", { value: true });
let lastUpdateTime = 0;
let startTime = 0;
class Time {
  time = 0;
  realTime = 0;
  deltaTime = 0;
  frameCount = 0;
  maxDeltaTime = 0.3333333;
  update(e, t, i) {
    if (!t) {
      i = i || this.maxDeltaTime;
      t = e - lastUpdateTime;
      t = Math.min(i, t);
      this.deltaTime = t;
      lastUpdateTime = e;

      this.frameCount === 0
        ? (startTime = e)
        : ((this.time += t), (this.realTime = e - startTime));

      ++this.frameCount;
    }
  }
  restart(e) {
    this.time = 0;
    this.realTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    lastUpdateTime = e;
  }
}
exports.default = new Time();
