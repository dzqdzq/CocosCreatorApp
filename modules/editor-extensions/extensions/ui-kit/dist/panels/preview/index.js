'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.methods = exports.$ = exports.template = exports.style = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;
exports.style = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../dist/preview.css'), 'utf8');
exports.template = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../static', '/template/preview/index.html'), 'utf8');
exports.$ = {
    container: '.settings',
};
exports.methods = {};
async function ready() {
    // @ts-ignore
    panel = this;
    const lastRecord = (await Editor.Profile.getConfig('ui-kit', 'tab')) || 'ui-asset';
    if (!panel) {
        return;
    }
    vm?.$destroy();
    vm = new Vue({
        el: panel.$.container,
        components: {
            'comp-ui-icon': require('./components/ui-icon'),
            'comp-ui-button': require('./components/ui-button'),
            'comp-ui-input': require('./components/ui-input'),
            'comp-ui-checkbox': require('./components/ui-checkbox'),
            'comp-ui-num-input': require('./components/ui-num-input'),
            'comp-ui-slider': require('./components/ui-slider'),
            'comp-ui-select': require('./components/ui-select'),
            'comp-ui-section': require('./components/ui-section'),
            'comp-ui-setting': require('./components/ui-setting'),
            'comp-ui-color-picker': require('./components/ui-color-picker'),
            'comp-ui-color': require('./components/ui-color'),
            'comp-ui-loading': require('./components/ui-loading'),
            'comp-ui-drag-area': require('./components/ui-drag-area'),
            'comp-ui-drag-item': require('./components/ui-drag-item'),
            'comp-ui-drag-object': require('./components/ui-drag-object'),
            'comp-ui-prop': require('./components/ui-prop'),
            'comp-ui-textarea': require('./components/ui-textarea'),
            'comp-ui-markdown': require('./components/ui-markdown'),
            'comp-ui-progress': require('./components/ui-progress'),
            'comp-ui-label': require('./components/ui-label'),
            'comp-ui-code': require('./components/ui-code'),
            'comp-ui-tab': require('./components/ui-tab'),
            'comp-ui-gradient': require('./components/ui-gradient'),
            'comp-ui-gradient-picker': require('./components/ui-gradient-picker'),
            'comp-ui-file': require('./components/ui-file'),
            'comp-ui-asset': require('./components/ui-asset'),
            'comp-ui-node': require('./components/ui-node'),
            'comp-ui-component': require('./components/ui-component'),
            'comp-ui-link': require('./components/ui-link'),
            'comp-ui-image': require('./components/ui-image'),
            'comp-ui-qrcode': require('./components/ui-qrcode'),
            'comp-ui-tree': require('./components/ui-tree'),
            // 'comp-ui-node-graph': require('./components/ui-node-graph'),
            'comp-ui-tooltip': require('./components/ui-tooltip'),
            'comp-ui-curve-editor': require('./components/ui-curve-editor'),
            'comp-ui-curve': require('./components/ui-curve'),
            'comp-ui-grid': require('./components/ui-grid'),
            'comp-ui-scale-plate': require('./components/ui-scale-plate'),
            'comp-dialog': require('./components/dialog'),
        },
        data: {
            groups: {
                Element: [
                    'ui-input',
                    'ui-num-input',
                    'ui-checkbox',
                    'ui-select',
                    'ui-textarea',
                    'ui-slider',
                    'ui-color',
                    'ui-curve',
                    'ui-gradient',
                    'ui-button',
                    'ui-progress',
                    'ui-drag-area',
                    'ui-drag-item',
                    // 'ui-drag-object',
                    'ui-code',
                    'ui-icon',
                    'ui-loading',
                    'ui-label',
                    'ui-markdown',
                    'ui-file',
                    'ui-asset',
                    'ui-node',
                    'ui-component',
                    'ui-link',
                    'ui-image',
                    'ui-qrcode',
                    'ui-tooltip',
                ].sort(),
                Extension: [
                    'ui-tab',
                    'ui-color-picker',
                    'ui-curve-editor',
                    'ui-gradient-picker',
                    'dialog',
                    'ui-setting',
                    'ui-tree',
                    'ui-grid',
                    'ui-scale-plate',
                    // 'ui-node-graph',
                ].sort(),
                Layout: [
                    'ui-prop',
                    'ui-section',
                ].sort(),
            },
            active: 'ui-asset',
        },
        mounted() {
            for (const key in this.groups) {
                const group = this.groups[key];
                if (group.includes(lastRecord)) {
                    this.active = lastRecord;
                }
            }
        },
        methods: {
            change(name) {
                vm.active = name;
                Editor.Profile.setConfig('ui-kit', 'tab', name);
                vm.$refs.content.scrollTop = 0;
            },
        },
    });
}
exports.ready = ready;
function close() {
    panel = null;
    vm?.$destroy();
    vm = null;
}
exports.close = close;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL3ByZXZpZXcvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYiwyQkFBa0M7QUFDbEMsK0JBQTRCO0FBRzVCLE1BQU0sR0FBRyxHQUFtQixPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN2RCxHQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDakMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBRTVCLElBQUksS0FBSyxHQUFRLElBQUksQ0FBQztBQUN0QixJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFFTixRQUFBLEtBQUssR0FBRyxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDJCQUEyQixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFM0UsUUFBQSxRQUFRLEdBQUcsSUFBQSxpQkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSw4QkFBOEIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXBHLFFBQUEsQ0FBQyxHQUFHO0lBQ2IsU0FBUyxFQUFFLFdBQVc7Q0FDekIsQ0FBQztBQUVXLFFBQUEsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUVuQixLQUFLLFVBQVUsS0FBSztJQUN2QixhQUFhO0lBQ2IsS0FBSyxHQUFHLElBQUksQ0FBQztJQUViLE1BQU0sVUFBVSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUM7SUFDbkYsSUFBSSxDQUFDLEtBQUssRUFBQztRQUNQLE9BQU87S0FDVjtJQUVELEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQztJQUNmLEVBQUUsR0FBRyxJQUFJLEdB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QUM7SUFDYixFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUM7SUFDZixFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUpELHNCQUlDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5cbmltcG9ydCB0eXBlIHsgVnVlQ29uc3RydWN0b3IgfSBmcm9tICd2dWUnO1xuY29uc3QgVnVlOiBWdWVDb25zdHJ1Y3RvciA9IHJlcXVpcmUoJ3Z1ZS9kaXN0L3Z1ZS5qcycpO1xuVnVlLmNvbmZpZy5wcm9kdWN0aW9uVGlwID0gZmFsc2U7XG5WdWUuY29uZmlnLmRldnRvb2xzID0gZmFsc2U7XG5cbmxldCBwYW5lbDogYW55ID0gbnVsbDtcbmxldCB2bTogYW55ID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vZGlzdC9wcmV2aWV3LmNzcycpLCAndXRmOCcpO1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMnLCAnL3RlbXBsYXRlL3ByZXZpZXcvaW5kZXguaHRtbCcpLCAndXRmOCcpO1xuXG5leHBvcnQgY29uc3QgJCA9IHtcbiAgICBjb250YWluZXI6ICcuc2V0dGluZ3MnLFxufTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7fTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWR5KCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBwYW5lbCA9IHRoaXM7XG5cbiAgICBjb25zdCBsYXN0UmVjb3JkID0gKGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygndWkta2l0JywgJ3RhYicpKSB8fCAndWktYXNzZXQnO1xuICAgIGlmICghcGFuZWwpe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdm0/LiRkZXN0cm95KCk7XG4gICAgdm0gPSBuZXcgVnVlKHtcbiAgICAgICAgZWw6IHBhbmVsLiQuY29udGFpbmVyLFxuICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICAnY29tcC11aS1pY29uJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWljb24nKSxcbiAgICAgICAgICAgICdjb21wLXVpLWJ1dHRvbic6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1idXR0b24nKSxcbiAgICAgICAgICAgICdjb21wLXVpLWlucHV0JzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWlucHV0JyksXG4gICAgICAgICAgICAnY29tcC11aS1jaGVja2JveCc6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1jaGVja2JveCcpLFxuICAgICAgICAgICAgJ2NvbXAtdWktbnVtLWlucHV0JzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLW51bS1pbnB1dCcpLFxuICAgICAgICAgICAgJ2NvbXAtdWktc2xpZGVyJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLXNsaWRlcicpLFxuICAgICAgICAgICAgJ2NvbXAtdWktc2VsZWN0JzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLXNlbGVjdCcpLFxuICAgICAgICAgICAgJ2NvbXAtdWktc2VjdGlvbic6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1zZWN0aW9uJyksXG4gICAgICAgICAgICAnY29tcC11aS1zZXR0aW5nJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLXNldHRpbmcnKSxcbiAgICAgICAgICAgICdjb21wLXVpLWNvbG9yLXBpY2tlcic6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1jb2xvci1waWNrZXInKSxcbiAgICAgICAgICAgICdjb21wLXVpLWNvbG9yJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWNvbG9yJyksXG4gICAgICAgICAgICAnY29tcC11aS1sb2FkaW5nJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWxvYWRpbmcnKSxcbiAgICAgICAgICAgICdjb21wLXVpLWRyYWctYXJlYSc6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1kcmFnLWFyZWEnKSxcbiAgICAgICAgICAgICdjb21wLXVpLWRyYWctaXRlbSc6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1kcmFnLWl0ZW0nKSxcbiAgICAgICAgICAgICdjb21wLXVpLWRyYWctb2JqZWN0JzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWRyYWctb2JqZWN0JyksXG4gICAgICAgICAgICAnY29tcC11aS1wcm9wJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLXByb3AnKSxcbiAgICAgICAgICAgICdjb21wLXVpLXRleHRhcmVhJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLXRleHRhcmVhJyksXG4gICAgICAgICAgICAnY29tcC11aS1tYXJrZG93bic6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1tYXJrZG93bicpLFxuICAgICAgICAgICAgJ2NvbXAtdWktcHJvZ3Jlc3MnOiByZXF1aXJlKCcuL2NvbXBvbmVudHMvdWktcHJvZ3Jlc3MnKSxcbiAgICAgICAgICAgICdjb21wLXVpLWxhYmVsJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWxhYmVsJyksXG4gICAgICAgICAgICAnY29tcC11aS1jb2RlJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWNvZGUnKSxcbiAgICAgICAgICAgICdjb21wLXVpLXRhYic6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS10YWInKSxcbiAgICAgICAgICAgICdjb21wLXVpLWdyYWRpZW50JzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWdyYWRpZW50JyksXG4gICAgICAgICAgICAnY29tcC11aS1ncmFkaWVudC1waWNrZXInOiByZXF1aXJlKCcuL2NvbXBvbmVudHMvdWktZ3JhZGllbnQtcGlja2VyJyksXG4gICAgICAgICAgICAnY29tcC11aS1maWxlJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWZpbGUnKSxcbiAgICAgICAgICAgICdjb21wLXVpLWFzc2V0JzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWFzc2V0JyksXG4gICAgICAgICAgICAnY29tcC11aS1ub2RlJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLW5vZGUnKSxcbiAgICAgICAgICAgICdjb21wLXVpLWNvbXBvbmVudCc6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1jb21wb25lbnQnKSxcbiAgICAgICAgICAgICdjb21wLXVpLWxpbmsnOiByZXF1aXJlKCcuL2NvbXBvbmVudHMvdWktbGluaycpLFxuICAgICAgICAgICAgJ2NvbXAtdWktaW1hZ2UnOiByZXF1aXJlKCcuL2NvbXBvbmVudHMvdWktaW1hZ2UnKSxcbiAgICAgICAgICAgICdjb21wLXVpLXFyY29kZSc6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1xcmNvZGUnKSxcbiAgICAgICAgICAgICdjb21wLXVpLXRyZWUnOiByZXF1aXJlKCcuL2NvbXBvbmVudHMvdWktdHJlZScpLFxuICAgICAgICAgICAgLy8gJ2NvbXAtdWktbm9kZS1ncmFwaCc6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1ub2RlLWdyYXBoJyksXG4gICAgICAgICAgICAnY29tcC11aS10b29sdGlwJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLXRvb2x0aXAnKSxcbiAgICAgICAgICAgICdjb21wLXVpLWN1cnZlLWVkaXRvcic6IHJlcXVpcmUoJy4vY29tcG9uZW50cy91aS1jdXJ2ZS1lZGl0b3InKSxcbiAgICAgICAgICAgICdjb21wLXVpLWN1cnZlJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWN1cnZlJyksXG4gICAgICAgICAgICAnY29tcC11aS1ncmlkJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLWdyaWQnKSxcbiAgICAgICAgICAgICdjb21wLXVpLXNjYWxlLXBsYXRlJzogcmVxdWlyZSgnLi9jb21wb25lbnRzL3VpLXNjYWxlLXBsYXRlJyksXG5cbiAgICAgICAgICAgICdjb21wLWRpYWxvZyc6IHJlcXVpcmUoJy4vY29tcG9uZW50cy9kaWFsb2cnKSxcbiAgICAgICAgfSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgZ3JvdXBzOiB7XG4gICAgICAgICAgICAgICAgRWxlbWVudDogW1xuICAgICAgICAgICAgICAgICAgICAndWktaW5wdXQnLFxuICAgICAgICAgICAgICAgICAgICAndWktbnVtLWlucHV0JyxcbiAgICAgICAgICAgICAgICAgICAgJ3VpLWNoZWNrYm94JyxcbiAgICAgICAgICAgICAgICAgICAgJ3VpLXNlbGVjdCcsXG4gICAgICAgICAgICAgICAgICAgICd1aS10ZXh0YXJlYScsXG4gICAgICAgICAgICAgICAgICAgICd1aS1zbGlkZXInLFxuICAgICAgICAgICAgICAgICAgICAndWktY29sb3InLFxuICAgICAgICAgICAgICAgICAgICAndWktY3VydmUnLFxuICAgICAgICAgICAgICAgICAgICAndWktZ3JhZGllbnQnLFxuICAgICAgICAgICAgICAgICAgICAndWktYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgJ3VpLXByb2dyZXNzJyxcbiAgICAgICAgICAgICAgICAgICAgJ3VpLWRyYWctYXJlYScsXG4gICAgICAgICAgICAgICAgICAgICd1aS1kcmFnLWl0ZW0nLFxuICAgICAgICAgICAgICAgICAgICAvLyAndWktZHJhZy1vYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAndWktY29kZScsXG4gICAgICAgICAgICAgICAgICAgICd1aS1pY29uJyxcbiAgICAgICAgICAgICAgICAgICAgJ3VpLWxvYWRpbmcnLFxuICAgICAgICAgICAgICAgICAgICAndWktbGFiZWwnLFxuICAgICAgICAgICAgICAgICAgICAndWktbWFya2Rvd24nLFxuICAgICAgICAgICAgICAgICAgICAndWktZmlsZScsXG4gICAgICAgICAgICAgICAgICAgICd1aS1hc3NldCcsXG4gICAgICAgICAgICAgICAgICAgICd1aS1ub2RlJyxcbiAgICAgICAgICAgICAgICAgICAgJ3VpLWNvbXBvbmVudCcsXG4gICAgICAgICAgICAgICAgICAgICd1aS1saW5rJyxcbiAgICAgICAgICAgICAgICAgICAgJ3VpLWltYWdlJyxcbiAgICAgICAgICAgICAgICAgICAgJ3VpLXFyY29kZScsXG4gICAgICAgICAgICAgICAgICAgICd1aS10b29sdGlwJyxcbiAgICAgICAgICAgICAgICBdLnNvcnQoKSxcblxuICAgICAgICAgICAgICAgIEV4dGVuc2lvbjogW1xuICAgICAgICAgICAgICAgICAgICAndWktdGFiJyxcbiAgICAgICAgICAgICAgICAgICAgJ3VpLWNvbG9yLXBpY2tlcicsXG4gICAgICAgICAgICAgICAgICAgICd1aS1jdXJ2ZS1lZGl0b3InLFxuICAgICAgICAgICAgICAgICAgICAndWktZ3JhZGllbnQtcGlja2VyJyxcbiAgICAgICAgICAgICAgICAgICAgJ2RpYWxvZycsXG4gICAgICAgICAgICAgICAgICAgICd1aS1zZXR0aW5nJyxcbiAgICAgICAgICAgICAgICAgICAgJ3VpLXRyZWUnLFxuICAgICAgICAgICAgICAgICAgICAndWktZ3JpZCcsXG4gICAgICAgICAgICAgICAgICAgICd1aS1zY2FsZS1wbGF0ZScsXG4gICAgICAgICAgICAgICAgICAgIC8vICd1aS1ub2RlLWdyYXBoJyxcbiAgICAgICAgICAgICAgICBdLnNvcnQoKSxcblxuICAgICAgICAgICAgICAgIExheW91dDogW1xuICAgICAgICAgICAgICAgICAgICAndWktcHJvcCcsXG4gICAgICAgICAgICAgICAgICAgICd1aS1zZWN0aW9uJyxcbiAgICAgICAgICAgICAgICBdLnNvcnQoKSxcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGFjdGl2ZTogJ3VpLWFzc2V0JyxcbiAgICAgICAgfSxcbiAgICAgICAgbW91bnRlZCgpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuZ3JvdXBzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyb3Vwc1trZXldO1xuICAgICAgICAgICAgICAgIGlmIChncm91cC5pbmNsdWRlcyhsYXN0UmVjb3JkKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IGxhc3RSZWNvcmQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBtZXRob2RzOiA8YW55PntcbiAgICAgICAgICAgIGNoYW5nZShuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB2bS5hY3RpdmUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIEVkaXRvci5Qcm9maWxlLnNldENvbmZpZygndWkta2l0JywgJ3RhYicsIG5hbWUpO1xuXG4gICAgICAgICAgICAgICAgdm0uJHJlZnMuY29udGVudC5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgIHBhbmVsID0gbnVsbDtcbiAgICB2bT8uJGRlc3Ryb3koKTtcbiAgICB2bSA9IG51bGw7XG59XG4iXX0=