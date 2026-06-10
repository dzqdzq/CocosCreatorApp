const DEFAULT_KEYFRAMES = [
  [
    { time: 0, value: 1, outTangent: 0, inTangent: 0 },
    { time: 1, value: 1, outTangent: 0, inTangent: 0 },
  ],
  [
    { time: 0, value: 0, outTangent: 1, inTangent: 1 },
    { time: 1, value: 1, outTangent: 1, inTangent: 1 },
  ],
  [
    { time: 0, value: 1, outTangent: -1, inTangent: -1 },
    { time: 1, value: 0, outTangent: -1, inTangent: -1 },
  ],
  [
    { time: 0, value: 0, outTangent: 0, inTangent: 0 },
    { time: 1, value: 1, outTangent: 2, inTangent: 2 },
  ],
  [
    { time: 0, value: 1, outTangent: -2, inTangent: -2 },
    { time: 1, value: 0, outTangent: 0, inTangent: 0 },
  ],
  [
    { time: 0, value: 0, outTangent: 2, inTangent: 2 },
    { time: 1, value: 1, outTangent: 0, inTangent: 0 },
  ],
  [
    { time: 0, value: 1, outTangent: 0, inTangent: 0 },
    { time: 1, value: 0, outTangent: 0, inTangent: 0 },
  ],
];
class Point {
  constructor(n) {
    this.x = Number(n.x);
    this.y = Number(n.y);

    if (n.type) {
      this.type = n.type;
    }
  }
}
function drawLine(n, e, t) {
  t.beginPath();
  t.moveTo(n.x, n.y);
  t.lineTo(e.x, e.y);
  t.closePath();
  t.stroke();
}
function calcHermite(n, e, t, a) {
  if (e === Number.POSITIVE_INFINITY || a === Number.POSITIVE_INFINITY) {
    return { a: 0, b: 0, c: 0, d: n.y };
  }
  var i;
  var n_x = n.x;
  var n = n.y;
  var t_x = t.x;
  var t = t.y;
  let T;
  let r;
  let g;
  let c;
  let l;
  let m;

  var s = [
    1,
    n_x,
    n_x * n_x,
    n_x * n_x * n_x,
    1,
    t_x,
    t_x * t_x,
    t_x * t_x * t_x,
    0,
    1,
    2 * n_x,
    3 * n_x * n_x,
    0,
    1,
    2 * t_x,
    3 * t_x * t_x,
  ];

  var v = (n) =>
    n[0] * n[4] * n[8] +
    n[1] * n[5] * n[6] +
    n[2] * n[3] * n[7] -
    n[2] * n[4] * n[6] -
    n[1] * n[3] * n[8] -
    n[0] * n[5] * n[7];

  for (T = m = 0; T < 4; m += v(l) * s[T] * (T % 2 ? -1 : 1), T++) {
    if (s[T]) {
      r = 4;

      for (l = []; r < s.length; r++) {
        if (r % 4 !== T) {
          l.push(s[r]);
        }
      }
    }
  }
  i = [];

  for (T = 0; T < 4; T++) {
    for (
      r = 0;
      r < 4;
      i[T + 4 * r] = (((T + r) % 2 ? -1 : 1) * v(l)) / m, r++
    ) {
      l = [];

      for (g = 0; g < 3; g++) {
        for (c = 0; c < 3; c++) {
          l.push(s[((T + g + 1) % 4) * 4 + ((r + c + 1) % 4)]);
        }
      }
    }
  }

  return {
    a: n * i[12] + t * i[13] + e * i[14] + a * i[15],
    b: n * i[8] + t * i[9] + e * i[10] + a * i[11],
    c: n * i[4] + t * i[5] + e * i[6] + a * i[7],
    d: n * i[0] + t * i[1] + e * i[2] + a * i[3],
  };
}
function drawHermite(n, e, t) {
  n = n || DEFAULT_KEYFRAMES[0];
  const a = e.canvas.width;
  const i = e.canvas.height;
  e.clearRect(0, 0, a, i);
  let o;
  o = t ? i / a / 2 : i / a;
  var u = n.map((n) => ({
    point: { x: n.time * a, y: n.value * i },
    outTangent: typeof n.outTangent == "number" ? n.outTangent * o : Infinity,
    inTangent: typeof n.inTangent == "number" ? n.inTangent * o : Infinity,
  }));
  for (let n = 0; n < u.length - 1; n++) {
    var T = u[n + 1];
    var r = u[n];
    var g = calcFunc(calcHermite(r.point, r.outTangent, T.point, T.inTangent));
    e.beginPath();
    for (let n = r.point.x; n <= T.point.x; n++) {
      if (t) {
        e.lineTo(n, i - 0.5 * g(n) - i / 2);
      } else {
        e.lineTo(n, i - g(n));
      }
    }

    if (
      r.outTangent === Number.POSITIVE_INFINITY ||
      T.inTangent === Number.POSITIVE_INFINITY
    ) {
      e.lineTo(T.point.x, i - T.point.y);
      console.log(u, n);
      e.stroke();
    }

    e.stroke();
  }

  if (t) {
    e.strokeStyle = "#ccc";
    e.lineWidth = 0.5;
    e.beginPath();
    e.moveTo(0, i / 2);
    e.lineTo(a, i / 2);
    e.stroke();
  }
}
function calcFunc(n) {
  const { a: a_1, b, c, d } = n;
  return (n) => a_1 * n * n * n + b * n * n + c * n + d;
}
module.exports = {
  Point,
  drawLine,
  calcHermite,
  drawHermite,
  calcFunc,
  DEFAULT_KEYFRAMES,
};
