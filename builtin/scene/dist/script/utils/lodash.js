function get(t, e, r) {
  return (
    (Array.isArray(e) ? e : e.split(".").filter((t) => t))
      .flatMap((t) => (typeof t == "string" ? t.split(".") : t))
      .reduce((t, e) => t && t[e], t) || r
  );
}
function set(t, s, e) {
  if (Object(t) === t) {
    (s = Array.isArray(s) ? s : s.toString().match(/[^.[\]]+/g) || [])
      .slice(0, -1)
      .reduce(
        (t, e, r) =>
          Object(t[e]) === t[e]
            ? t[e]
            : (t[e] = Math.abs(s[r + 1]) >> 0 == +s[r + 1] ? [] : {}),
        t
      )[s[s.length - 1]] = e;
  }

  return t;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
exports.set = set;
