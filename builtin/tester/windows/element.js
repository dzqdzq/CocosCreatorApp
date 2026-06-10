exports.query = (e, l, r) => {
  var o = document.querySelector("#dock").shadowRoot;
  let t = null;
  if (o) {
    o = o.querySelector(`panel-frame[name="${e}"]`);
    if (!o || !o.shadowRoot) {
      return null;
    }
    t = o.shadowRoot;
    for (let e = 0; e < l.length; e++) {
      var n = l[e];
      if (
        !(t =
          typeof n == "number"
            ? t[n] || null
            : (t = t.length !== undefined ? t[0] : t).querySelectorAll(n) ||
              null)
      ) {
        return null;
      }
    }
  }
  return t;
};
