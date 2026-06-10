const { join, relative } = require("path");
const { readdirSync, existsSync } = require("fs");
const fg = require("fast-glob");
const tester = require("../../tester").tester;
const profileManager = require("@base/electron-profile");
const profile = profileManager.load("local://tester.json");

exports.data = () => ({
  language: "",
  auto: !!profile.get("auto"),
  autoAll: !!profile.get("autoAll"),
  running: false,
  package: "",
  path: "",
  test: "",
  packages: [],
  tests: [],
  logs: [],
});

exports.watch = {
  package(e) {
    this.packages.some((t) => {
      if (t.info.name === e) {
        this.path = t.info.path;
        return true;
      }
    });

    if (!this.path) {
      this.test = "";
      this.tests = [];
      return this.tests;
    }

    const s = join(this.path, "test");
    if (!existsSync(s)) {
      this.test = "";
      this.tests = [];
      return this.tests;
    }
    var t = fg.sync("**/**.spec.js", {
      onlyFiles: true,
      absolute: true,
      cwd: s,
    });

    this.tests = t
      .map((t) => relative(s, t))
      .sort((t, e) => parseInt(t) - parseInt(e));

    if (!this.tests.includes(this.test)) {
      this.test = this.tests[0];
    }
  },
};

exports.methods = {
  t(t, e) {
    return Editor.I18n.t("tester." + t);
  },
  _onAutoClick(t) {
    this.auto = !this.auto;
    profile.set("auto", this.auto);
    profile.save();
  },
  _onAutoAllClick() {
    this.autoAll = !this.autoAll;
    profile.set("autoAll", this.autoAll);
    profile.save();
  },
  _onPakcageConfirm(t) {
    t = t.target.value;
    this.package = t;
    profile.set("package", t);
    profile.save();
  },
  _onTestConfirm(t) {
    this.test = t.target.value;
    profile.set("test", t.target.value);
    profile.save();
  },
  async _onTestButtonClick(t) {
    if (this.package && this.test && !this.running) {
      console.clear();
      this.running = true;
      this.logs = [];
      const s = [];

      if (this.auto) {
        this.tests.forEach((t) => {
          s.push(t);
        });
      } else {
        s.push(this.test);
      }

      for (let t = 0; t < s.length; t++) {
        var e = s[t];

        var e =
          (this.logs.push({
            type: "info",
            message: `======== ${e} ========`,
          }),
          join(this.path, "test", e));

        try {
          Editor.Module.requireFile(e);
          await tester.run();
        } catch (t) {
          console.error(t);
        }
        Editor.Module.removeCache(e);
      }
      this.running = false;
    }
  },
};

exports.mounted = async function () {
  let t = Editor.Package.getPackages();

  if (
    Editor.App.isPackaged &&
    !Editor.App.args.dev &&
    !(await Editor.Profile.getConfig("tester", "enableBuiltinPackageTest"))
  ) {
    t = t.filter((t) => !t.path.startsWith(Editor.App.path));
  }

  this.packages = t
    .map((t) => {
      let e = false;
      var s = join(t.path, "test");
      return {
        info: t,
        disabled: (e = existsSync(s) && readdirSync(s).length !== 0 ? e : true),
      };
    })
    .sort((t, e) => (t.disabled ? 1 : 0) - (e.disabled ? 1 : 0));

  this.package = profile.get("package");
  this.test = profile.get("test");

  tester.on("print", (t) => {
    this.logs.push(t);
  });

  tester.on("rollback", () => {
    this.logs.pop();
  });
};
