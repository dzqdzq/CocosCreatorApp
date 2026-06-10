require("chai").should();
const fse = require("fs-extra");
const path = require("path");
function comparison(o, t, r) {
  const c = Object.keys(t);
  const s = Object.keys(r);
  let n = false;

  c.forEach((e) => {
    if (!s.includes(e) || typeof t[e] != typeof r[e]) {
      console.log(`The ZH lost the data of ${o}.` + e);
      n = true;
    } else if (typeof t[e] == "object" && comparison(e, t[e], r[e])) {
      n = true;
    }
  });

  s.forEach((e) => {
    if (c.includes(e)) {
      if (typeof r[e] != typeof t[e]) {
        console.log(`The ZH lost the data of ${o}.` + e);
        n = true;
      } else if (typeof r[e] == "object" && comparison(e, t[e], r[e])) {
        n = true;
      }
    } else {
      console.log(`The EN lost the data of ${o}.` + e);
      n = true;
    }
  });

  return n;
}
describe("I18n", () => {
  it("Key 是否有遗漏", async () => {
    if (comparison("", require("../i18n/en"), require("../i18n/zh"))) {
      throw new Error("测试未通过");
    }
  });
});
