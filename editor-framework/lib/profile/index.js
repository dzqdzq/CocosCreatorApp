"use strict";

if ("browser" === process.type) {
  module.exports = require("./browser");
} else {
  module.exports = require("./renderer");
}
