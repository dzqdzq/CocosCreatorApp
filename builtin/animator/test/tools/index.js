
const ps = require('path');
const popMenu = require(ps.join(__dirname, './generate-pop-menu.js'));
const mockData = require(ps.join(__dirname, './generate-mock-data.js'));

module.exports = {
    popMenu,
    mockData,
};
