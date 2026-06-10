const ipc = require("@base/electron-base-ipc");
const mouse = require("./mouse");
const board = require("./board");
const element = require("./element");
async function messageListener(e, a, t, s, ...r) {
  let i = element.query(a, t);
  let n = null;
  switch (s) {
    case "length": {
      n = i.length;
      break;
    }
    case "attr": {
      if (i.length !== undefined) {
        i = i[0];
      }

      n = i.getAttribute(r[0]);

      if (r[1] !== undefined) {
        i.setAttribute(r[0], r[1]);
      }

      break;
    }
    case "data": {
      if (i.length !== undefined) {
        i = i[0];
      }

      n = i[r[0]];

      if (r[1] !== undefined) {
        i[r[0]] = r[1];
      }

      break;
    }
    case "click": {
      await mouse.click(i, ...r);
      break;
    }
    case "mousedown": {
      await mouse.mouseDown(i, ...r);
      break;
    }
    case "input": {
      await board.input(i, r[0] || "");
      break;
    }
    case "enter": {
      await board.enter(i);
      break;
    }
    case "esc": {
      await board.esc(i);
    }
  }
  e.reply(null, n);
}

exports.load = () => {
  ipc.on("package-tester:message", messageListener);
};

exports.unload = () => {
  ipc.removeListener("package-tester:message", messageListener);
};
