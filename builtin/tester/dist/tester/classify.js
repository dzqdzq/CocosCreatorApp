Object.defineProperty(exports, "__esModule", { value: true });
exports.Describe = undefined;
exports.It = undefined;
const logger_1 = require("./logger");
class Info {
  parent = null;
  message;
  handle;
  get prefix() {
    let s = this;
    let r = "";
    for (var t = []; s.parent; ) {
      let e;
      var i = (e =
        s instanceof Describe
          ? s.parent.subDescribes
          : s.parent.subIts).indexOf(s);
      r = i + 1 + "." + r;
      s = s.parent;
      t.push("  ");
    }
    t.pop();
    return t.join("") + r;
  }
  constructor(e, s) {
    this.message = e;
    this.handle = s;
  }
}
class It extends Info {
  _reject;
  _timer;
  constructor(e, s) {
    super(e, s);
    this._reject = null;
    this._timer = null;
  }
  async run() {
    if ((classify.current = this).handle) {
      try {
        logger_1.logger.log(this.prefix + " " + (this.message || ""));

        await new Promise((e, s) => {
          this.timeout(5000 /* 5e3 */);
          var r = this.handle.call(this);

          if (r instanceof Promise) {
            this._reject = s;

            r.then(() => {
              if (this._timer) {
                clearTimeout(this._timer);
              }

              e();
            }).catch((e) => {
              if (this._timer) {
                clearTimeout(this._timer);
              }

              s(e);
            });
          } else {
            e();
          }
        });
      } catch (e) {
        logger_1.logger.rollback();

        logger_1.logger.error(
          new Error(this.prefix + " " + (this.message || ""))
        );

        console.log("");

        console.log(
          "%c" + (this.prefix + " " + (this.message || "")).trim(),
          "color: red;"
        );

        console.log("%c" + e.stack, "color: red;");
      }
      classify.current = this.parent;
    }
  }
  timeout(e) {
    if (this._timer) {
      clearTimeout(this._timer);
    }

    this._timer = setTimeout(() => {
      if (this._reject) {
        this._reject(new Error(`操作超时 ${e}ms`));
      }
    }, e);
  }
}
exports.It = It;
class Describe extends Info {
  before;
  after;
  subDescribes;
  subIts;
  constructor(e, s) {
    super(e, s);
    this.subDescribes = [];
    this.subIts = [];
    this.before = null;
    this.after = null;
  }
  addBefore(e) {
    this.before = e;
  }
  addAfter(e) {
    this.after = e;
  }
  addDescribe(e) {
    (e.parent = this).subDescribes.push(e);
  }
  addIt(e) {
    (e.parent = this).subIts.push(e);
  }
  async run() {
    if ((classify.current = this).handle) {
      try {
        await this.handle();

        if (this.parent) {
          logger_1.logger.log(this.prefix + " " + (this.message || ""));
        }
      } catch (e) {
        if (this.parent) {
          logger_1.logger.error(
            new Error(this.prefix + " " + (this.message || ""))
          );

          console.error(this.prefix + " " + (this.message || ""));
          console.error(e);
        }
      }
    }
    try {
      if (this.before) {
        await this.before();
      }
    } catch (e) {
      if (this.parent) {
        logger_1.logger.error(
          new Error(this.prefix + " " + (this.message || ""))
        );

        console.error(this.prefix + " " + (this.message || ""));
        console.error(e);
      }
    }
    for (let e = 0; e < this.subIts.length; e++) {
      await this.subIts[e].run();
    }
    for (let e = 0; e < this.subDescribes.length; e++) {
      await this.subDescribes[e].run();
    }
    try {
      if (this.after) {
        await this.after();
      }
    } catch (e) {
      if (this.parent) {
        logger_1.logger.error(
          new Error(this.prefix + " " + (this.message || ""))
        );

        console.error(this.prefix + " " + (this.message || ""));
        console.error(e);
      }
    }

    if (this.parent) {
      classify.current = this.parent;
    } else {
      classify.current = new Describe();
    }
  }
}
const classify = { current: new (exports.Describe = Describe)() };
exports.default = classify;
