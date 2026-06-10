const { readdirSync, statSync, unlinkSync } = require("fs");
const join = require("path").join;
(() => {
  var n = join(__dirname, "./node_modules");
  let r = 0;

  !(function i(e) {
    r++;

    readdirSync(e).forEach((n) => {
      n = join(e, n);

      if (statSync(n).isDirectory()) {
        i(n);
      } else if (/.d.ts$/.test(n)) {
        unlinkSync(n);
      } else {
        r++;
      }
    });
  })(n);

  console.log(r);
})();
