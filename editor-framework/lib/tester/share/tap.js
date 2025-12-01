process.env.TAP_COLORS = 1;
process.env.TAP_USE_TTY = 1;
let t = require("tap");
let e = require("tap-mocha-reporter");

t.init = function (o) {
  t.unpipe(process.stdout);
  t.pipe(e(o));
};

t.Test.prototype.addAssert("approx", 3, function (t, e, o, p, r) {
  let n = Math.abs(t - e);
  o = o || 1e-4;
  p = p || `should be approximate (${o})`;
  return n <= o
    ? this.pass(p, r)
    : ((r.found = t), (r.wanted = e), (r.compare = "~="), this.fail(p, r));
});

t.Test.prototype.addAssert("notApprox", 3, function (t, e, o, p, r) {
  let n = Math.abs(t - e);
  o = o || 1e-4;
  p = p || `should be not approximate (${o})`;
  return n > o
    ? this.pass(p, r)
    : ((r.found = t), (r.wanted = e), (r.compare = "!~="), this.fail(p, r));
});

t.suite = function (e, o, p, r) {
  if (!(e instanceof t.Test)) {
    throw new TypeError("Expected tap.Test instance, got " + typeof e);
  }
  if ("string" != typeof o) {
    throw new TypeError("Expected string, got " + typeof o);
  }
  let n;

  if ("function" == typeof p) {
    r = p;
  }

  if ("object" == typeof p) {
    if (void 0 === (n = p).autoend) {
      n.autoend = true;
    }

    if (void 0 === n.timeout) {
      n.timeout = 0;
    }
  } else {
    n = { autoend: true, timeout: 0 };
  }

  return e.test(o, n, r);
};

module.exports = t;
