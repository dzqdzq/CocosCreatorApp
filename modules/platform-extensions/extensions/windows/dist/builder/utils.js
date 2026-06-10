var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, i);
      }
    : (e, t, r, a) => {
        e[(a = a === undefined ? r : a)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = i(e), a = 0; a < r.length; a++) {
          if (r[a] !== "default") {
            __createBinding(t, e, r[a]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.queryVisualStudioVersion = queryVisualStudioVersion;
exports.executableNameOrDefault = executableNameOrDefault;

const { join } = require("path");

const { mkdtemp, writeFile } = require("fs-extra");

const { spawn } = require("child_process");

const os = __importStar(require("os"));
async function queryCmake() {
  var e = await Editor.Message.request(
    "program",
    "query-program-info",
    "cmake"
  );

  var e = e ? e.path : "";
  return e || join(Editor.App.path, "../tools/cmake/bin/cmake.exe");
}
async function queryVisualStudioVersion() {
  const i = await queryCmake();
  var o;
  var e = os.tmpdir();

  var t = [
    ["-G", '"Visual Studio 17 2022"'],
    "2022",
    ["-G", '"Visual Studio 16 2019"'],
    "2019",
    ["-G", '"Visual Studio 15 2017"', "-A", "x64"],
    "2017",
    ["-G", '"Visual Studio 14 2015"', "-A", "x64"],
    "2015",
  ];

  var e = await mkdtemp(join(e, "cmake-vs"));

  console.log("Create temp dir " + e);
  var r = join(e, "CMakeLists.txt");

  var a = join(e, "hello.cpp");

  await writeFile(
    r,
    `
cmake_minimum_required(VERSION 3.8)
project(hello CXX)
add_executable(hello hello.cpp)
`
  );

  await writeFile(
    a,
    `
#include <iostream>
int main(int argc, char **argv) {
std::cout << "hello cocos" << std::endl;
return 0;
}
`
  );

  var n = [];
  o = e;

  var u = async (t, a) =>
    new Promise((r, e) => {
      spawn(i, t.concat("-B build_" + a), {
        cwd: o,
        shell: true,
      }).on("close", (e, t) => {
        r(e == 0);
      });

      return false;
    });

  for (let e = 0; e < t.length; e += 2) {
    var s = t[e];
    var c = t[e + 1];

    if (await u(s.concat("-S."), c)) {
      n.push({ name: "Visual Studio " + c, value: c });
    }
  }
  return n;
}
function executableNameOrDefault(e, t) {
  return t || (/^[0-9a-zA-Z_-]+$/.test(e) ? e : "CocosGame");
}
