const n = "hljs-ln";
const e = "hljs-ln-line";
const t = "hljs-ln-code";
const r = "hljs-ln-numbers";
const l = "hljs-ln-n";
const i = "data-line-number";
const s = /\r\n|\r|\n/g;
function o(s, o) {
  var f = (o = o || { singleLine: false }).singleLine ? 0 : 1;

  (function n(e) {
    var t = e.childNodes;
    for (var r in t)
      if (t.hasOwnProperty(r)) {
        var l = t[r];

        if (u(l.textContent) > 0) {
          if (l.childNodes.length > 0) {
            n(l);
          } else {
            a(l.parentNode);
          }
        }
      }
  })(s);

  return (function (s, o) {
    var a = c(s);

    if ("" === a[a.length - 1].trim()) {
      a.pop();
    }

    if (a.length > o) {
      for (var u = "", f = 0, h = a.length; f < h; f++) {
        u += d(
          '<tr><td class="{0}"><div class="{1} {2}" {3}="{5}"></div></td><td class="{4}"><pre class="{1}">{6}</pre></td></tr>',
          [r, e, l, i, t, f + 1, a[f].length > 0 ? a[f] : " "]
        );
      }
      return d('<table class="{0}">{1}</table>', [n, u]);
    }
    return s;
  })(s.innerHTML, f);
}
function a(n) {
  var e = n.className;
  if (/hljs-/.test(e)) {
    for (var t = c(n.innerHTML), r = 0, l = ""; r < t.length; r++) {
      l += d('<span class="{0}">{1}</span>\n', [
        e,
        t[r].length > 0 ? t[r] : " ",
      ]);
    }
    n.innerHTML = l.trim();
  }
}
function c(n) {
  return 0 === n.length ? [] : n.split(s);
}
function u(n) {
  return (n.trim().match(s) || []).length;
}
function d(n, e) {
  return n.replace(/\{(\d+)\}/g, function (n, t) {
    return e[t] ? e[t] : n;
  });
}

module.exports = {
  lineNumbersBlock: function (n, e) {
    if ("object" == typeof n) {
      (function (n) {
        setTimeout(n, 0);
      })(function () {
        n.innerHTML = o(n, e);
      });
    }
  },
  lineNumbersValue: function (n, e) {
    if ("string" == typeof n) {
      var t = document.createElement("code");
      t.innerHTML = n;
      return o(t, e);
    }
  },
  addStyles: function (e) {
    var t = document.createElement("style");
    t.type = "text/css";

    t.innerHTML = d(
        ".{0}{border-collapse:collapse}.{0} td{padding:0}.{1}:before{content:attr({2})}",
        [n, l, i]
      );

    e.appendChild(t);
  },
};
