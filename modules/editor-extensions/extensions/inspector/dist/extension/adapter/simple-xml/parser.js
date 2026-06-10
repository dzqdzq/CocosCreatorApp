Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = decode;
const htmlparser2_1 = require("htmlparser2");
const element_1 = require("../../element");
const parser_1 = require("../simple-json/parser");

const { decode: decode_2 } = parser_1;

function decode(e, r, t) {
  if (r && r.tag !== "inspector-root") {
    throw new Error("Not a legitimate root node");
  }
  var o = r || new element_1.VirtualElement("inspector-root");
  var n = { type: "vbox", children: [] };
  let s = n;
  const i = new Map();
  var p = new htmlparser2_1.Parser({
    onopentag(e, r) {
      var t = parser_1.parserJSONObjectMap[e];
      var t = t ? t.generate() : { type: e };

      i.set(t, s);

      if ("children" in s) {
        -1 !== (e = s.children.indexOf(t)) && s.children.splice(e, 1);
        s.children.push(t);
      }

      var o = t;

      for (const n in r) {
        let e = r[n];

        if (e === "true") {
          e = true;
        } else if (e === "false") {
          e = false;
        }

        if (n.startsWith("properties.")) {
          o.properties = o.properties || {};
          o.properties[n.substring(11)] = e;
        } else {
          o[n] = e;
        }
      }
      s = t;
    },
    ontext(e) {},
    onclosetag(e) {
      s = i.get(s);
    },
  });
  p.write(e);
  p.end();
  decode_2(n, r, t);
  return o;
}
