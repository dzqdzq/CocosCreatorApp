const xlsx = require("node-xlsx");
const fse = require("fs-extra");
const ps = require("path");
const excelFilePath = ps.join(__dirname, "./test.xlsx");
const [sheet] = xlsx.parse(excelFilePath);
function collectDeviceData() {
  const c = { devices: [], default: [] };

  sheet.data.forEach((e, s) => {
    var t;
    var a;
    var [, , , , i] = e;

    if (i && (!e[2] || e[2].trim() !== "删除") && s !== 0) {
      s = Number(e[5]);
      t = Number(e[6]);
      a = Number(e[7]);

      Number.isNaN(s) || Number.isNaN(t) || Number.isNaN(a)
        ? console.log("Invalid data " + JSON.stringify(e))
        : ((i = { name: i, width: s, height: t, ratio: a }),
          e[3] === "是" && ((i.default = true), c.default.push(i.name)),
          c.devices.push(i));
    }
  });

  fse.writeJsonSync(ps.join(__dirname, "devices.json"), c, { spaces: 4 });
  console.log(`update devices(${c.devices.length}) success!`);
}
collectDeviceData();
