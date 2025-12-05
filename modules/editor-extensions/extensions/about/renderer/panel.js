'use strict';

const { join } = require('path');
const { existsSync, readFileSync, readJSONSync } = require('fs-extra');

const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;

const ABOUT_INFO_KEYS = ['engine', 'editor', 'external', 'platformExtensions', 'engineExtensions', 'editorExtensions'];

exports.style = readFileSync(join(__dirname, '../static/style/index.css'), 'utf8');
exports.template = readFileSync(join(__dirname, '../static', '/template/index.html'), 'utf8');

/**
 * 编辑器各个拓展的 commit id'
 * @type {object}
 * @property {string} engine
 * @property {string} editor
 * @property {string} external
 * @property {string} platformExtensions
 * @property {string} engineExtensions
 * @property {string} editorExtensions
 * etc...
 */
let commitInfo = {};

// 打包时间
let time = null;
function formatTime(time = new Date()) {
    var date = new Date(time + 8 * 3600 * 1000);
    return date.toJSON().substr(0, 10).replace(/-/g, '.');
}

exports.$ = {
    container: '.content',
};

exports.ready = function() {
    const file = join(Editor.App.path, '.HEAD');
    if (existsSync(file)) {
        let json = readJSONSync(file);
        time = formatTime(json['time']);
        json = ABOUT_INFO_KEYS.reduce((prev, cur) => {
            prev[cur] = json[cur] ? json[cur].substr(0, 7) : 'unknown';
            return prev;
        }, {});
        commitInfo = json;
    } else {
        commitInfo = ABOUT_INFO_KEYS.reduce((prev, cur) => {
            prev[cur] = 'develop';
            return prev;
        }, {});
    }
    this.vm?.$destroy();
    this.vm = new Vue({
        el: this.$.container,
        data: {
            version: Editor.App.version || 'unknown',
            commit: commitInfo,
            time,
        },
        methods: {
            t(key) {
                return Editor.I18n.t('about.' + key);
            },
        },
    });
};

exports.close = function() { 
    this.vm?.$destroy();
    this.vm = null;
};
