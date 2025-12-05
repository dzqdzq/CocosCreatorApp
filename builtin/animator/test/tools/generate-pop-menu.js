const ps = require('path');
const fse = require('fs-extra');
const i18n = require('@base/electron-i18n');
const popMenu = require(ps.join(__dirname, './../../dist/panel/share/pop-menu.js'));

exports.outputMenuConfig = async function (outDir) {
    const res = {};
    Object.keys(popMenu.menuConfig).forEach((key) => {
        res[key] = [];
        let i = 0;
        popMenu.menuConfig[key].forEach((menuName, index) => {
            const item = popMenu.popMenuMap[menuName];
            if (!item.label) {
                return;
            }
            res[key].push({
                ...item,
                path: [i],
                label: {
                    zh: i18n.translation(item.label.replace('i18n:', ''), 'zh'),
                    en: i18n.translation(item.label.replace('i18n:', ''), 'en'),
                },
            });
            i++;
        });
    });
    return await fse.outputJSON(ps.join(outDir, 'animator-pop-menu.json'), res, {
        spaces: 4,
    });
};
