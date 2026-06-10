const tokenizer = require("glsl-tokenizer/string");
const parser = require("glsl-parser/direct");
const mappings = require("./offline-mappings");
const yaml = require("js-yaml");
const tabAsSpaces = 2;
const plainDefineRE = /#define\s+(\w+)\s+(\w+)/g;
const effectDefineRE = /#pragma\s+define\s+(\w+)\s+(.*)\n/g;
const ident = /[_a-zA-Z]\w*/g;
const labelRE = /(\w+)\((.*?)\)/;
const locationRE = /location\s*=\s*(\d+)/;

const inDecl =
  /(?:layout\s*\((.*?)\)\s*)?in ((?:\w+\s+)?\w+\s+(\w+)\s*(?:\[[\d\s]+])?)\s*;/g;

const outDecl =
  /(?:layout\s*\((.*?)\)\s*)?(?<=\b)out ((?:\w+\s+)?\w+\s+(\w+)\s*(?:\[[\d\s]+])?)\s*;/g;

const layoutExtract = /layout\s*\((.*?)\)(\s*)$/;
const bindingExtract = /(?:location|binding)\s*=\s*(\d+)/;
const builtinRE = /^cc\w+$/i;
const pragmasToStrip = /^\s*(?:#pragma\s*)(?!STDGL|optimize|debug).*$\n/gm;
const textureFuncRemap = new Map([["ExternalOES", "2D"]]);
let effectName = "";
let shaderName = "";
let shaderTokens = [];

const formatMsg = (e, t) =>
  effectName +
  ".effect - " +
  shaderName +
  (t !== undefined ? ` - ${t}: ` : ": ") +
  e;

const options = {
  throwOnError: true,
  throwOnWarning: false,
  noSource: false,
  skipParserTest: false,
  chunkSearchFn: (e) => ({}),
  getAlternativeChunkPaths: (e) => [],
};

const dumpSource = (e) => {
  let r = 0;
  return e.reduce(
    (e, t) =>
      t.line > r
        ? e +
          (`
${(r = t.line)}	` +
            t.data.replace(/\n/g, ""))
        : e + t.data,
    ""
  );
};

const throwFnFactory = (s, n) => (e, t) => {
  var r =
    undefined !== (t = options.noSource ? undefined : t)
      ? " ↓↓↓↓↓ EXPAND THIS MESSAGE FOR MORE INFO ↓↓↓↓↓" +
        dumpSource(shaderTokens) +
        "\n"
      : "";

  var e = formatMsg(s + " " + e, t) + r;
  if (options.throwOnWarning) {
    throw e;
  }
  n(e);
};

const warn = throwFnFactory("Warning", console.warn);
const error = throwFnFactory("Error", console.error);

const convertType = (e) => {
  var t = mappings.typeMap[e];
  return t === undefined ? e : t;
};

const VSBit = mappings.getShaderStage("vertex");
const FSBit = mappings.getShaderStage("fragment");
const CSBit = mappings.getShaderStage("compute");

const mapShaderStage = (e) => {
  switch (e) {
    case "vert": {
      return VSBit;
    }
    case "frag": {
      return FSBit;
    }
    case "compute": {
      return CSBit;
    }
    default: {
      return 0;
    }
  }
};

const stripComments = (() => {
  const r = /\r\n/g;
  const s = /\/\*.*?\*\//gs;
  const n = /\s*\/\/.*$/gm;
  return (e) => {
    let t = e.replace(s, "");
    return (t = (t = t.replace(n, "")).replace(r, "\n"));
  };
})();

const globalChunks = {};
const globalDeprecations = { chunks: {}, identifiers: {} };

const addChunk = (() => {
  const c = /#pragma\s+deprecate-(chunk|identifier)\s+([\w-]+)(?:\s+(.*))?/g;
  return (e, t, r = globalChunks, s = globalDeprecations) => {
    var n = stripComments(t);
    let a = c.exec(n);
    let i = "";
    let o = 0;

    while (a) {
      var l = a[1] + "s";

      if (!s[l]) {
        s[l] = {};
      }

      s[l][a[2]] = a[3];
      i += n.slice(o, a.index);
      o = a.index + a[0].length;
      a = c.exec(n);
    }

    r[e] = i + n.slice(o);
  };
})();

const invokeSearch = (e) => {
  var { name: e, content } = options.chunkSearchFn(e);
  return content !== undefined ? (addChunk(e, content), e) : "";
};

const unwindIncludes = (() => {
  const p = /^(.*)#include\s+[<"]([^>"]+)[>"](.*)$/gm;
  let d;
  return (t, e, r, s = new Set()) => {
    var o;
    var l;
    var c;

    d =
      ((o = e),
      (l = r.chunks),
      (c = s),
      (e, t, r, s) => {
        var n = (r = (r = r.trim()).endsWith(".chunk") ? r.slice(0, -6) : r);
        if (c.has(r)) {
          return "";
        }

        if (l[r] !== undefined) {
          error(`EFX2003: header '${r}' is deprecated: ` + l[r]);
        }

        let a = undefined;
        do {
          if (undefined !== (a = o[r])) {
            break;
          }
          var i = options.getAlternativeChunkPaths(r);
          if (
            i.some((e) => o[e] !== undefined && ((r = e), (a = o[e]), true))
          ) {
            break;
          }
          r = invokeSearch([].concat(r, i));

          if (undefined !== (a = globalChunks[r])) {
            break;
          }

          error(`EFX2001: can not resolve '${n}'`);
          return "";
        } while (0);
        c.add(r);

        if (t) {
          a = a.replace(/^/gm, t);
        }

        a = (a = s ? a.replace(/\n/g, s + "\n") + s : a).replace(p, d);
        return a;
      });

    t = t.replace(p, d);

    if (r.identifierRE) {
      let e = r.identifierRE.exec(t);

      while (e) {
        var n = r.identifiers[e[1]];

        if (n) {
          error(`EFX2004: identifier '${e[1]}' is deprecated: ` + n);
        }

        e = r.identifierRE.exec(t);
      }
    }

    return t;
  };
})();

const expandFunctionalMacro = (() => {
  const y = (e, t) => {
    if (e[t] !== "(") {
      return t;
    }
    let r = 1;
    let s = t + 1;
    for (
      ;
      s < e.length && (e[s] === "(" && r++, e[s] === ")" && r--, r !== 0);
      s++
    ) {}
    return s;
  };

  const x = (t) => {
    var r = [];
    let s = 0;
    for (let e = 0; e < t.length; e++) {
      if (t[(e = t[e] === "(" ? y(t, e) + 1 : e)] === ",") {
        r.push(t.substring(s, e).trim());
        s = e + 1;
      }
    }

    if (s !== t.length || t[t.length - 1] === ",") {
      r.push(t.substring(s).trim());
    }

    return r;
  };

  const r = /#pragma\s+define\s+(\w+)\(([\w,\s]*)\)\s+(.*?)\n/g;
  const v = /(?<=\w)##(?=\w)/g;
  const E = /\\\s*?\n/g;
  const _ = /@@/g;
  const $ = /#pragma\s+define|#define/;
  return (s) => {
    s = s.replace(E, "@@");
    let e = r.exec(s);

    while (e !== null) {
      var [, n, , i] = e;
      var a = x(e[2]);
      var e_index = e.index;
      var o = e.index + e[0].length;
      var l = new RegExp("^(.*?)" + n + "\\s*\\(", "gm");
      if (new RegExp("\\b" + n + "\\b").test(i)) {
        warn(`EFX2002: recursive macro processor '${n}'`);
      } else {
        for (let r = l.exec(s); r !== null; r = l.exec(s)) {
          var c = r.index + r[0].length - 1;
          if (!(e_index < c && c < o)) {
            var [, p] = r;
            var d = r.index + p.length;
            var c = y(s, c) + 1;
            var f = x(s.slice(r.index + r[0].length, c - 1));

            if (f.length !== a.length) {
              warn(
                `EFX2005: not enough arguments for function-like macro invocation '${n}'`
              );
            }

            var u = [];

            for (let e = 0; e < a.length; e++) {
              for (
                var m, g = new RegExp("\\b" + a[e] + "\\b", "g");
                null !== (m = g.exec(i));

              ) {
                u.push({ beg: m.index, end: g.lastIndex, target: f[e] });
              }
            }
            let e_index = "";
            let e = 0;
            for (const h of u.sort((e, t) => e.beg - t.beg)) {
              e_index += i.slice(e, h.beg) + h.target;
              e = h.end;
            }
            e_index += i.slice(e, i.length);

            if ($.test(p)) {
              var b = p.lastIndexOf("@@");
              var b = b < 0 ? p : p.slice(b + 2);
              let e = b.search(/\S/);

              if (e < 0) {
                e = b.length;
              }

              e_index = e_index.replace(_, "@@" + " ".repeat(e));
            } else {
              let e = p.search(/\S/);

              if (e < 0) {
                e = p.length;
              }

              e_index = (e_index = e_index.replace(v, "")).replace(
                _,
                "\n" + " ".repeat(e)
              );
            }

            s = s.substring(0, d) + e_index + s.substring(c);
            l.lastIndex -= r[0].length;
          }
        }
      }
      s = s.substring(0, e_index) + s.substring(o);
      r.lastIndex = 0;
      e = r.exec(s);
    }

    s.replace(_, "\\\n");
    return s;
  };
})();

const expandInputStatement = (e) => {
  let t = 0;
  let r = 0;
  let s = 0;
  let n = 0;
  let a;
  var i = {
    u: ["uvec4", "usubpassInput"],
    i: ["ivec4", "isubpassInput"],
    f: ["vec4", "subpassInput"],
  };
  let o = "";
  let l = false;
  let c = false;
  for (const x of e) {
    var { type, inout, name } = x;

    var d = i[x.signed];
    var m = x.precision || "";
    var g = type !== "Color" ? a ?? t : t;

    var b =
      "\n#if __VERSION__ >= 450\n" +
      `  layout(location = ${n}) out ${d[0]} ${name};
` +
      `#elif __VERSION__ >= 300
` +
      `  layout(location = ${s}) out ${d[0]} ${name};
` +
      `#endif
`;

    var h =
      "\n#if __VERSION__ >= 450\n" +
      `  layout(location = ${n}) out ${d[0]} ${name};
` +
      `#endif
`;

    var y =
      `
` +
      `#pragma rate __in${name} pass
` +
      `#if CC_DEVICE_CAN_BENEFIT_FROM_INPUT_ATTACHMENT
` +
      `  #if __VERSION__ >= 450
` +
      `    layout(input_attachment_index = ${g}) uniform ${d[1]} __in${name};
` +
      `    #define subpassLoad_${name} subpassLoad(__in${name})
` +
      `  #else
` +
      `    #define subpassLoad_${name} ${d[0]}(gl_LastFrag${type}ARM, 0, 0, 0)
` +
      `  #endif
` +
      `#else
` +
      `  #define subpassLoad_${name} ${d[0]}(0, 0, 0, 0)
` +
      `#endif
`;

    var g =
      `
` +
      `#pragma rate __in${name} pass
` +
      `#if CC_DEVICE_CAN_BENEFIT_FROM_INPUT_ATTACHMENT
` +
      `  #if __VERSION__ >= 450
` +
      `    layout(input_attachment_index = ${g}) uniform subpassInput __in${name};
` +
      `    #define subpassLoad_${name} subpassLoad(__in${name})
` +
      `  #elif __VERSION__ >= 300
` +
      `    layout(location = ${s}) inout ${m} ${d[0]} ${name};
` +
      `    #define subpassLoad_${name} ${name}
` +
      `  #else
` +
      `    #define subpassLoad_${name} gl_LastFragData[${r}]
` +
      `  #endif
` +
      `#else
` +
      `  #define subpassLoad_${name} ${m} ${d[0]}(0, 0, 0, 0)
` +
      `#endif
`;

    if (inout === "out") {
      o += b;
      n++;
      s++;
    }

    if (inout === "inout") {
      o += h;
      n++;
    }

    if (inout === "in" || inout === "inout") {
      if (type === "Color") {
        o += g;
        t++;
        r++;
        s++;
        l = true;
      } else {
        a === undefined && ((a = t), t++);
        o += y;
        c = true;
      }
    }
  }

  if (l) {
    o =
      "#pragma extension([GL_EXT_shader_framebuffer_fetch, __VERSION__ < 450, enable])\n" +
      o;
  }

  o = c
    ? "#pragma extension([GL_ARM_shader_framebuffer_fetch_depth_stencil, __VERSION__ < 450, enable])\n" +
      o
    : o;

  return o;
};

const expandSubpassInout = (e) => {
  var t = [];
  var r = { Color: 0, Depth: 1, Stencil: 2 };
  const s = { in: 0, inout: 1, out: 2 };
  var n = {
    Color: {
      inouts: ["in", "out", "inout"],
      types: ["i", "f", "u"],
      hint: "",
    },
    Depth: { inouts: ["in"], types: ["f"], hint: "subpassDepth" },
    Stencil: { inouts: ["in"], types: ["i"], hint: "isubpassStencil" },
  };
  e = e.replace(/subpassLoad\s*\(\s*(\w+)\s*\)/g, "subpassLoad_$1");
  let a = 0;
  var i =
    /#pragma\s+(i|u)?subpass(Color|Depth|Stencil)\s+(\w+)\s*(mediump|highp|lowp)?\s+(\w+)\s+/g;
  let o = i.exec(e);

  while (o !== null) {
    var l = o[1] || "f";
    var [, , c, p, d, f] = o;
    var u = a;
    var m = n[c];
    if (!m.inouts.includes(p)) {
      error(`unsupported inout type ${c}, ` + p);
      return e;
    }
    if (!m.types.includes(l)) {
      error(`unsupported subpass type for ${c}, only ${m.hint} supported`);
      return e;
    }
    t.push({
      type: c,
      inout: p,
      name: f,
      index: u,
      precision: d,
      signed: l,
      sortKeyInput: r[c],
      sortKeyInout: s[p],
    });
    m = o.index;
    f = o.index + o[0].length;
    e = e.substring(0, m) + e.substring(f);
    i.lastIndex = m;
    o = i.exec(e);
    ++a;
  }

  t.sort((e, t) =>
    e.sortKeyInout !== t.sortKeyInout
      ? e.sortKeyInout - t.sortKeyInout
      : e.sortKeyInput != t.sortKeyInput
      ? e.sortKeyInput - t.sortKeyInput
      : e.sortKeyInout === s.out
      ? e.index - t.index
      : e.name < t.name
      ? -1
      : e.name > t.name
      ? 1
      : 0
  );
  var g;
  var b = expandInputStatement(t);
  var h = /#pragma\s+subpass/g.exec(e);

  if (h) {
    g = h.index;
    h = h.index + h[0].length;
    e = e.substring(0, g) + b + e.substring(h);
  }

  return e;
};

const expandLiteralMacro = (s) => {
  var t = {};
  let r = effectDefineRE.exec(s);

  while (r !== null) {
    let [, , e] = r;

    if (e.endsWith("\\")) {
      e = e.slice(0, -1);
    }

    t[r[1]] = e.trim();
    var r_index = r.index;
    var a = r.index + r[0].length;
    s = s.substring(0, r_index) + s.substring(a);
    effectDefineRE.lastIndex = r_index;
    r = effectDefineRE.exec(s);
  }

  var i = Object.keys(t).map((e) => new RegExp(`\\b${e}\\b`, "g"));

  var o = Object.values(t);
  for (let r = 0; r < o.length; r++) {
    let t = o[r];
    for (let e = 0; e < r; e++) {
      t = t.replace(i[e], o[e]);
    }
    s = s.replace(i[r], t);
  }
  return s;
};

const extractMacroDefinitions = (e) => {
  var t = new Set();
  let r = plainDefineRE.exec(e);
  for (var s, n = new Map(); r !== null; ) {
    t.add(r[1]);

    if (
      r[2] &&
      r[2].toLowerCase !== "true" &&
      r[2].toLowerCase !== "false" &&
      ((s = parseInt(r[2])), isNaN(s))
    ) {
      n.set(r[1], r[2]);
    }

    r = plainDefineRE.exec(e);
  }
  return [t, n];
};

const eliminateDeadCode = (() => {
  const x = /[{}()]/g;
  const v = /(?:\w+p\s+)?\w+\s+(\w+)\s*$/;
  const E = /^\s*$/;
  let _ = "";
  let $ = 0;
  let k = 0;

  const S = (e, t) => {
    var r = [];
    let s = t.exec(e);

    while (s) {
      r.push(s);
      s = t.exec(e);
    }

    return r;
  };

  const F = new Set();

  const w = (e, t) => {
    if (!F.has(t)) {
      F.add(t);
      for (const r of e[t].deps) {
        w(e, r);
      }
    }
  };

  return (t, r, s) => {
    let e = 0;
    let n = 0;
    let a = 0;
    end = 0;
    x.lastIndex = 0;
    F.clear();
    var i = [];
    for (const h of S(t, x)) {
      var o;
      var l;
      var [c] = h;

      if (e === 0) {
        if (c === "(") {
          n = 1;
          o = t;
          l = h.index;
          o = o.substring(end, l).match(v) || ["", ""];
          name = o[1];
          beg = l - o[0].length;
        } else if (c === ")") {
          if (n === 1) {
            n = 2;
            a = h.index + 1;
          } else {
            n = 0;
          }
        } else if (c === "{") {
          n = n === 2 && E.test(t.substring(a, h.index)) ? 3 : 0;
        }
      }

      if (c === "{") {
        e++;
      }

      if (
        c === "}" &&
        0 == --e &&
        n === 3 &&
        ((end = h.index + 1), (n = 0), name)
      ) {
        i.push({ name: name, beg: beg, end: end, paramListEnd: a, deps: [] });
      }
    }
    let p = i.findIndex((e) => e.name === r);

    if (p < 0) {
      error(`EFX2403: entry function '${r}' not found.`);
      p = 0;
    }

    for (let e = 0; e < i.length; e++) {
      var d = i[e];
      for (const y of S(t, new RegExp("\\b" + d.name + "\\b", "g"))) {
        var f = i.findIndex((e) => y.index > e.beg && y.index < e.end);

        if (f >= 0 && f !== e) {
          i[f].deps.push(e);
        }
      }
    }
    w(i, p);
    let u = "";
    let m = 0;
    let g = 0;
    for (let e = 0; e < i.length; e++) {
      var b = i[e];
      const { name, beg, end } = b;

      if (F.has(e) || name === "main") {
        b.beg -= g;
        b.end -= g;
        b.paramListEnd -= g;
        s.push(b);
      } else {
        u += t.substring(m, beg);
        m = end;
        g += end - beg;
      }
    }
    return u + t.substring(m);
  };
})();

const parseCustomLabels = (e, t = {}) => {
  let r = e.join(" ");
  let s = labelRE.exec(r);

  while (s) {
    try {
      t[s[1]] = yaml.load(s[2] || "true");
    } catch (e) {
      warn(
        `EFX2102: parameter for label '${s[1]}' is not legal YAML: ` + e.message
      );
    }
    r = r.substring(s.index + s[0].length);
    s = labelRE.exec(r);
  }

  return t;
};

const getDefs = (t, e) => {
  let r = e.lines.findIndex((e) => t < e);

  if (r < 0) {
    r = e.lines.length;
  }

  return e[e.lines[r - 1]] || [];
};

const pushDefines = (e, t, r) => {
  if (!t.has(r.name)) {
    e.push(r);
  }
};

const extractDefines = (r, o, l) => {
  const c = [];

  const p = (e) => {
    l[e] = c.reduce((e, t) => e.concat(t), []);

    l.lines.push(e);
  };

  let d = 0;
  for (let e = 0; e < r.length; e++) {
    let t = r[e];
    let t_data = t.data;
    let a;
    let i;
    if (t.type === "preprocessor" && !t_data.startsWith("#extension")) {
      if ((t_data = t_data.split(/\s+/))[0] === "#endif") {
        while (d > 0) {
          c.pop();
          d--;
        }

        c.pop();
      } else {
        if (t_data[0] === "#else" || t_data[0] === "#elif") {
          const m = c[c.length - 1];

          if (m) {
            m.forEach((e, t) => (m[t] = e[0] === "!" ? e.slice(1) : "!" + e));
          }

          p(t.line);

          if (t_data[0] === "#else") {
            continue;
          }

          d++;
        } else {
          if (t_data[0] === "#pragma") {
            if (t_data.length <= 1) {
              continue;
            }
            if (t_data[1] === "define-meta") {
              if (t_data.length <= 2) {
                warn("EFX2101: define pragma: missing info", t.line);
                continue;
              }
              ident.lastIndex = 0;

              if (!ident.test(t_data[2])) {
                continue;
              }

              var f = c.reduce((e, t) => e.concat(t), []);
              let e = o.find((e) => e.name === t_data[2]);

              if (!e) {
                pushDefines(
                  o,
                  l.existingDefines,
                  (e = {
                    name: t_data[2],
                    type: "boolean",
                    defines: f,
                    dummyDependency: true,
                  })
                );
              }

              var u = parseCustomLabels(t_data.splice(3));
              for (const g in u) {
                if (g === "range") {
                  e.type = "number";
                  e.range = [0, 3];
                  e.fixedType = true;

                  if (Array.isArray(u.range)) {
                    e.range = u.range;
                  } else {
                    warn(
                      `EFX2103: invalid range for macro '${e.name}'`,
                      t.line
                    );
                  }
                } else if (g === "options") {
                  e.type = "string";
                  e.options = [];
                  e.fixedType = true;

                  if (Array.isArray(u.options)) {
                    e.options = u.options;
                  } else {
                    warn(
                      `EFX2104: invalid options for macro '${e.name}'`,
                      t.line
                    );
                  }
                } else if (g === "default") {
                  switch (u.default) {
                    case true: {
                      e.default = 1;
                      break;
                    }
                    case false: {
                      e.default = 0;
                      break;
                    }
                    default: {
                      e.type = "constant";
                      e.default = u.default;
                      e.fixedType = true;
                    }
                  }
                } else {
                  if (g !== "editor") {
                    warn(
                      `EFX2105: define pragma: illegal label '${g}'`,
                      t.line
                    );
                  } else {
                    e.editor = u.editor;
                  }
                }
              }
            } else {
              if (t_data[1] === "warning") {
                warn("EFX2107: " + t_data.slice(2).join(" "));
              } else if (t_data[1] === "error") {
                error("EFX2108: " + t_data.slice(2).join(" "));
              } else if ((f = parseCustomLabels(t_data.slice(1))).extension) {
                l.extensions[f.extension[0]] = {
                  defines: getDefs(t.line, l),
                  cond: f.extension[1],
                  level: f.extension[2],
                  runtimeCond: f.extension[3],
                };
              } else {
                l[t.line] = f;
              }
            }
            continue;
          }
          if (!/#(el)?if$/.test(t_data[0])) {
            continue;
          }
        }
        let r = [];
        let s = false;

        t_data.splice(1).some((e) => {
          ident.lastIndex = 0;

          if ((a = ident.exec(e))) {
            if (
              a[0] === "defined" ||
              a[0].startsWith("__") ||
              a[0].startsWith("GL_") ||
              a[0] === "VULKAN"
            ) {
              return false;
            }
            var t = c.reduce((e, t) => e.concat(t), r.slice());
            if ((i = o.find((e) => e.name === a[0]))) {
              let e = t.length < i.defines.length;

              if (i.dummyDependency) {
                e = true;
                delete i.dummyDependency;
              }

              if (e) {
                i.defines = t;
              }
            } else {
              pushDefines(
                o,
                l.existingDefines,
                (i = { name: a[0], type: "boolean", defines: t })
              );
            }
            r.push((e[0] === "!" ? "!" : "") + a[0]);
          } else if (i && /^[<=>]+$/.test(e) && !i.fixedType) {
            i.type = "number";
            i.range = [0, 3];
          } else if (e === "||") {
            return !(s = true);
          }

          return false;
        });

        if (s) {
          r = [];
        }

        c.push(r);
      }
      p(t.line);
    }
  }
  o.forEach((e) => {
    delete e.fixedType;
    return delete e.dummyDependency;
  });
};

const extractUpdateRates = (s, n = []) => {
  for (let r = 0; r < s.length; r++) {
    let e = s[r];
    let e_data = e.data;

    if (e.type === "preprocessor" && !e_data.startsWith("#extension")) {
      if (
        (e_data = e_data.split(/\s+/))[0] === "#pragma" &&
        e_data.length === 4 &&
        e_data[1] === "rate"
      ) {
        n.push({ name: e_data[2], rate: e_data[3] });
      }
    }
  }
  return n;
};

const extractUnfilterableFloat = (r, s = []) => {
  for (let t = 0; t < r.length; t++) {
    var n = r[t];
    let n_data = n.data;

    if (n.type === "preprocessor" && !n_data.startsWith("#extension")) {
      if (
        (n_data = n_data.split(/\s+/))[0] === "#pragma" &&
        n_data.length === 3 &&
        n_data[1] === "unfilterable-float"
      ) {
        s.push({ name: n_data[2], sampleType: 1 });
      }
    }
  }
  return s;
};

const extractParams = (() => {
  const precision = /(low|medium|high)p/;

  const extractInfo = (tokens, i) => {
    const param = {};
    const definedPrecision = precision.exec(tokens[i].data);
    let offset = definedPrecision ? 2 : 0;
    param.name = tokens[i + offset + 2].data;
    param.typename = tokens[i + offset].data;
    param.type = convertType(tokens[i + offset].data);
    param.count = 1;

    if (definedPrecision) {
      param.precision = definedPrecision[0] + " ";
    }

    if (tokens[(offset = nextWord(tokens, i + offset + 2))].data === "[") {
      let expr = "";
      let end = offset;

      while (tokens[++end].data !== "]") {
        expr += tokens[end].data;
      }

      try {
        if (/^[\d+\-*/%\s]+$/.test(expr)) {
          param.count = eval(expr);
        } else {
          if (!builtinRE.test(param.name)) {
            throw expr;
          }
          param.count = expr;
        }
        param.isArray = true;
      } catch (e) {
        error(
          `EFX2202: ${param.name}: non-builtin array length must be compile-time constant: ` +
            e,
          tokens[offset].line
        );
      }
    }

    return param;
  };

  const stripDuplicates = (e) => {
    const t = {};
    return e.filter((e) => !t[e] && (t[e] = true));
  };

  const exMap = { whitespace: true };

  const nextWord = (e, t) => {
    while ((++t, exMap[e[t].type])) {}

    return t;
  };

  const nextSemicolon = (e, t, r = (e) => {}) => {
    while (e[t].data !== ";") {
      r(e[t++]);
    }

    return t;
  };

  const isFunctionParameter = (e, t) =>
    e.some((e) => t > e.beg && t < e.paramListEnd);

  const nonBlockUniforms = /texture|sampler|image|subpassInput/;
  return (o, l, c, p, d) => {
    var f;
    var u = [];
    var m = p === "vert";
    for (let i = 0; i < o.length; i++) {
      let e = o[i];
      let e_data = e.data;
      let r;
      let s;
      if (e_data === "uniform") {
        r = c.blocks;
        s = "blocks";
      } else if (e_data !== "in" || isFunctionParameter(d, e.position)) {
        if (e_data !== "out" || isFunctionParameter(d, e.position)) {
          if (e_data !== "buffer") {
            continue;
          }
          r = c.buffers;
          s = "buffers";
        } else {
          r = m ? c.varyings : c.fragColors;
          s = m ? "varyings" : "fragColors";
        }
      } else {
        if (p === "compute") {
          i = nextWord(o, i + 2);
          continue;
        }
        r = m ? c.attributes : c.varyings;
        s = m ? "attributes" : "varyings";
      }
      const h = getDefs(e.line, l);
      const y = {};
      y.tags = l[e.line - 1];
      let n = nextWord(o, i + 2);
      if (o[n].data !== "{") {
        Object.assign(y, extractInfo(o, i + 2));

        if (r === c.blocks) {
          g = o[i + (y.precision ? 4 : 2)].data;

          (b = nonBlockUniforms.exec(g))
            ? g === "sampler"
              ? ((r = c.samplers), (s = "samplers"))
              : b[0] === "sampler"
              ? ((r = c.samplerTextures), (s = "samplerTextures"))
              : b[0] === "texture"
              ? ((r = c.textures), (s = "textures"))
              : b[0] === "image"
              ? ((r = c.images), (s = "images"))
              : b[0] === "subpassInput" &&
                ((r = c.subpassInputs), (s = "subpassInputs"))
            : error(
                "EFX2201: vector uniforms must be declared in blocks.",
                e.line
              );
        }

        n = nextSemicolon(o, n);
      } else {
        y.name = o[i + 2].data;

        for (y.members = []; o[(n = nextWord(o, n))].data !== "}"; ) {
          if (r !== c.buffers) {
            f = extractInfo(o, n);

            mappings.isSampler(f.type) &&
              error(
                "EFX2208: texture uniforms must be declared outside blocks.",
                o[n].line
              );

            y.members.push(f);
          }

          n = nextSemicolon(o, n);
        }

        y.members.reduce((e, t) => {
          let r = mappings.GetTypeSize(t.type);
          switch (t.typename) {
            case "mat2": {
              r /= 2;
              break;
            }
            case "mat3": {
              r /= 3;
              break;
            }
            case "mat4": {
              r /= 4;
            }
          }

          if (t.count > 1 && r < 16) {
            s = `uniform ${convertType(t.type)} ${t.name}[${t.count}]`;

            error(
              "EFX2203: " +
                s +
                ": array UBO members need to be 16-bytes-aligned to avoid implicit padding"
            );

            r = 16;
          } else if (r === 12) {
            s = `uniform ${convertType(t.type)} ` + t.name;

            error(
              "EFX2204: " +
                s +
                ": please use 1, 2 or 4-component vectors to avoid implicit padding"
            );

            r = 16;
          } else if (mappings.isPaddedMatrix(t.type)) {
            s = `uniform ${convertType(t.type)} ` + t.name;

            error(
              "EFX2210: " +
                s +
                ": use only 4x4 matrices to avoid implicit padding"
            );
          }

          var s = Math.ceil(e / r) * r;
          var e = s - e;

          if (e) {
            error(
              `EFX2205: UBO '${y.name}' introduces implicit padding: ` +
                `${e} bytes before '${t.name}', consider re-ordering the members`
            );
          }

          return s + r * t.count;
        }, 0);
        var g = l.lines.find((e) => e >= o[i].line && e < o[n].line);

        if (g) {
          error(
            `EFX2206: ${y.name}: no preprocessors allowed inside uniform blocks!`,
            g
          );
        }

        y.members.forEach((e) => {
          if (typeof e.type == "string") {
            error(
              `EFX2211: '${e.type} ${e.name}' in block '${y.name}': ` +
                "struct-typed member within UBOs is not supported due to compatibility reasons.",
              o[n].line
            );
          }
        });

        n = nextWord(o, n);

        if (o[n].data !== ";") {
          error(
            "EFX2209: Block declarations must be semicolon-terminated，non-array-typed and instance-name-free. " +
              `Please check your '${y.name}' block declaration.`,
            o[n].line
          );
        }
      }
      var b = r.find((e) => e.name === y.name);

      if (b) {
        y.members &&
          JSON.stringify(b.members) !== JSON.stringify(y.members) &&
          error(
            `EFX2207: different UBO using the same name '${y.name}'`,
            e.line
          );

        b.stageFlags |= mapShaderStage(p);
        y.duplicate = b;
      }

      let a = i;

      if (r === c.buffers || r === c.images) {
        y.memoryAccess = mappings.getMemoryAccessFlag(o[i - 2].data);
        /writeonly|readonly/.test(o[i - 2].data) && (a = i - 2);
      }

      u.push({
        beg: o[a].position,
        end: o[n].position,
        param: y.duplicate || y,
        type: s,
      });

      if (!y.duplicate) {
        y.defines = stripDuplicates(h);
        y.stageFlags = mapShaderStage(p);
        r.push(y);
      }

      i = n;
    }
    return u;
  };
})();

const miscChecks = (() => {
  const r = new RegExp(
    "\\b(?:asm|class|union|enum|typedef|template|this|packed|goto|switch|default|inline|noinline|volatile|public|static|extern|external|interface|flat|long|short|double|half|fixed|unsigned|superp|input|output|hvec2|hvec3|hvec4|dvec2|dvec3|dvec4|fvec2|fvec3|fvec4|sampler1D|sampler3D|sampler1DShadow|sampler2DShadow|sampler2DRect|sampler3DRect|sampler2DRectShadow|sizeof|cast|namespace|using|texture)\\b"
  );

  const s = /precision\s+(low|medium|high)p\s+(\w+)/;
  return (e) => {
    var t = s.exec(e);

    var t =
      (t
        ? /#extension/.test(e.slice(t.index)) &&
          warn("EFX2400: precision declaration should come after extensions")
        : warn("EFX2401: precision declaration not found."),
      r.exec(e));

    if (t) {
      error("EFX2402: using reserved keyword in glsl1: " + t[0]);
    }

    if (!options.skipParserTest) {
      t = tokenizer(e).filter((e) => e.type !== "preprocessor");
      shaderTokens = t;
      try {
        parser(t);
      } catch (e) {
        error("EFX2404: glsl1 parser failed: " + e, 0);
      }
    }
  };
})();

const finalTypeCheck = (() => {
  let a = null;
  let i = true;
  const o = (t, r) => {
    let s = a.createShader(r);
    a.shaderSource(s, t);
    a.compileShader(s);

    if (!a.getShaderParameter(s, a.COMPILE_STATUS)) {
      let e = 1;

      r = t.replace(
        /^|\n/g,
        () => `
${e++} `
      );

      t = a.getShaderInfoLog(s);
      a.deleteShader(s);
      s = null;

      error(
        `EFX2406: compilation failed: ↓↓↓↓↓ EXPAND THIS MESSAGE FOR MORE INFO ↓↓↓↓↓
${t}
` + r
      );
    }

    return s;
  };
  return (e, t, r, s, n) => {
    if (!a && typeof document != "undefined") {
      if (
        (a = document
          .createElement("canvas")
          .getContext("webgl", { depth: true, stencil: true }))
      ) {
        a.getSupportedExtensions().forEach((e) => a.getExtension(e));
        i = i && a.getParameter(a.MAX_VERTEX_TEXTURE_IMAGE_UNITS) >= 8;
      }
    }

    if (i && a) {
      r =
        "#version 100\n" +
        r.reduce((e, t) => {
          let r = 1;
          switch (t.type) {
            case "string": {
              r = t.options[0];
              break;
            }
            case "number": {
              r = t.range[0];
              break;
            }
            case "constant": {
              r = t.default;
              break;
            }
            case "boolean": {
              r = t.default === undefined ? 1 : t.default;
            }
          }
          return `${e}#define ${t.name} ${r}\n`;
        }, "");

      shaderName = s;
      s = o(r + e, a.VERTEX_SHADER);
      shaderName = n;
      e = o(r + t, a.FRAGMENT_SHADER);
      shaderName = "linking";

      n = ((e) => {
        let t = a.createProgram();

        e.forEach((e) => a.attachShader(t, e));

        a.linkProgram(t);

        if (!a.getProgramParameter(t, a.LINK_STATUS)) {
          e = a.getProgramInfoLog(t);
          a.deleteProgram(t);
          t = null;
          error("EFX2407: link failed: " + e);
        }

        return t;
      })([s, e]);

      a.deleteProgram(n);
      a.deleteShader(e);
      a.deleteShader(s);
    }
  };
})();

const stripToSpecificVersion = (() => {
  const globalSearch = /#(if|elif|else|endif)(.*)?/g;
  const legalExpr = /^[\d<=>!|&^\s]*(__VERSION__)?[\d<=>!|&^\s]*$/;

  const macroWrap = (e, t, r) =>
    t
      ? `#if ${t}
${e}#endif
`
      : e;

  const declareExtension = (e, t) =>
    t === "require"
      ? `#extension ${e}: require
`
      : `
#ifdef ${e}
#extension ${e}: enable
#endif
`;

  return (code, version, extensions, isVert) => {
    if (version < 310) {
      code = code.replace(
        /layout\s*\((.*?)\)(\s*)(\w+)\s+(\w+)/g,
        (e, t, r, s, n) =>
          (!isVert && s === "out") ||
          (s !== "out" && s !== "in" && s !== "uniform") ||
          (s === "uniform" && n.includes("image"))
            ? e
            : (t.includes("std140") ? "layout(std140)" + r + s : s) + " " + n
      );
    }

    const instances = [];
    let cap = null;
    let temp = null;

    while (true) {
      cap = globalSearch.exec(code);

      if (!cap) {
        break;
      }

      if (cap[1] === "if") {
        if (temp) {
          temp.level++;
        } else if (legalExpr.test(cap[2])) {
          temp = {
            start: cap.index,
            end: cap.index,
            conds: [cap[2]],
            content: [cap.index + cap[0].length],
            level: 1,
          };
        }
      } else if (cap[1] === "elif") {
        if (temp && temp.level <= 1) {
          legalExpr.test(cap[2]) ||
            (error(
              `EFX2301: #elif conditions after a constant #if should be constant too; get '${cap[2]}'`
            ),
            (cap[2] = ""));

          temp.conds.push(cap[2]);
          temp.content.push(cap.index, cap.index + cap[0].length);
        }
      } else if (cap[1] === "else") {
        if (temp && temp.level <= 1) {
          temp.conds.push("true");
          temp.content.push(cap.index, cap.index + cap[0].length);
        }
      } else if (cap[1] === "endif" && temp && !--temp.level) {
        temp.content.push(cap.index);
        temp.end = cap.index + cap[0].length;
        instances.push(temp);
        temp = null;
      }
    }

    let res = code;
    if (instances.length) {
      res = res.substring(0, instances[0].start);
      for (let j = 0; j < instances.length; j++) {
        const ins = instances[j];
        for (let i = 0; i < ins.conds.length; i++) {
          if (eval(ins.conds[i].replace("__VERSION__", version))) {
            const subBlock = code.substring(
              ins.content[2 * i],
              ins.content[2 * i + 1]
            );
            res += stripToSpecificVersion(subBlock, version, isVert);
            break;
          }
        }
        const next =
          (instances[j + 1] && instances[j + 1].start) || code.length;
        res += code.substring(ins.end, next);
      }
    }
    for (const ext in extensions) {
      const { defines, cond, level, runtimeCond } = extensions[ext];

      if (eval(cond.replace("__VERSION__", version))) {
        res =
          macroWrap(declareExtension(ext, level), runtimeCond, defines) + res;
      }
    }
    return res;
  };
})();

const glsl300to100 = (a, e, p, t, d, r, s) => {
  let f = "";
  let i = 0;

  t.forEach((t) => {
    if (t.type === "blocks") {
      const n = (f += a.slice(i, t.beg)).length - f.search(/\s*$/) + 1;

      e.find((e) => e.name === t.param.name).members.forEach((e) => {
        var t;
        var r;
        var s = a.match(new RegExp(`\\b${e.name}\\b`, "g"));

        if (s && s.length > 1) {
          s = convertType(e.type);
          t = e.precision || "";

          r = typeof e.count == "string" || e.isArray ? `[${e.count}]` : "";

          f +=
            " ".repeat(n) +
            `uniform ${t}${s} ${e.name}${r};
`;
        }
      });

      i = t.end + (a[t.end] === ";");
    }
  });

  f = (f += a.slice(i)).replace(
    /\btexture((?!2D|Cube)\w*)\s*\(\s*(\w+)\s*([,[])/g,
    (e, t, r, s, n) => {
      const a = "texture" + t;
      if (d.find((e) => e.name === a)) {
        return e;
      }
      let i = new RegExp("sampler(\\w+)\\s+" + r);
      var o = d.find((e) => n > e.beg && n < e.end);
      let l = (o && i.exec(f.substring(o.beg, o.eng))) || i.exec(f);
      if (!l) {
        o = p.find((e) => e.name === r);
        if (o && o.options) {
          for (const c of o.options) {
            i = new RegExp("sampler(\\w+)\\s+" + c);

            if ((l = i.exec(f))) {
              break;
            }
          }
        }
        if (!l) {
          error(`EFX2300: sampler '${r}' does not exist`);
          return e;
        }
      }
      return `texture${textureFuncRemap.get(l[1]) ?? l[1]}${t}(` + r + s;
    }
  );

  if (s) {
    f = (f = f.replace(inDecl, (e, t, r) => `attribute ${r};`)).replace(
      outDecl,
      (e, t, r) => `varying ${r};`
    );
  } else {
    f = f.replace(inDecl, (e, t, r) => `varying ${r};`);
    const o = [];

    f = f.replace(outDecl, (e, t, r, s) => {
      t = t && locationRE.exec(t);

      if (!t) {
        error("EFX2302: fragment output location must be specified");
      }

      o.push({ name: s, location: t[1] });
      return "";
    });

    if (o.length === 1) {
      t = new RegExp(`\\b${o[0].name}\\b`, "g");
      f = f.replace(t, "gl_FragColor");
    } else if (o.length > 1) {
      for (const l of o) {
        var n = new RegExp(`\\b${l.name}\\b`, "g");
        f = f.replace(n, `gl_FragData[${l.location}]`);
      }

      if (!r.extensions.GL_EXT_draw_buffers) {
        r.extensions.GL_EXT_draw_buffers = {
          defines: [],
          cond: "__VERSION__ <= 100",
          level: "enable",
        };
      }
    }
  }

  return (f = f.replace(/layout\s*\(.*?\)\s*/g, () => "")).replace(
    pragmasToStrip,
    ""
  );
};

const decorateBlockMemoryLayouts = (n, e) => {
  let a = 0;
  const i = [];
  e.forEach((e, t) => {
    var r;
    var s;

    if (e.type === "blocks" || e.type === "buffers") {
      r = e.type === "buffers";
      s = n.slice(a, e.beg);
      s = layoutExtract.exec(s);
      i[t] = s ? a + s.index + (r ? 0 : s[0].length - s[2].length - 1) : -1;
      a = e.end;
    }
  });
  let s = "";
  a = 0;

  e.forEach((t, r) => {
    r = i[r];
    if (r !== undefined) {
      if (t.type === "blocks") {
        s =
          r < 0
            ? s + n.slice(a, t.beg) + "layout(std140) "
            : (s = s + n.slice(a, r) + ", std140") + n.slice(r, t.beg);
      } else if (t.type === "buffers") {
        let e = "std430";

        if (t.param.tags && t.param.tags.glBinding !== undefined) {
          e += ", binding = " + t.param.tags.glBinding;
        }

        s = (s += n.slice(a, r < 0 ? t.beg : r)) + `layout(${e}) `;
      }
      s += n.slice(t.beg, t.end);
      a = t.end;
    }
  });

  s += n.slice(a);
  return s;
};

const decorateBindings = (c, p, e) => {
  e = e.filter((e) => !builtinRE.test(e.param.name));
  let d = 0;
  const f = [];
  const u = {};

  e.forEach((t, e) => {
    if (t.type !== "fragColors") {
      var r = t.param.name;
      if (p[t.type]) {
        var s = c.slice(d, t.beg);
        var n = { prop: t.param };
        var s = layoutExtract.exec(s);
        var a = u[t.type] || (u[t.type] = {});
        if (s) {
          n.position = d + s.index + s[0].length - s[2].length - 1;
          var i = bindingExtract.exec(s[1]);
          if (i) {
            if (s[1].search(/\bset\s*=/) < 0) {
              n.position = s[1].length - n.position;
            } else {
              n.position = -1;
            }

            const o = parseInt(i[1]);

            const l =
              t.type === "varyings" || t.type === "attributes"
                ? "location"
                : "binding";

            let e = p[t.type].find((e) => e[l] === o);

            if ((e = e || t.type !== "subpassInputs" ? e : true)) {
              a[o] &&
                a[o] !== r &&
                error(
                  `EFX2600: duplicated binding/location declaration for '${a[o]}' and '${r}'`
                );

              a[(a[o] = r)] = o;
            } else if (t.type === "blocks") {
              error(
                `EFX2601: illegal custom binding for '${r}', block bindings should be consecutive and start from 0`
              );
            } else if (t.type === "samplerTextures") {
              error(
                `EFX2602: illegal custom binding for '${r}', texture bindings should be consecutive and after all the blocks`
              );
            } else if (t.type === "buffers") {
              error(
                `EFX2603: illegal custom binding for '${r}', buffer bindings should be consecutive and after all the ` +
                  "blocks/samplerTextures"
              );
            } else if (t.type === "images") {
              error(
                `EFX2604: illegal custom binding for '${r}', image bindings should be consecutive and after all the ` +
                  "blocks/samplerTextures/buffers"
              );
            } else if (t.type === "textures") {
              error(
                `EFX2605: illegal custom binding for '${r}', texture bindings should be consecutive and after all the ` +
                  "blocks/samplerTextures/buffers/images"
              );
            } else if (t.type === "samplers") {
              error(
                `EFX2606: illegal custom binding for '${r}', sampler bindings should be consecutive and after all the ` +
                  "blocks/samplerTextures/buffers/images/textures"
              );
            } else {
              error(
                `EFX2607: illegal custom location for '${r}', locations should be consecutive and start from 0`
              );
            }
          }
        }
        f[e] = n;
        d = t.end;
      }
    }
  });

  e.forEach((e, t) => {
    if (u[e.type]) {
      var r;

      const s =
        e.type === "attributes" ||
        e.type === "varyings" ||
        e.type === "fragColors"
          ? "location"
          : "binding";

      const n = u[e.type];
      const a = e.param.name;
      if (e.type === "attributes") {
        if (a in n) {
          f[t].prop[s] = n[a];
        } else {
          let e = 0;

          while (n[e]) {
            e++;
          }

          f[t].prop[s] = e;
          n[e] = a;
        }
      } else {
        if (a in n) {
          r = f[t].prop[s];
          (e = p[e.type].find((e) => e[s] === n[a])) && (e[s] = r);
          f[t].prop[s] = n[a];
        }
      }
    }
  });

  let a = "";
  d = 0;
  const i = mappings.SetIndex.MATERIAL;

  e.forEach((e, t) => {
    var r;
    var s;
    var n;

    if (f[t]) {
      r = (n =
        e.type === "attributes" ||
        e.type === "varyings" ||
        e.type === "fragColors")
        ? "location"
        : "binding";

      ({ position: t, prop: s } = f[t]);
      n = n ? "" : `set = ${i}, `;

      t === undefined
        ? (a = (a += c.slice(d, e.beg)) + `layout(${n + r} = ${s[r]}) `)
        : t >= 0
        ? (a =
            (a = (a += c.slice(d, t)) + (`, ${n + r} = ` + s[r])) +
            c.slice(t, e.beg))
        : t < -1
        ? (a = (a = a + c.slice(d, -t) + n) + c.slice(-t, e.beg))
        : (a += c.slice(d, e.beg));

      a += c.slice(e.beg, e.end);
      d = e.end;
    }
  });

  a += c.slice(d);

  p.samplerTextures = p.samplerTextures.filter(
    (t) => p.subpassInputs.findIndex((e) => e.binding === t.binding) < 0
  );

  return a;
};

const remapDefine = (r, s) => {
  for (let t = 0; t < r.defines.length; ++t) {
    let e = s.get(r.defines[t]);

    while (e) {
      r.defines[t] = e;
      e = s.get(e);
    }
  }
};

const shaderFactory = (() => {
  const r = /\s+$/gm;
  const s = /(^\s*\n){2,}/gm;

  const k = (e) => {
    let t = e.replace(pragmasToStrip, "");
    return (t = (t = t.replace(s, "\n")).replace(r, ""));
  };

  const S = (s, n) => (e) => {
    if (!builtinRE.test(e.name)) {
      return true;
    }
    var e_tags = e.tags;
    let r;
    r = e_tags && e_tags.builtin ? e_tags.builtin : "global";
    n[r + "s"][s].push({ name: e.name, defines: e.defines });
    return false;
  };

  const F = (t, e, r) => {
    var s = e[r];
    for (let e = 0; e !== s.length; ++e) {
      var n;
      var a = s[e];

      if (a.rate !== undefined) {
        t[a.rate][r].push(a);
      } else if (builtinRE.test(a.name)) {
        n = a.tags;

        !a.tags || !a.tags.builtin || n.builtin === "global"
          ? t[3][r].push(a)
          : n.builtin === "local" && t[0][r].push(a);
      } else {
        t[1][r].push(a);
      }
    }
  };

  const u = (e, t, r) =>
    t === "main"
      ? e
      : e +
        ((e, t) => {
          switch (e) {
            case "vert": {
              return `
void main() { gl_Position = ${t}(); }
`;
            }
            case "frag": {
              return `
layout(location = 0) out vec4 cc_FragColor;
void main() { cc_FragColor = ${t}(); }
`;
            }
            default: {
              return `
void main() { ${t}(); }
`;
            }
          }
        })(r, t);

  const m = /([^:]+)(?::(\w+))?/;
  const n = { instance: 0, batch: 1, phase: 2, pass: 3 };

  const g = (e, r) => {
    e.forEach((t) => {
      var e = r.find((e) => e.name === t.name);

      if (e) {
        t.rate = n[e.rate];
      }
    });
  };

  const b = (e, r) => {
    e.forEach((t) => {
      var e = r.find((e) => e.name === t.name);
      t.sampleType = e ? e.sampleType : 0;
    });
  };

  const h = { version: "300 es" };

  const w = () => ({
    blocks: [],
    samplerTextures: [],
    samplers: [],
    textures: [],
    buffers: [],
    images: [],
    subpassInputs: [],
    attributes: [],
    varyings: [],
    fragColors: [],
    descriptors: [],
  });

  const I = (
    e,
    t,
    r = [],
    s = w(),
    n = globalChunks,
    a = globalDeprecations
  ) => {
    var i = {};
    shaderName = e;
    var o = { lines: [], extensions: {} };

    var {
      code: n,
      record: a,
      functions,
    } = ((e = e),
    (n = n),
    (a = a),
    (l = t),
    (c = "main"),
    (e = m.exec(e)),
    (c = e[2] || c),
    (d = new Set()),
    (f = []),
    (e = unwindIncludes(`#include <${e[1]}>`, n, a, d)),
    (e = u(e, c, l)),
    (e = expandSubpassInout(e)),
    (e = expandLiteralMacro(e)),
    (e = expandFunctionalMacro(e)),
    { code: eliminateDeadCode(e, c, f), record: d, functions: f });

    var e = (shaderTokens = tokenizer(n, h));
    var c = extractMacroDefinitions(n);
    o.existingDefines = c[0];
    const [, p] = c;
    extractDefines(e, r, o);
    var d = extractUpdateRates(e);
    var f = extractUnfilterableFloat(e);
    var c = extractParams(e, o, s, t, functions);

    var e =
      ((s.samplerTextures = s.samplerTextures.filter(
        (t) => !s.subpassInputs.find((e) => e.name === t.name)
      )),
      (i.blockInfo = c),
      (i.record = a),
      (i.extensions = o.extensions),
      (i.glsl4 = n),
      s.attributes.forEach((e) => {
        remapDefine(e, p);
      }),
      s.blocks.forEach((e) => {
        remapDefine(e, p);
      }),
      s.buffers.forEach((e) => {
        remapDefine(e, p);
      }),
      s.images.forEach((e) => {
        remapDefine(e, p);
      }),
      s.samplerTextures.forEach((e) => {
        remapDefine(e, p);
      }),
      s.samplers.forEach((e) => {
        remapDefine(e, p);
      }),
      s.textures.forEach((e) => {
        remapDefine(e, p);
      }),
      g(s.blocks, d),
      g(s.buffers, d),
      g(s.images, d),
      g(s.samplerTextures, d),
      g(s.samplers, d),
      g(s.textures, d),
      g(s.subpassInputs, d),
      b(s.samplerTextures, f),
      b(s.textures, f),
      t == "vert");

    i.glsl3 = stripToSpecificVersion(
      decorateBlockMemoryLayouts(n, c),
      300,
      o.extensions,
      e
    );

    if (t == "vert" || t == "frag") {
      i.glsl1 = stripToSpecificVersion(
        glsl300to100(n, s.blocks, r, c, functions, o, e),
        100,
        o.extensions,
        e
      );

      miscChecks(i.glsl1);
    } else {
      i.glsl1 = "";
    }

    return i;
  };

  const T = () => ({
    blocks: [],
    samplerTextures: [],
    buffers: [],
    images: [],
  });

  return {
    compile: I,
    build: (e, t, r = globalChunks, s = globalDeprecations) => {
      let n = [];
      var a = w();
      var i = { vert: "", frag: "" };
      for (const _ in e) {
        i[_] = I(e[_], _, n, a, r, s);
      }

      if (t === "graphics") {
        finalTypeCheck(i.vert.glsl1, i.frag.glsl1, n, e.vert, e.frag);
      }

      var o;
      var l;
      var c = { globals: T(), locals: T(), statistics: {} };
      n = n.filter((e) => e.type !== "constant");
      let p = 0;
      let d = 0;
      let f = 0;

      a.blocks.forEach((e) => {
        var t = e.members.reduce(
          (e, t) =>
            typeof t.count != "number"
              ? e
              : e + Math.ceil(mappings.GetTypeSize(t.type) / 16) * t.count,
          0
        );

        if (e.stageFlags & VSBit) {
          p += t;
        }

        if (e.stageFlags & FSBit) {
          d += t;
        }

        if (e.stageFlags & CSBit) {
          f += t;
        }
      }, 0);

      if (t === "graphics") {
        c.statistics.CC_EFFECT_USED_VERTEX_UNIFORM_VECTORS = p;
        c.statistics.CC_EFFECT_USED_FRAGMENT_UNIFORM_VECTORS = d;
      }

      if (t === "compute") {
        c.statistics.CC_EFFECT_USED_COMPUTE_UNIFORM_VECTORS = f;
      }

      a.descriptors[0] = {
        rate: 0,
        blocks: [],
        samplerTextures: [],
        samplers: [],
        textures: [],
        buffers: [],
        images: [],
        subpassInputs: [],
      };

      a.descriptors[1] = {
        rate: 1,
        blocks: [],
        samplerTextures: [],
        samplers: [],
        textures: [],
        buffers: [],
        images: [],
        subpassInputs: [],
      };

      a.descriptors[2] = {
        rate: 2,
        blocks: [],
        samplerTextures: [],
        samplers: [],
        textures: [],
        buffers: [],
        images: [],
        subpassInputs: [],
      };

      a.descriptors[3] = {
        rate: 3,
        blocks: [],
        samplerTextures: [],
        samplers: [],
        textures: [],
        buffers: [],
        images: [],
        subpassInputs: [],
      };

      o = a.descriptors;
      l = a;
      F(o, l, "blocks");
      F(o, l, "samplerTextures");
      F(o, l, "samplers");
      F(o, l, "textures");
      F(o, l, "buffers");
      F(o, l, "images");
      F(o, l, "subpassInputs");
      for (let e = 0; e !== 4; ++e) {
        a.descriptors[e].blocks.forEach((e) => {
          for (const t of e.members) {
            if (typeof t.count != "number") {
              t.count = 0;
            }
          }
        });
      }
      a.blocks = a.blocks.filter(S("blocks", c));

      a.samplerTextures = a.samplerTextures.filter(S("samplerTextures", c));

      a.buffers = a.buffers.filter(S("buffers", c));
      a.images = a.images.filter(S("images", c));

      a.attributes.forEach((e) => {
        var t;
        e.format = mappings.formatMap[e.typename];

        if (e.defines.includes("USE_INSTANCING")) {
          e.isInstanced = true;
        }

        if (
          e.tags &&
          e.tags.format &&
          (undefined !== (t = mappings.getFormat(e.tags.format)) &&
            (e.format = t),
          mappings.isNormalized(t))
        ) {
          e.isNormalized = true;
        }
      });

      a.attributes.forEach((e) => {
        delete e.tags;
        delete e.typename;
        delete e.precision;
        delete e.isArray;
        delete e.type;
        delete e.count;
        return delete e.stageFlags;
      });

      a.varyings.forEach((e) => {
        delete e.tags;
        delete e.typename;
        delete e.precision;
        return delete e.isArray;
      });

      a.blocks.forEach((e) => {
        delete e.rate;
        delete e.tags;

        return e.members.forEach((e) => {
          delete e.typename;
          delete e.precision;
          return delete e.isArray;
        });
      });

      a.samplerTextures.forEach((e) => {
        delete e.rate;
        delete e.tags;
        delete e.typename;
        delete e.precision;
        return delete e.isArray;
      });

      a.buffers.forEach((e) => {
        delete e.rate;
        delete e.tags;
        delete e.typename;
        delete e.precision;
        delete e.isArray;
        return delete e.members;
      });

      a.images.forEach((e) => {
        delete e.rate;
        delete e.tags;
        delete e.typename;
        delete e.precision;
        return delete e.isArray;
      });

      a.textures.forEach((e) => {
        delete e.rate;
        delete e.tags;
        delete e.typename;
        delete e.precision;
        return delete e.isArray;
      });

      a.samplers.forEach((e) => {
        delete e.rate;
        delete e.tags;
        delete e.typename;
        delete e.precision;
        return delete e.isArray;
      });

      a.subpassInputs.forEach((e) => {
        delete e.rate;
        delete e.tags;
        delete e.typename;
        delete e.precision;
        return delete e.isArray;
      });

      let u = 0;

      a.blocks.forEach((e) => (e.binding = u++));
      a.samplerTextures.forEach((e) => (e.binding = u++));
      a.samplers.forEach((e) => (e.binding = u++));
      a.textures.forEach((e) => (e.binding = u++));
      a.buffers.forEach((e) => (e.binding = u++));
      a.images.forEach((e) => (e.binding = u++));
      a.subpassInputs.forEach((e) => (e.binding = u++));
      let m = 0;

      a.attributes.forEach((e) => (e.location = m++));

      m = 0;

      a.varyings.forEach((e) => (e.location = m++));

      m = 0;

      a.fragColors.forEach((e) => (e.location = m++));

      a.blocks.forEach(
        (e) =>
          (e.defines = e.defines.filter((t) =>
            n.find((e) => t.endsWith(e.name))
          ))
      );

      a.samplerTextures.forEach(
        (e) =>
          (e.defines = e.defines.filter((t) =>
            n.find((e) => t.endsWith(e.name))
          ))
      );

      a.samplers.forEach(
        (e) =>
          (e.defines = e.defines.filter((t) =>
            n.find((e) => t.endsWith(e.name))
          ))
      );

      a.textures.forEach(
        (e) =>
          (e.defines = e.defines.filter((t) =>
            n.find((e) => t.endsWith(e.name))
          ))
      );

      a.buffers.forEach(
        (e) =>
          (e.defines = e.defines.filter((t) =>
            n.find((e) => t.endsWith(e.name))
          ))
      );

      a.images.forEach(
        (e) =>
          (e.defines = e.defines.filter((t) =>
            n.find((e) => t.endsWith(e.name))
          ))
      );

      a.subpassInputs.forEach(
        (e) =>
          (e.defines = e.defines.filter((t) =>
            n.find((e) => t.endsWith(e.name))
          ))
      );

      a.attributes.forEach(
        (e) =>
          (e.defines = e.defines.filter((t) =>
            n.find((e) => t.endsWith(e.name))
          ))
      );

      a.varyings.forEach(
        (e) =>
          (e.defines = e.defines.filter((t) =>
            n.find((e) => t.endsWith(e.name))
          ))
      );

      a.fragColors.forEach(
        (e) =>
          (e.defines = e.defines.filter((t) =>
            n.find((e) => t.endsWith(e.name))
          ))
      );

      var g = {};
      var b = {};
      var h = {};
      const y = new Set();
      for (const $ in e) {
        var x = $ === "vert";

        i[$].glsl4 = stripToSpecificVersion(
          decorateBindings(i[$].glsl4, a, i[$].blockInfo),
          460,
          i[$].extensions,
          x
        );

        h[$] = k(i[$].glsl4);
        b[$] = k(i[$].glsl3);
        g[$] = k(i[$].glsl1);

        i[$].record.forEach((e) => y.add(e));
      }
      let v = 0;
      v =
        t === "graphics"
          ? ((h.compute || b.compute) &&
              error("compute shader is not supported in graphics effect"),
            mappings.murmurhash2_32_gc(
              h.vert + h.frag + b.vert + b.frag + g.vert + g.frag,
              666
            ))
          : ((h.vert || h.frag || b.vert || b.frag || g.vert || g.frag) &&
              error(
                "vertex/fragment shader is not supported in compute effect"
              ),
            mappings.murmurhash2_32_gc(
              h.vert +
                h.frag +
                h.compute +
                b.vert +
                b.frag +
                b.compute +
                g.vert +
                g.frag,
              666
            ));
      const E = a.descriptors[3];

      a.blocks = a.blocks.filter((t) =>
        E.blocks.every((e) => e.name !== t.name)
      );

      a.samplerTextures = a.samplerTextures.filter((t) =>
        E.samplerTextures.every((e) => e.name !== t.name)
      );

      a.samplers = a.samplers.filter((t) =>
        E.samplers.every((e) => e.name !== t.name)
      );

      a.textures = a.textures.filter((t) =>
        E.textures.every((e) => e.name !== t.name)
      );

      a.buffers = a.buffers.filter((t) =>
        E.buffers.every((e) => e.name !== t.name)
      );

      a.images = a.images.filter((t) =>
        E.images.every((e) => e.name !== t.name)
      );

      return Object.assign(a, {
        hash: v,
        glsl4: h,
        glsl3: b,
        glsl1: g,
        builtins: c,
        defines: n,
        record: y,
      });
    },
  };
})();

const shaderFactory_compile = shaderFactory.compile;

const parseEffect = (() => {
  const l = /CCEffect\s*%{([^]+?)(?:}%|%})/;
  const c = /CCProgram\s*([\w-]+)\s*%{([^]*?)(?:}%|%})/;
  const p = /#.*$/gm;
  const d = /^\s*$/;
  const f = /\n[^\s]/;
  const u = /^[^\S\n]/gm;
  const m = /\t/g;

  const g = (t, r, s = "effect") => {
    if (Array.isArray(t)) {
      if (Array.isArray(r)) {
        if (t[0]) {
          for (let e = 0; e < r.length; e++) {
            g(t[0], r[e], s + `[${e}]`);
          }
        }
      } else {
        error(`EFX1002: ${s} must be an array`);
      }
    } else if (!r || typeof r != "object" || Array.isArray(r)) {
      error(`EFX1003: ${s} must be an object`);
    } else {
      for (const e of Object.keys(r)) {
        if (e.includes(":")) {
          error(
            `EFX1004: syntax error at '${e}', you might need to insert a space after colon`
          );
        }
      }
      if (t.any) {
        for (const n of Object.keys(r)) {
          g(t.any, r[n], s + ("." + n));
        }
      } else {
        for (const a of Object.keys(t)) {
          let e = a;
          if (e[0] === "$") {
            e = e.substring(1);
          } else if (!r[e]) {
            continue;
          }
          g(t[a], r[e], s + ("." + e));
        }
      }
    }
  };

  return (e, t) => {
    shaderName = "syntax";
    t = t.replace(m, " ".repeat(tabAsSpaces));
    let r = {};
    let s = {};
    let n = {};
    var a = l.exec(t.replace(p, ""));
    if (a) {
      try {
        var i = yaml.load(a[1]);
        r = JSON.parse(JSON.stringify(i));
      } catch (e) {
        error("EFX1001: CCEffect parser failed: " + e);
      }

      if (!r.name) {
        r.name = e;
      }

      g(mappings.effectStructure, r);
    } else {
      error("EFX1000: CCEffect is not defined");
    }
    t = stripComments(t);
    let o = c.exec(t);

    while (o) {
      let [, , e] = o;
      if (!d.test(e)) {
        while (!f.test(e)) {
          e = e.replace(u, "");
        }
      }
      addChunk(o[1], e, s, n);
      t = t.substring(o.index + o[0].length);
      o = c.exec(t);
    }

    return { effect: r, templates: s, localDeprecations: n };
  };
})();

const mapPassParam = (() => {
  const c = (t, e) => {
    let r = 0;

    let s = (e) => e.name === t && ((r = e.type), true);

    if (!e.blocks.some((e) => e.members.some(s))) {
      e.samplerTextures.some(s);
    }

    return r;
  };

  const p = /^(\w+)(?:\.([xyzw]+|[rgba]+))?$/;
  const d = { x: 0, y: 1, z: 2, w: 3, r: 0, g: 1, b: 2, a: 3 };

  const n = (e, t) => {
    let r = {};
    for (const o of Object.keys(e)) {
      var s;
      var n;
      var a;
      var i;

      if (o === "__metadata__") {
        r = e[o];
        delete e[o];
      } else {
        s = e[o];
        a = c(o, t);

        s.type !== undefined &&
          warn(
            `EFX3300: property '${o}': you don't have to specify type in here`
          );

        s.type = a;

        s.target &&
          ((s.handleInfo = ((e, t) => {
            var r = [e, 0, 0];
            var s = p.exec(e);
            if (s) {
              var n = (s[2] && s[2].toLowerCase()) || "";
              const a = d[n[0]] || 0;

              if (
                n
                  .split("")
                  .map((e, t) => d[e] - a - t)
                  .some((e) => e)
              ) {
                error(
                  `EFX3304: '${e}': random component swizzle is not supported`
                );
              }

              r[0] = s[1];
              r[1] = a;
              r[2] = c(s[1], t);

              if (n.length) {
                r[2] -= Math.max(0, mappings.GetTypeSize(r[2]) / 4 - n.length);
              }

              if (r[2] <= 0) {
                error(`EFX3305: no matching uniform target '${e}'`);
              }
            } else {
              error(`EFX3303: illegal property target '${e}'`);
            }
            return r;
          })(s.target, t)),
          delete s.target,
          (s.type = s.handleInfo[2]),
          (a = s.editor && s.editor.visible),
          (n = s.handleInfo[0]),
          (i = c(s.handleInfo[0], t)),
          e[n] || (e[n] = { type: i, editor: { visible: false } }),
          (a !== undefined && !a) ||
            (e[n].editor
              ? e[n].editor.deprecated === undefined &&
                (e[n].editor.deprecated = true)
              : (e[n].editor = { deprecated: true })),
          mappings.isSampler(i)
            ? s.value && (e[n].value = s.value)
            : (e[n].value ||
                (e[n].value = Array(mappings.GetTypeSize(i) / 4).fill(0)),
              Array.isArray(s.value)
                ? e[n].value.splice(s.handleInfo[1], s.value.length, ...s.value)
                : s.value !== undefined &&
                  e[n].value.splice(s.handleInfo[1], 1, s.value)));

        s.sampler &&
          ((s.samplerHash = ((e) => {
            for (const t of Object.keys(e)) {
              if (m[t] === undefined) {
                warn(`EFX3301: illegal sampler info '${t}'`);
              }
            }
            return mappings.Sampler.computeHash(e);
          })(u(s.sampler))),
          delete s.sampler);

        ("number" != (a = typeof s.value) && a != "boolean") ||
          (s.value = [s.value]);

        (i = ((e, t, r) => {
          if (t <= 0) {
            return "no matching uniform";
          }
          if (e !== undefined) {
            if (r === "string") {
              if (!mappings.isSampler(t)) {
                return "string for vectors";
              }
            } else {
              if (!Array.isArray(e)) {
                return "non-array for buffer members";
              }
              if (e.length !== mappings.GetTypeSize(t) / 4) {
                return "wrong array length";
              }
            }
          }
          return "";
        })(s.value, s.type, a)) &&
          error(`EFX3302: illegal property declaration for '${o}': ` + i);
      }
    }
    for (const l of Object.keys(e)) {
      f(e[l], r);
    }
    return e;
  };

  const f = (e, t) => {
    for (const s of Object.keys(t)) {
      var r = t[s];

      if (typeof r == "object" && typeof e[s] == "object") {
        f(e[s], r);
      } else if (e[s] === undefined) {
        e[s] = r;
      }
    }
  };

  const u = (t) => {
    for (const s in t) {
      var r = t[s];
      if (typeof r == "string") {
        let e = parseInt(r);

        if (
          undefined !==
          (e = isNaN(e) ? mappings.passParams[r.toUpperCase()] : e)
        ) {
          t[s] = e;
        }
      } else if (Array.isArray(r)) {
        if (r.length) {
          switch (typeof r[0]) {
            case "object": {
              r.forEach(u);
              break;
            }
            case "string": {
              u(r);
              break;
            }
            case "number": {
              t[s] =
                (((255 * r[0]) << 24) |
                  ((255 * r[1]) << 16) |
                  ((255 * r[2]) << 8) |
                  (255 * (r[3] || 255))) >>>
                0;
            }
          }
        }
      } else {
        if (typeof r == "object") {
          u(r);
        }
      }
    }
    return t;
  };

  const m = new mappings.SamplerInfo();
  const a = /^([a-zA-Z]+)?\s*([+-])?\s*([\dxabcdef]+)?$/i;
  const i = mappings.RenderPriority.DEFAULT;
  const o = mappings.RenderPriority.MIN;
  const l = mappings.RenderPriority.MAX;
  return (e, t) => {
    shaderName = "type error";
    var r;
    var s = {};

    if (e.priority) {
      s.priority = ((e) => {
        let t = 0;
        var r = a.exec(e);

        if (r[1]) {
          t = mappings.RenderPriority[r[1].toUpperCase()];
        }

        if (r[3]) {
          t += parseInt(r[3]) * (r[2] === "-" ? -1 : 1);
        }

        return isNaN(t) || t < o || t > l
          ? (warn("EFX3000: illegal pass priority: " + e), i)
          : t;
      })(e.priority);

      delete e.priority;
    }

    if (e.depthStencilState) {
      s.depthStencilState = ((e) => {
        for (const t of Object.keys(e)) {
          if (
            t.startsWith("stencil") &&
            !t.endsWith("Front") &&
            !t.endsWith("Back")
          ) {
            e[t + "Front"] = e[t + "Back"] = e[t];
            delete e[t];
          }
        }

        if (e.stencilWriteMaskFront !== e.stencilWriteMaskBack) {
          warn(
            "EFX3100: WebGL(2) doesn't support inconsistent front/back stencil write mask"
          );
        }

        if (e.stencilReadMaskFront !== e.stencilReadMaskBack) {
          warn(
            "EFX3101: WebGL(2) doesn't support inconsistent front/back stencil read mask"
          );
        }

        if (e.stencilRefFront !== e.stencilRefBack) {
          warn(
            "EFX3102: WebGL(2) doesn't support inconsistent front/back stencil ref"
          );
        }

        return u(e);
      })(e.depthStencilState);

      delete e.depthStencilState;
    }

    if (e.switch) {
      s.switch =
        ((r = e.switch),
        t.defines.find((e) => e.name === r) &&
          error(
            "EFX3200: existing shader macros cannot be used as pass switch"
          ),
        r);

      delete e.switch;
    }

    if (e.properties) {
      s.properties = n(e.properties, t);
      delete e.properties;
    }

    if (e.migrations) {
      s.migrations = e.migrations;
      delete e.migrations;
    }

    u(e);
    Object.assign(e, s);
  };
})();

const reduceHeaderRecord = (e) => {
  var t = new Set();
  for (const r of e) {
    r.record.forEach(t.add, t);
  }
  return [...t.values()];
};

const stageValidation = (e) => {
  const t = { vert: "graphics", frag: "graphics", compute: "compute" };
  if (e.length === 0) {
    error("0 stages provided for a pass");
    return "";
  }
  const r = t[e[0]];

  e.forEach((e) =>
    t[e]
      ? t[e] !== r
        ? (error("more than one pass type appears"), "")
        : undefined
      : (error("invalid stage type " + e), "")
  );

  if (r === "graphics") {
    var s = e.find((e) => e === "vert");

    var n = e.find((e) => e === "frag");

    if (e.length === 1 || !s || !n) {
      error("graphics pass must include vert and frag shaders");
      return "";
    }
  }

  return r;
};

const buildEffect = (t, e) => {
  effectName = t;
  var { effect: t, templates, localDeprecations } = parseEffect(t, e);
  if (!t || !Array.isArray(t.techniques)) {
    return null;
  }
  var templates = Object.assign({}, globalChunks, templates);
  var n = {};
  for (const o in globalDeprecations) {
    n[o] = Object.assign({}, globalDeprecations[o], localDeprecations[o]);
  }

  var e = Object.keys(n.identifiers)
    .reduce((e, t) => "|" + t + e, "")
    .slice(1);

  if (e.length) {
    n.identifierRE = new RegExp(`\\b(${e})\\b`, "g");
  }

  var a = (t.shaders = []);

  for (const l of t.techniques) {
    for (const c of l.passes) {
      const p = {};
      var i = [];

      if (c.vert) {
        p.vert = c.vert;
        delete c.vert;
        i.push("vert");
      }

      if (c.frag) {
        p.frag = c.frag;
        delete c.frag;
        i.push("frag");
      }

      if (c.compute) {
        p.compute = c.compute;
        delete c.compute;
        i.push("compute");
      }

      const t = (c.program = i.reduce(
        (e, t) => e.concat("|" + p[t]),
        effectName
      ));
      i = stageValidation(i);
      if (i !== "") {
        let e = a.find((e) => e.name === t);

        if (!e) {
          e = shaderFactory.build(p, i, templates, n);
          e.name = t;
          a.push(e);
        }

        mapPassParam(c, e);
      }
    }
  }
  t.dependencies = reduceHeaderRecord(a);
  return t;
};

module.exports = {
  options,
  addChunk,
  shaderFactory_compile,
  buildEffect,
};
