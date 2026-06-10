function compressJson(e) {
  if (typeof e != "object") {
    return e;
  }
  var r = {};
  let t = e;
  var o = new Set();
  let c = [];
  if (Array.isArray(e)) {
    collectArrayKey(e, r, o);

    if (o.size < 1) {
      return t;
    }

    c = Array.from(c);
    t = renameArrayJson(e, c);
  } else {
    collectObjectKey(e, r, o);

    if (o.size < 1) {
      return t;
    }

    c = Array.from(o);
    t = renameObjectJson(e, c);
  }
  return { keys: c, data: t };
}
function renameObjectJson(o, c) {
  if (!o) {
    return o;
  }
  const n = Object.create(null);

  Object.keys(o).forEach((e) => {
    let r = e;

    if (/^\d$/.test(e)) {
      c.push(e);
    }

    var t = c.indexOf(e);

    if (-1 !== t) {
      r = t;
    }

    if (o[e] && typeof o[e] == "object") {
      if (Array.isArray(o[e])) {
        n[r] = renameArrayJson(o[e], c);
      } else {
        n[r] = renameObjectJson(o[e], c);
      }
    } else {
      n[r] = o[e];
    }
  });

  return n;
}
function renameArrayJson(e, r) {
  return (
    e &&
    e.map((e) =>
      e && typeof e == "object"
        ? (Array.isArray(e) ? renameArrayJson : renameObjectJson)(e, r)
        : e
    )
  );
}
function collectObjectKey(r, t, o) {
  if (r) {
    Object.keys(r).forEach((e) => {
      if ((t[e] ? o.add(e) : (t[e] = 1), typeof r[e] == "object") ?? false) {
        (Array.isArray(r[e]) ? collectArrayKey : collectObjectKey)(r[e], t, o);
      }
    });
  }
}
function collectArrayKey(e, r, t) {
  if (e) {
    e.forEach((e) => {
      if (e && typeof e == "object") {
        (Array.isArray(e) ? collectArrayKey : collectObjectKey)(e, r, t);
      }
    });
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressJson = compressJson;
