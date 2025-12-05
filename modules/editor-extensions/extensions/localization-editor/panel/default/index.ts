import { readFileSync, readJsonSync } from 'fs-extra';
import { join } from 'path';
import { createApp } from 'vue';
import { eventBus } from 'EventBus';
import { WrapperTranslateItem, wrapper } from 'Wrapper';
import { commonCss } from '../share/scripts/common-style';
import MainApp from './component/default-app.vue';
import type { IPluralRulesJson } from '../../@types/po';

export { PanelTranslateData } from '../share/scripts/PanelTranslateData';
export { wrapper, eventBus, WrapperTranslateItem };
export const pluralRules: IPluralRulesJson = readJsonSync(join(__dirname, '../../static/plural-rules/plural-rules.json'), { 'encoding': 'utf8' });

const weakMap = new WeakMap<any, InstanceType<typeof MainApp>>();
module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: '<div id="app"></div>',
    style: readFileSync(join(__dirname, './index.css'), { encoding: 'utf8' }) + commonCss,
    $: {
        app: '#app',
    },
    ready() {
        // 使用 data
        if (this.$.app) {
            const app = createApp(MainApp);
            app.mount(this.$.app);
            weakMap.set(this, app);
        }
    },
    methods: {
        executePanelMethod(method: string, ...args: any[]) {
            //@ts-ignore
            eventBus.emit(method, ...args);
        },
    },
    beforeClose() { },
    close() {
        const app = weakMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});
