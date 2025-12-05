import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { createApp } from 'vue';
import { eventBus } from 'EventBus';
import MainApp from './components/build-app.vue';
import { commonCss } from '../share/scripts/common-style';
import type { ITaskOptions } from '../../src/builder/ITaskOptions';
import type { IEventBusEventMap } from '../../src/core/service/util/IEventMap';

const weakMap = new WeakMap<any, { app: InstanceType<typeof MainApp>, onChangeBuilderOptions: IEventBusEventMap['changeBuilderOptions'] }>();
export { builder } from 'Builder';
export { wrapper } from 'Wrapper';
export { eventBus };

module.exports = Editor.Panel.define({
    $: { app: '#app' },
    template: '<div id="app"></div>',
    ready(options: ITaskOptions, type: string, pkgName: string, errorMap: any) {
        const onChangeBuilderOptions: IEventBusEventMap['changeBuilderOptions'] = (key, value, isError) => {
            this.dispatch('update', key, value, isError);
        };
        if (this.$.app) {
            const app = createApp(MainApp);
            app.mount(this.$.app);
            weakMap.set(this, {
                app,
                onChangeBuilderOptions,
            });
            eventBus.emit('onBuilderUpdated', options);
        }
        eventBus.on('changeBuilderOptions', onChangeBuilderOptions);
    },
    style: readFileSync(join(__dirname, './index.css'), { encoding: 'utf8' }) + commonCss,
    update(options: ITaskOptions, key: string) {
        eventBus.emit('onBuilderUpdated', options, key);
    },
    close() {
        const data = weakMap.get(this);
        if (data) {
            data.app?.unmount();
            eventBus.off('changeBuilderOptions', data.onChangeBuilderOptions);
        }
    },
});
