var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const xlsx_1 = __importDefault(require("xlsx"));

const { existsSync, writeJsonSync } = require("fs-extra");

const { join } = require("path");

(() => {
  function r(e, t) {
    e = xlsx_1.default.utils.encode_cell({ r: e - 1, c: t - 1 });
    t = a[e];
    return t ? t.v : undefined;
  }
  var e = "cocos create数据需求表.xlsx";
  var t = join(__dirname, "..", "statics");
  var o = join(t, e);
  var s = join(t, "googleG4Table.json");
  if (!existsSync(o)) {
    return console.error(
      new Error(`转换失败，需要把 ${e} 复制到 ${t} 文件夹下`)
    );
  }
  e = xlsx_1.default.readFile(o);
  t = e.SheetNames[9];
  const a = e.Sheets[t];
  const l = {};
  for (let e = 0; e < 500; e++) {
    var n = r(e, 1);
    const _ = r(e, 7);
    var i = r(e, 8);
    if (
      _ &&
      i &&
      n &&
      n === "生效" &&
      _ !== "dashboard" &&
      _ !== "other" &&
      i !== "projectId"
    ) {
      const c = r(e, 11);
      if (c && c !== "-") {
        let t = r(e, 12) || "";

        if (t === "-") {
          t = "";
        } else if (
          t === "{0/1}" ||
          t === "{1/2}" ||
          t === "{labelName}" ||
          t === "{processName}" ||
          t === "{panelName}"
        ) {
          t = "{*}";
        } else if ((n = t.split("_{")).length > 1) {
          t = n[0] + "_{*}";
        }

        n = i.split("_");
        const [f] = n;
        if (n.length > 1) {
          i = n[1].split("/");
          if (i.length > 1) {
            i.forEach((e) => {
              e = (e = e.replace("{", "")).replace("}", "");
              l[`${_}_${f}_` + e] = { action: c, label: t };
            });
            continue;
          }
        }
        l[_ + "_" + f] = { action: c, label: t };
      }
    }
  }
  console.log(l);
  writeJsonSync(s, l, { encoding: "utf8", spaces: 4 });
})();
