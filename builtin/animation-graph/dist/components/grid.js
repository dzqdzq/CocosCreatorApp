function data() {
  return {
    scale: 1,
    interval: 32,
    fillStyle: "#2b2b2b",
    strokeStyle: "#2b2b2b",
    lineWidth: 0.5,
    startX: 0,
    startY: 0,
  };
}
function mounted() {
  const e = this;
  e.ctx = e.$el.getContext("2d");

  e.observer = new window.ResizeObserver(() => {
    e.resize();
  }).observe(e.$el.parentElement);

  e.resize();
}
function destroyed() {
  var e = this;

  if (e.observer) {
    e.observer.unobserve(e.$el.parentElement);
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.watch = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;
exports.destroyed = destroyed;

exports.template = `
   <canvas></canvas>
`;

exports.watch = {
  "$parent.graph.scale"(e) {
    this.scale = e;
    this.render();
  },
  "$parent.graph.top"(e) {
    this.startY = e;
    this.render();
  },
  "$parent.graph.left"(e) {
    this.startX = e;
    this.render();
  },
};

exports.methods = {
  resize(e, t) {
    var r;
    var i = this;

    if (!e || !t) {
      r = i.$el.getBoundingClientRect();
      e = e || r.width;
      t = t || r.height;
      e = Math.round(e);
      t = Math.round(t);
    }

    if (i.$el.width !== e || i.$el.height !== t) {
      i.$el.width = e;
      i.$el.height = t;
      i.render();
    }
  },
  render() {
    var t = this;

    t.ctx.clearRect(0, 0, t.$el.width, t.$el.height);
    t.ctx.fillStyle = t.fillStyle;
    t.ctx.beginPath();
    var r = t.interval * t.scale;

    var i = t.startX + t.$el.width / 2;
    var l = t.startY + t.$el.height / 2;
    t.ctx.arc(i - t.lineWidth, l - t.lineWidth, r / 10, 0, 2 * Math.PI, false);
    t.ctx.fill();
    for (let e = i - t.lineWidth; e > 0; e -= r) {
      t.ctx.moveTo(e, 0);
      t.ctx.lineTo(e, t.$el.height);
    }
    for (let e = i - t.lineWidth; e < t.$el.width; e += r) {
      t.ctx.moveTo(e, 0);
      t.ctx.lineTo(e, t.$el.height);
    }
    for (let e = l - t.lineWidth; e > 0; e -= r) {
      t.ctx.moveTo(0, e);
      t.ctx.lineTo(t.$el.width, e);
    }
    for (let e = l - t.lineWidth; e < t.$el.height; e += r) {
      t.ctx.moveTo(0, e);
      t.ctx.lineTo(t.$el.width, e);
    }
    t.ctx.closePath();
    t.ctx.strokeStyle = t.strokeStyle;
    t.ctx.lineWidth = t.lineWidth;
    t.ctx.stroke();
  },
};
