"use strict";
let e = {};
module.exports = e;

e.init = function () {
  let e = window.Vue;

  if (e) {
    e.directive("value", {
        twoWay: true,
        bind() {
          this.handler = (e) => {
            this.set(e.detail.value);
          };

          this.el.addEventListener("change", this.handler);
        },
        unbind() {
          this.el.removeEventListener("change", this.handler);
        },
        update(e) {
          this.el.value = e;
        },
      });

    e.directive("disabled", {
      update(e) {
        this.el.disabled = e;
      },
    });

    e.directive("readonly", {
      update(e) {
        this.el.readonly = e;
      },
    });
  }
};
