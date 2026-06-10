var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (t, e, r, n = r) => {
        var o = Object.getOwnPropertyDescriptor(e, r);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : e.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return e[r];
            },
          };
        }

        Object.defineProperty(t, n, o);
      }
    : (t, e, r, n) => {
        t[(n = n === undefined ? r : n)] = e[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (t, e) => {
        Object.defineProperty(t, "default", { enumerable: true, value: e });
      }
    : (t, e) => {
        t.default = e;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var o = (t) =>
      (o =
        Object.getOwnPropertyNames ||
        ((t) => {
          var e;
          var r = [];
          for (e in t) {
            if (Object.prototype.hasOwnProperty.call(t, e)) {
              r[r.length] = e;
            }
          }
          return r;
        }))(t);
    return (t) => {
      if (t && t.__esModule) {
        return t;
      }
      var e = {};
      if (t != null) {
        for (var r = o(t), n = 0; n < r.length; n++) {
          if (r[n] !== "default") {
            __createBinding(e, t, r[n]);
          }
        }
      }
      __setModuleDefault(e, t);
      return e;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.sendHttpRequest = sendHttpRequest;
const Http = __importStar(require("http"));
const Https = __importStar(require("https"));
const Querystring = __importStar(require("querystring"));
function sendHttpRequest(t, e) {
  var { host, path } = t;

  var o = t.protocol === "https" ? Https : Http;
  let i = t.data || {};

  if (t.useStringifyData === undefined || t.useStringifyData) {
    i = Querystring.stringify(t.data || {});
  }

  var u = t.port || 443;
  var a = t.method || "GET";
  var t = t.headers || {};

  if (!t["User-Agent"]) {
    t["User-Agent"] = Editor.App.userAgent;
  }

  if (a === "GET") {
    path += "?" + i;
  } else {
    i += "\n";
  }

  let s = "";
  o = o
    .request(
      { method: a, host: host, port: u, path: path, headers: t },
      (t) => {
        if (
          t.statusCode !== undefined &&
          t.statusCode >= 200 &&
          t.statusCode < 300
        ) {
          t.on("data", (t) => {
            s += t;
          }).on("end", () => {
            e(null, s);
          });
        } else {
          e(new Error("Connect Failed. Status Code: " + t.statusCode), s);
          t.resume();
        }
      }
    )
    .on("error", (t) => {
      e(t, s);
    });
  o.write(i);
  o.end();
}
