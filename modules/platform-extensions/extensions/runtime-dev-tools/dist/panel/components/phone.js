Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.template = undefined;

exports.created = created;
exports.data = data;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const phone_1 = require("../../utils/phone");
async function created() {
  this.registerEvent();
  await phone_1.phone.getPhoneList();
  this.curSel = phone_1.phone.currentPhone;
}
function data() {
  return { list: phone_1.phone.list, curSel: phone_1.phone.currentPhone };
}

exports.template = readFileSync(
  join(__dirname, "../../../static/template/phone.html"),
  "utf8"
);

exports.watch = {};
exports.computed = {};

exports.methods = {
  t(e) {
    return Editor.I18n.t(e);
  },
  phoneClick(e) {
    phone_1.phone.currentPhone = e;
    this.curSel = phone_1.phone.currentPhone;
  },
  isSelect(e) {
    return e === this.curSel;
  },
  updateSelPhone() {
    this.curSel = phone_1.phone.currentPhone;
  },
  getPhoneName(e) {
    let e_id = e.id;
    return (e_id = e.cp && e.name ? e.cp + " " + e.name : e_id);
  },
  registerEvent() {
    phone_1.phone.on("add_device", (e) => {
      this.updateSelPhone();
    });

    phone_1.phone.on("remove_device", (e) => {
      this.updateSelPhone();
    });
  },
};
