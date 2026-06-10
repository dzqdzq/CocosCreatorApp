var __importDefault =
  (this && this.__importDefault) ||
  ((r) => (r && r.__esModule ? r : { default: r }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.scan = scan;
exports.sortIp = sortIp;
const os_1 = __importDefault(require("os"));
function getIPAdress() {
  var t = [];
  var r = os_1.default.networkInterfaces();
  for (const s in r) {
    var e = r[s];
    if (e) {
      for (let r = 0; r < e.length; r++) {
        var o = e[r];

        if (o.family === "IPv4" && o.address !== "127.0.0.1" && !o.internal) {
          t.push(o);
        }
      }
    }
  }
  return t;
}
async function scan() {
  var r;
  var t = [[]];
  let e = 0;
  let o = false;
  for (const i of getIPAdress().map((r) => {
    var t = r.netmask.split(".").map((r) => Number(r));
    const e = r.address.split(".").map((r) => Number(r));
    return t.map((r, t) => {
      t = r & e[t];
      return [t, 255 - r + t];
    });
  })) {
    for (let p = i[0][0]; p <= i[0][1]; p++) {
      for (let n = i[1][0]; n <= i[1][1]; n++) {
        for (let a = i[2][0]; a <= i[2][1]; a++) {
          for (let s = i[3][0]; s <= i[3][1]; s++) {
            if (o === false) {
              o = true;
            } else {
              (r = t[e]).push(
                new Promise(async (o) => {
                  setTimeout(() => {
                    o(null);
                  }, 10000 /* 1e4 */);
                  for (let e = 7456; e < 7460; e++) {
                    Editor.Network.get(
                      `http://${p}.${n}.${a}.${s}:${e}/__server__/handshake`
                    ).then((r) => {
                      if (r) {
                        try {
                          var t = JSON.parse(r.toString());
                          t.ip = `${p}.${n}.${a}.` + s;
                          t.port = e;
                          return o(t);
                        } catch (r) {}
                      } else {
                        o(null);
                      }
                    });
                  }
                })
              );

              r.length >= 100 && (t[++e] = []);
            }
          }
        }
      }
    }
  }
  const s = [];
  for (const a of t) {
    if (a && a.length) {
      (await Promise.all(a)).forEach((r) => r && s.push(r));
    }
  }
  return s;
}
const otherIp = "other";
const ipAddrMap = {
  192.168: 1,
  172: 2,
  10: 3,
  169.254: 4,
  [otherIp]: 5,
  127: 6,
};
const ipReg = /^((\d+)(?:\.(\d+))?)(\..*)?$/;
function sortIp(r) {
  return r.sort((r, t) => {
    var [, r, e] = r.match(ipReg) || [];
    var [, t, o] = t.match(ipReg) || [];
    return (
      (ipAddrMap[r] || ipAddrMap[e] || ipAddrMap[otherIp]) -
      (ipAddrMap[t] || ipAddrMap[o] || ipAddrMap[otherIp])
    );
  });
}
