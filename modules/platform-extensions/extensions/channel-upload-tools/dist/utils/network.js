const Fs = require("fs");
const Http = require("http");
const Https = require("https");
const Url = require("url");
const Req = require("request");

exports.getAsync = (t, s, o) =>
  new Promise((r, a) => {
    var e = { url: t };

    if (s) {
      e.qs = s;
    }

    if (o) {
      e.headers = o;
    }

    Req.get(e, (e, t, s) =>
      e
        ? a(e)
        : t.statusCode !== 200
        ? (t.resume(), a(t.statusMessage))
        : void r(s)
    );
  });

exports.putAsync = (t, s, o, n) =>
  new Promise((r, a) => {
    var e = { url: t };

    if (s) {
      e.qs = s;
    }

    if (n) {
      e.body = n;
    }

    if (o) {
      e.headers = o;
    }

    Req.put(e, (e, t, s) =>
      e
        ? a(e)
        : t.statusCode !== 200
        ? (t.resume(), a(t.statusMessage))
        : void r(s)
    );
  });

exports.uploadFile = (t, s, o) =>
  new Promise((r, a) => {
    var e = { url: t, headers: { accept: "application/json" } };

    var e = Req.post(e, (e, t, s) =>
      e
        ? a(e)
        : t.statusCode !== 200
        ? (t.resume(), a(t.statusMessage))
        : void r(s)
    ).form();

    e.append("file", Fs.createReadStream(s));
    e.append("authCode", o);
    e.append("fileCount", "1");
    e.append("parseType", "1");
  });

exports.postAsync = (r, a) =>
  new Promise((s, t) => {
    var e = Url.parse(r);

    var e = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      host: e.host,
      path: e.path,
    };

    var e = (r.startsWith("http://") ? Http : Https).request(e, (e) => {
      let t = "";

      e.on("end", () => {
        s(t);
      });

      e.on("data", (e) => {
        t += e;
      });
    });

    e.on("error", (e) => {
      t(e);
    });

    e.write(a);
    e.end();
  });
