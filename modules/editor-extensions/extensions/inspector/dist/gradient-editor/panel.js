Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.$ = undefined;
exports.fonts = undefined;
exports.template = undefined;
exports.style = undefined;

exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const d3 = require("d3");
const cloneDeep = require("lodash").cloneDeep;
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;
let cache;
function windowResize() {
  if (vm) {
    vm.resize();
  }
}
function mergeStops(i, o, t) {
  var e;
  var r;

  var a = i
    .concat(o)
    .map((t) => t.time)
    .sort((t, e) => t - e);

  var s = [...new Set(a)].reduce((t, e) => {
    var r = i.find((t) => !t.hide && t.time === e) || {};

    var a = o.find((t) => !t.hide && t.time === e) || {};

    if (r.time !== undefined || a.time !== undefined) {
      t.push({ ...r, ...a });
    }

    return t;
  }, []);

  cache.colorKeys = i;

  cache.alphaKeys = o.map((t) => {
    var e = Object.assign(t);
    e.alpha = Number((255 * t.alpha).toFixed());
    return e;
  });

  cache.mode = t;
  Editor.Message.send("inspector", "gradient-change", cache);
  for ([e, r] of s.entries()) {
    var { time, color, alpha } = r;

    if (color === undefined) {
      r.color = getValByType(e, time, s, "color", t);
    }

    if (alpha === undefined) {
      r.alpha = getValByType(e, time, s, "alpha", t);
    }
  }
  if (t !== 1) {
    return s;
  }
  var l;
  var c;
  var p = [];
  for ([l, c] of s.entries()) {
    var m;
    var c_time = c.time;
    p.push(c);

    if (l < s.length - 1) {
      m = s[l + 1];
      p.push({ ...m, time: c_time });
    }
  }
  return p;
}
function getValByType(e, t, r, a, i) {
  let o;
  let s;
  for (let t = e + 1; t < r.length; t++) {
    var n = r[t];
    if (n[a] !== undefined) {
      o = n;
      break;
    }
  }
  for (let t = e - 1; t >= 0; t--) {
    var d = r[t];
    if (d[a] !== undefined) {
      s = d;
      break;
    }
  }
  s = s || o;
  o = o || s;

  if (i === 1) {
    return o[a];
  }

  s = s || { color: [255, 255, 255], time: 0 };
  o = o || { color: [255, 255, 255], time: 1 };
  let h = s[a];
  return (h = s !== o ? interpolateStopProperty(s, o, t, a) : h);
}
function interpolateStopProperty(e, r, t, a) {
  var e_time = e.time;
  var r_time = r.time;
  const s = (t - e_time) / (r_time - e_time);
  const n = 1 - s;
  return a === "color"
    ? [0, 1, 2].map((t) => Math.round(e.color[t] * n + r.color[t] * s))
    : Math.round(100 * e.alpha * n + 100 * r.alpha * s) / 100;
}
function ready() {
  panel = this;
  vm?.$destroy();

  vm = new Vue({
    el: panel.$.container,
    data: {
      enumList: [
        { name: "Blend", value: 0 },
        { name: "Fixed", value: 1 },
      ],
      gradient: {
        mode: 0,
        alphaKeys: [
          { time: 0, alpha: 0, hide: false },
          { time: 1, alpha: 1, hide: false },
        ],
        colorKeys: [
          { time: 0.5, color: [249, 49, 83], hide: false },
          { time: 1, color: [255, 255, 255], hide: false },
        ],
      },
      margin: { top: 15, bottom: 15, left: 5, right: 5 },
      config: {
        anchorWidth: 10,
        anchorHeight: 15,
        width: 0,
        height: 75,
        defaultColor: [255, 255, 255],
        defaultAlpha: 1,
        colorLength: 8,
        alphaLength: 8,
      },
      selectedItem: null,
    },
    methods: {
      init(t) {
        t.colorKeys.map((t) => (t.type = "color"));

        t.alphaKeys.map((t) => {
          t.type = "alpha";
          t.alpha = t.alpha / 255;
        });

        this.gradient = t;
        this.selectedItem = null;
        this.resize();
      },
      getVal(t) {
        if (this.selectedItem) {
          switch (t) {
            case "color": {
              return JSON.stringify([...this.selectedItem.color, 255]);
            }
            case "time": {
              return "" + (100 * this.selectedItem.time).toFixed();
            }
            case "alpha": {
              return "" + (255 * this.selectedItem.alpha).toFixed();
            }
            default: {
              return this.selectedItem[t];
            }
          }
        }
      },
      confirm(t, e) {
        e = e.target.value;
        this.update({ operation: "assign", data: { value: e, type: t } });
      },
      getAnchors() {
        var { alphaKeys, colorKeys } = this.gradient;

        var colorKeys = colorKeys.map((t, e) => ({
          ...t,
          index: e,
        }));

        var alphaKeys = alphaKeys.map((t, e) => ({
          ...t,
          index: e,
        }));

        return colorKeys.concat(alphaKeys).sort((t, e) => {
          if (t.time === e.time) {
            if (t.active) {
              return true;
            }
            if (e.active) {
              return false;
            }
          }
          return t.time - e.time;
        });
      },
      getStops() {
        var { alphaKeys, colorKeys, mode } = this.gradient;
        return mergeStops(
          cloneDeep(colorKeys).sort((t, e) => {
            if (t.time === e.time) {
              if (t.active) {
                return false;
              }
              if (e.active) {
                return true;
              }
            }
            return t.time - e.time;
          }),
          cloneDeep(alphaKeys).sort((t, e) => {
            if (t.time === e.time) {
              if (t.active) {
                return false;
              }
              if (e.active) {
                return true;
              }
            }
            return t.time - e.time;
          }),
          mode
        );
      },
      drawStops(t, e) {
        t = this.getStops(t, e);

        e = this._grad.selectAll("stop").data(t, (t, e) => {
          var { color: t, alpha, time } = t;
          return "" + time + alpha + t + e;
        });

        e.exit().remove();

        e.enter()
          .append("stop")
          .merge(e)
          .attr("offset", (t) => 100 * t.time + "%")
          .style("stop-color", (t) => d3.rgb(...t.color))
          .style("stop-opacity", (t) => (t.alpha !== undefined ? t.alpha : 1));
      },
      drawAnchors(t) {
        var e = this.getAnchors();

        var {
          config: { width: r },
          margin,
        } = this;

        const i = r - margin.left - margin.right;
        const o = this;
        r = this._svg.selectAll("path").data(e, (t, e) => {
          var { color: t, alpha, time, type } = t;
          return "" + type + time + alpha + t + e;
        });
        r.exit().remove();
        let s = false;
        r.enter()
          .append("path")
          .merge(r)
          .attr("class", (e) =>
            ["hide", "add", "active"]
              .filter((t) => e[t])
              .concat(["anchor"])
              .join(" ")
          )
          .attr("index", (t) => t.index)
          .attr("type", (t) => t.type)
          .attr("d", (t) => this.drawAnchor(t))
          .attr("transform", (t) => `translate(${t.time * i}, 0)`)
          .attr("fill", (t) =>
            t.type === "color"
              ? d3.rgb(...t.color)
              : d3.rgb(...Array.from({ length: 3 }, () => 255 * t.alpha))
          )
          .order()
          .call(
            d3
              .drag()
              .filter(["dragstart", "drag"])
              .on("start", function () {
                var t = d3.select(this).datum();
                o.update({ data: t, operation: "active" });
              })
              .on("drag", () => {
                if (d3.event.dx || d3.event.dy) {
                  s = true;
                  o.update({ operation: "move" });
                }
              })
              .on("end", () => {
                if (s) {
                  s = false;
                  o.update({ operation: "drop" });
                }
              })
          );
      },
      update(t) {
        var {
          config: { width: e, height: r },
          margin,
        } = this;
        const { data, operation } = t;
        switch (operation) {
          case "active": {
            this.gradient.colorKeys.map((t) => {
              t.active = false;
            });

            this.gradient.alphaKeys.map((t) => {
              t.active = false;
            });

            var { type: index, index: type_2 } = data;
            var index = this.gradient[index + "Keys"][type_2];
            index.active = true;
            this.selectedItem = index;
            this.drawAnchors();
            break;
          }
          case "move": {
            var { type: type_2, index } = this._svg
              .select(".anchor.active")
              .datum();

            var d = this.gradient[type_2 + "Keys"];
            var index = d[index];
            var [h, type] = d3.mouse(this._svg.node());

            var type_2 =
              type_2 === "color"
                ? type < r - margin.bottom || r < type
                : type > margin.top || type < 0;

            var type =
              Math.round(
                ((h - margin.left) / (e - margin.left - margin.right)) * 100
              ) / 100;

            var h = Math.max(Math.min(type, 1), 0);
            index.time = h;

            if (index.hide && type_2) {
              return;
            }

            index.hide = d.length > 1 && type_2;
            this.drawAnchors();
            this.drawStops();
            break;
          }
          case "drop": {
            var { type, index: index_1 } = this._svg
              .select(".anchor.active")
              .datum();

            var h = this.gradient[type + "Keys"];
            var index = h[index_1];
            var [d, type_2] = d3.mouse(this._svg.node());

            var type =
              type === "color"
                ? type_2 < r - margin.bottom || r < type_2
                : type_2 > margin.top || type_2 < 0;

            var type_2 =
              Math.round(
                ((d - margin.left) / (e - margin.left - margin.right)) * 100
              ) / 100;

            var p = Math.max(Math.min(type_2, 1), 0);
            index.time = p;
            index.hide = h.length > 1 && type;

            if (index.hide) {
              h.splice(index_1, 1);
              this.selectedItem = null;
            } else {
              d = [...new Set(h.map((t) => t.time))];
              if (h.length > d.length) {
                let t;
                for (var [m, g] of h.entries()) {
                  if (g.time === p && m !== index_1) {
                    t = m;
                    break;
                  }
                }
                h.splice(t, 1);
              }
            }

            this.drawAnchors();
            this.drawStops();
            break;
          }
          case "create": {
            var [type_2, type] = d3.mouse(this._svg.node());
            if (type > margin.top && type < r - margin.bottom) {
              return false;
            }
            index = type > margin.top ? "color" : "alpha";
            d = this.gradient[index + "Keys"];
            h = d.length;
            if (h >= this.config[index + "Length"]) {
              return false;
            }
            type =
              Math.round(
                ((type_2 - margin.left) / (e - margin.left - margin.right)) *
                  100
              ) / 100;
            const data = {
              time: Math.max(Math.min(type, 1), 0),
              type: index,
              [index]:
                index == "color"
                  ? [...this.config.defaultColor]
                  : this.config.defaultAlpha,
              index: h,
            };
            d.push(data);
            this.drawStops();
            this.update({ data: data, operation: "active" });
            return true;
          }
          case "assign": {
            var { type: type_2, value } = data;
            if (type_2 === "mode") {
              this.gradient.mode = parseInt(value, 10);
              return this.drawStops();
            }
            if (this.selectedItem) {
              switch (type_2) {
                case "time": {
                  this.selectedItem.time = value / 100;
                  break;
                }
                case "alpha": {
                  this.selectedItem.alpha =
                    Math.floor((100 * value) / 255) / 100;
                  break;
                }
                case "color": {
                  this.selectedItem.color = value.slice(0, -1);
                }
              }
              this.drawAnchors();
              this.drawStops();
            }
          }
        }
      },
      resize() {
        const t = this;
        var e = this.$el.querySelector(".gradient");

        var {
          config: { width: r, height: a },
          margin,
        } = ((this.config.width = e.clientWidth), this);

        var o = r - margin.left - margin.right;
        var s = a - margin.top - margin.bottom;

        if (this._svg) {
          this._svg.attr("width", r);

          this._rect
            .attr("width", o)
            .attr("height", s)
            .attr("fill", "url(#grad)");
        } else {
          this._svg = d3
            .select(e)
            .append("svg")
            .attr("width", r)
            .attr("height", a);

          this._grad = this._svg
            .append("defs")
            .append("linearGradient")
            .attr("id", "grad")
            .attr("x1", "0")
            .attr("x2", "100%")
            .attr("y1", "0")
            .attr("y2", 0);

          this._rect = this._svg
            .append("rect")
            .attr("class", "canvas")
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", o)
            .attr("height", s)
            .attr("fill", "url(#grad)");
        }

        let n = false;

        this._svg.call(
          d3
            .drag()
            .on("start", () => {
              n = t.update({ operation: "create" });
            })
            .on("drag", () => {
              if (n) {
                t.update({ operation: "move" });
              }
            })
            .on("end", () => {
              if (n) {
                n = false;
                t.update({ operation: "drop" });
              }
            })
        );

        this.drawStops();
        this.drawAnchors();
      },
      drawAnchor(t) {
        var {
          margin,
          config: { height: r, anchorWidth: a, anchorHeight: i },
        } = this;

        var t = t.type;
        var t = t === "color";
        var e_left = margin.left;
        var r = t ? r - margin.bottom : margin.top;
        var margin = t ? 1 : -1;
        return `M${e_left} ${r}
                    L${e_left - a / 2} ${r + (i / 3) * margin}
                    ${e_left - a / 2} ${r + i * margin}
                    ${e_left + a / 2} ${r + i * margin}
                    ${e_left + a / 2} ${r + (i / 3) * margin}z`;
      },
    },
  });

  window.addEventListener("resize", windowResize);
  Editor.Message.send("inspector", "gradient-state", true);
}
function close() {
  window.removeEventListener("resize", windowResize);
  vm?.$destroy();
  vm = null;
  panel = null;
  Editor.Message.send("inspector", "gradient-state", false);
}

exports.style = readFileSync(join(__dirname, "../index.css"), "utf8");

exports.template = readFileSync(
  join(__dirname, "../../static", "/template/gradient-editor.html"),
  "utf8"
);

exports.fonts = [{ name: "inspector" }];
exports.$ = { container: ".gradient-editor" };

exports.methods = {
  data(t) {
    if (vm && t) {
      cache = t;

      vm.init({
        colorKeys: t.colorKeys,
        alphaKeys: t.alphaKeys,
        mode: t.mode,
      });
    }
  },
};
