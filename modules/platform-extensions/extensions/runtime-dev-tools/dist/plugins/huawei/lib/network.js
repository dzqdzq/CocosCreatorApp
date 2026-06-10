Object.defineProperty(exports, "__esModule", { value: true });
exports.download = download;
exports.get = get;
exports.post = post;
const https = require("https");
const qs = require("querystring");
const fs = require("fs-extra");
const request = require("request");
const progress = require("request-progress");
function download(e, t, r, o) {
  progress(request(e), { delay: 200 })
    .on("progress", (e) => {
      if (r) {
        r(e.percent);
      }
    })
    .on("error", (e) => {
      o(e, false);
    })
    .on("end", () => {
      o(null, true);
    })
    .pipe(fs.createWriteStream(t));
}
function get(e) {
  return new Promise((t, r) => {
    https
      .get(e, (e) => {
        e.on("data", (e) => {
          t(e);
        });
      })
      .on("error", (e) => {
        r(e);
      });
  });
}
function post(o, n, s, u) {
  return new Promise((r, t) => {
    var e = {
      hostname: o,
      port: n,
      path: s,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    };

    var e = https.request(e, (e) => {
      e.setEncoding("utf8");
      let t = "";

      e.on("data", (e) => {
        t += e;
      });

      e.on("end", (e) => {
        r(t);
      });
    });

    e.on("error", (e) => {
      t(e);
      console.log("problem with request: " + e.message);
    });

    e.write(qs.stringify(u));
    e.end();
  });
}
