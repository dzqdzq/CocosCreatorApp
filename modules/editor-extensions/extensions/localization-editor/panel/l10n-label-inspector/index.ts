import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { App, createApp } from 'vue';
import { wrapper } from 'Wrapper';
import { eventBus } from 'EventBus';
import MainApp from './component/inspector-app.vue';
import { commonCss } from '../share/scripts/common-style';

export { wrapper, eventBus };
const weakMap = new WeakMap<any, App<Element>>();

module.exports = Editor.Panel.define({
    template: `
      <div id="app"></div>
    `,
    $: {
        app: '#app',
    },
    ready() {
        const app = createApp(MainApp, {});
        const element = this.$.app;
        app.mount(element);
        weakMap.set(this, app);
    },
    style: readFileSync(join(__dirname, './index.css'), { encoding: 'utf8' }) + commonCss,

    update(dump) {
        console.debug('update dump', dump);
        eventBus.emit('onDumpUpdated', dump);
    },
    close() {
        const app = weakMap.get(this);
        if (app) {
            app.unmount();
        }
    },
});
