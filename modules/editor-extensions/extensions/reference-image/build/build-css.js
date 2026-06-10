const exec = require("child_process").exec;
exec("lessc statics/index.less > dist/index.css", (e, s, c) => {
  if (e) {
    console.log(e);
  } else {
    console.log("build:css done");
  }
});
