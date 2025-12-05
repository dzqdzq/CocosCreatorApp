'use strict';

const Vue = require('vue/dist/vue.js');

Vue.config.productionTip = false;
Vue.config.devtools = false;

const tester = require('./tester');

const { join } = require('path');
const { readFileSync } = require('fs');

module.exports = {

    template: readFileSync(join(__dirname, './index.html'), 'utf8'),

    style: readFileSync(join(__dirname, './index.css'), 'utf8'),

    $: {
        tester: '.tester',
    },

    listeners: {},

    methods: {
        '*'(message, ...args) {
            tester.Ipc._receive(message, ...args);
        },
    },

    ready() {
        const home = require('./components/home');
        this.vm?.$destroy();
        this.vm = new Vue({
            el: this.$.tester,
            data: home.data(),
            watch: home.watch,
            mounted: home.mounted,
            methods: home.methods,
        });
    },

    close() {
        this.vm?.$destroy();
        delete this.vm;
    },
};
