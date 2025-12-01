"use strict";
const i = require("util");

if (!i.promisify) {
  i.promisify = function (i) {
      return function (...n) {
        return new Promise(function (r, t) {
          i(...n, (i, n) => {
            if (i) {
              t(i);
            } else {
              r(n);
            }
          });
        });
      };
    };
}
