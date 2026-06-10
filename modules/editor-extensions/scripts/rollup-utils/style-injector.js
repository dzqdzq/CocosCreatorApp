const styles = {};

const isOldIE =
  typeof navigator != "undefined" &&
  /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

module.exports = (e, l) => (t, s) => {
  var n;
  var o = isOldIE ? s.media || "default" : t;
  var o = styles[o] || (styles[o] = { ids: new Set(), styles: [] });
  if (!o.ids.has(t)) {
    o.ids.add(t);
    let s_source = s.source;

    if (s.map) {
      s_source =
        (s_source += "\n/*# sourceURL=" + s.map.sources[0] + " */") +
        "\n/*# sourceMappingURL=data:application/json;base64," +
        btoa(unescape(encodeURIComponent(JSON.stringify(s.map)))) +
        " */";
    }

    if (!o.element) {
      o.element = document.createElement("style");
      o.element.type = "text/css";
      s.media && o.element.setAttribute("media", s.media);

      (l =
        l === undefined
          ? document.shadowRoot ||
            document.getElementsByTagName("shadowRoot")[0]
          : l).appendChild(o.element);
    }

    if ("styleSheet" in o.element) {
      o.styles.push(s_source);

      o.element.styleSheet.cssText = o.styles.filter(Boolean).join("\n");
    } else {
      t = o.ids.size - 1;
      s = document.createTextNode(s_source);
      (n = o.element.childNodes)[t] && o.element.removeChild(n[t]);

      n.length ? o.element.insertBefore(s, n[t]) : o.element.appendChild(s);
    }
  }
};
