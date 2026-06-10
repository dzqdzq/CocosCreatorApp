Object.defineProperty(exports, "__esModule", { value: true });
exports.tweenPosition = tweenPosition;
exports.tweenRotation = tweenRotation;
exports.tweenNumber = tweenNumber;
const cc_1 = require("cc");
const animations = [];
const frame = 1000 /* 1e3 */ / 60;
let time = 0;
function step(e) {
  if (time === 0 || animations.length === 0) {
    stopAnim();
  } else {
    setTimeout(() => {
      var t = time;
      time = Date.now();
      for (let t = 0; t < animations.length; ) {
        if (animations[t]._step(e) === false) {
          animations.splice(t, 1);
        } else {
          t++;
        }
      }
      step(time - t);
    });
  }
}
function startAnim() {
  if (time === 0) {
    time = Date.now();
    step(frame);
  }
}
function stopAnim() {
  time = 0;
}
class PositionAnimation {
  target = cc.v3();
  func = null;
  start = new cc_1.Vec3();
  end = new cc_1.Vec3();
  travel = 0;
  time = 0;
  constructor(t, e, i) {
    this.start = t;
    this.end = e;
    this.time = i;
  }
  _step(t) {
    this.travel += t;
    t = Math.min(this.travel / this.time, 1);
    cc.Vec3.lerp(this.target, this.start, this.end, t);

    if (this.func) {
      this.func(this.target);
    }

    return t < 1;
  }
  step(t) {
    this.func = t;
  }
}
class RotationAnimation {
  target = cc.quat();
  func = null;
  start = new cc_1.Quat();
  end = new cc_1.Quat();
  travel = 0;
  time = 0;
  constructor(t, e, i) {
    this.start = t;
    this.end = e;
    this.time = i;
  }
  _step(t) {
    this.travel += t;
    t = Math.min(this.travel / this.time, 1);
    cc_1.Quat.slerp(this.target, this.start, this.end, t);

    if (this.func) {
      this.func(this.target);
    }

    return t < 1;
  }
  step(t) {
    this.func = t;
  }
}
class NumberAnimation {
  target = 0;
  func = null;
  start = 0;
  end = 0;
  travel = 0;
  time = 0;
  constructor(t, e, i) {
    this.target = 0;
    this.func = null;
    this.start = t;
    this.end = e;
    this.travel = 0;
    this.time = i;
  }
  _step(t) {
    this.travel += t;
    t = Math.min(this.travel / this.time, 1);
    this.target = (1 - t) * this.start + t * this.end;

    if (this.func) {
      this.func(this.target);
    }

    return t < 1;
  }
  step(t) {
    this.func = t;
  }
}
function tweenPosition(t, e, i = 300) {
  t = new PositionAnimation(t, e, i);
  animations.push(t);
  startAnim();
  return t;
}
function tweenRotation(t, e, i) {
  t = new RotationAnimation(t, e, i);
  animations.push(t);
  startAnim();
  return t;
}
function tweenNumber(t, e, i) {
  t = new NumberAnimation(t, e, i);
  animations.push(t);
  startAnim();
  return t;
}
exports.position = tweenPosition;
exports.rotation = tweenRotation;
exports.number = tweenNumber;
