'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.methods = exports.$ = exports.style = exports.template = void 0;
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
const defaultPresets = (0, fs_extra_1.readJSONSync)((0, path_1.join)(__dirname, '../../../static/curve-editor/preset.json'));
let panel;
let vm;
const vueTemplate = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/curve-editor/index.html'), 'utf8');
exports.template = `
    <div class="curve-editor"></div>
`;
exports.style = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../curve-editor.css'), 'utf8');
exports.$ = {
    // editor: '.editor', // ui-curve-editor element, will be set in vue mounted hook
    container: '.curve-editor',
};
exports.methods = {
    async reset(param) {
        if (!param) {
            return;
        }
        // @ts-ignore
        panel.option = param;
        if (!param.config) {
            console.warn(`Get config of curve (${param.label}) failed!`);
            param.config = {};
        }
        else {
            Object.assign(param.config, {
                axisMargin: 20,
            });
        }
        if (param.value.multiplier) {
            param.value.keys = patchMultiToKeys(param.value.keys, param.value.multiplier);
            if (param.config.yRange) {
                param.config.yRange = param.config.yRange.map((i) => i * param.value.multiplier);
            }
            else {
                param.config.yRange = [0, 1];
            }
        }
        else {
            param.value.multiplier = 1;
            param.config.yRange = param.config.yRange || [0, 1];
        }
        if (!vm) {
            initVue.call(this, param);
            return;
        }
        // TODO 重新梳理数据更新机制
        vm.value = param.value;
        vm.label = param.label;
        vm.config.showPreWrapMode = !!param.config.showPreWrapMode;
        vm.config.showPostWrapMode = !!param.config.showPostWrapMode;
        param.config.spacingFrame = (await Editor.Profile.getConfig('ui-kit', 'curve-editor.spacingFrame')) || 0.1;
        vm.config.negative = param.config.yRange && param.config.yRange[0] >= 0 ? false : true;
        panel.$.editor.curveCtrl.clear();
        panel.$.editor.config = Object.assign(panel.$.editor.config, param.config);
        panel.$.editor.initCurveCtrl();
        panel.$.editor.value = transValueToCurves(param.value, param.label);
    },
    clear() { },
    // 快捷键
    deleteSelectedKeys() {
        panel.$.editor.curveCtrl && panel.$.editor.curveCtrl.delSelectedKeys();
    },
    copySelectedKeys() {
        panel.$.editor.curveCtrl && panel.$.editor.curveCtrl.copySelectedKeys();
    },
};
function ready() {
    // @ts-ignore
    panel = this;
}
exports.ready = ready;
function close() {
    vm?.$destroy();
    vm = null;
    delete panel.$.editor;
}
exports.close = close;
function initVue(option) {
    let timer = null;
    vm?.$destroy();
    vm = new vue_js_1.default({
        el: panel.$.container,
        directives: {
            set: {
                inserted: function (el, binding, vnode) {
                    const { arg, value } = binding;
                    if (arg) {
                        Reflect.set(el, arg, value);
                    }
                },
                update: function (el, binding, vnode, oldVnode) {
                    const { arg, value } = binding;
                    if (arg) {
                        Reflect.set(el, arg, value);
                    }
                },
            },
        },
        data() {
            return {
                maxValue: {
                    x: 5,
                    y: 5,
                },
                showSettings: false,
                presets: {
                    default: {},
                    custom: {},
                },
                presetConfig: {
                    negative: true,
                    tab: 'default',
                },
                newPreset: {
                    name: '',
                },
                value: option.value,
                config: {
                    showPreWrapMode: (option.config && option.config.showPreWrapMode) || 0,
                    showPostWrapMode: (option.config && option.config.showPostWrapMode) || 0,
                },
                label: option.label,
            };
        },
        methods: {
            onRemovePreset(name) {
                vm.$set(vm.presets.custom, name, null);
                delete vm.presets.custom[name];
                Editor.Profile.setConfig('ui-kit', 'curve-editor.customPresets', vm.presets.custom, 'global');
            },
            showPopup() {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    vm.showSettings = true;
                }, 200);
            },
            hidePopup() {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    vm.showSettings = false;
                }, 200);
            },
            async init() {
                const customPresets = await Editor.Profile.getConfig('ui-kit', 'curve-editor.customPresets');
                if (!vm) {
                    return;
                }
                vm.presets.custom = customPresets || {};
                vm.presets.default = defaultPresets.default.map((keys) => {
                    return {
                        keys,
                    };
                });
                panel.$.editor.clear();
                panel.$.editor.config = Object.assign(panel.$.editor.config, option.config);
                panel.$.editor.initCurveCtrl();
                panel.$.editor.value = transValueToCurves(vm.value, vm.label);
            },
            onCurveSettings(event) {
                event.stopPropagation();
                event.preventDefault();
                const value = parseInt(event.target.value);
                const name = event.target.getAttribute('name');
                switch (name) {
                    case 'postWrapMode':
                    case 'preWrapMode':
                        panel.$.editor.curveCtrl.updateCurveWrapMode(name, value);
                        vm.value[name] = value;
                        panel.$.editor.value = transValueToCurves(vm.value, vm.label);
                        vm.emit('change');
                        vm.emit('confirm');
                        break;
                    case 'spacingFrame':
                        panel.$.editor.curveCtrl.config.spacingFrame = value;
                        break;
                }
            },
            /**
             * 应用某个曲线预设
             * @param event
             */
            async onPreset(event) {
                event.stopPropagation();
                event.preventDefault();
                // @ts-ignore
                const index = event.target.getAttribute('index');
                if (!index) {
                    return;
                }
                const value = vm.presets[vm.presetConfig.tab][index];
                if (!value || !value.keys.length) {
                    return;
                }
                const keys = patchMultiToKeys(JSON.parse(JSON.stringify(value.keys)));
                const outRange = keys.find((item) => item.point.y !==
                    Editor.Utils.Math.clamp(item.point.y, panel.option.config.yRange[0], panel.option.config.yRange[1]));
                if (outRange) {
                    // 弹窗询问的时候，会失去焦点，需要先不能让面板关闭
                    // @ts-ignore
                    Editor.Panel.__protected__.holdKit();
                    const result = await Editor.Dialog.warn(Editor.I18n.t('ui-kit.curve_editor.presetOutRange'), {
                        cancel: 0,
                        buttons: ['cancel', 'confirm'],
                        default: 0,
                    });
                    if (result.response === 0) {
                        return;
                    }
                }
                // 检查一遍配置的取值范围是否符合预期，不符合弹窗提示用户选择
                vm.value.keys = patchMultiToKeys(value.keys);
                panel.$.editor.value = transValueToCurves(vm.value, vm.label);
                vm.emit('change');
                vm.emit('confirm');
            },
            onResetScale() {
                panel.$.editor.curveCtrl.resetScale();
            },
            /**
             * 新增曲线预设
             */
            onNewPreset() {
                vm.$set(vm.presets.custom, vm.newPreset.name, {
                    ...vm.value,
                    keys: unpatchMultiToKeys(vm.value.keys),
                });
                Editor.Profile.setConfig('ui-kit', 'curve-editor.customPresets', vm.presets.custom, 'global').then(() => {
                    this.newPreset.name = '';
                });
            },
            /**
             * curve editor 的数据变化
             * @param type
             * @param value
             */
            emit(type, value) {
                console.debug('emit', type, value);
                value && (vm.value.keys = transCurvesToKeys(value, vm.label));
                const keys = unpatchMultiToKeys(vm.value.keys);
                const outRange = checkValueOutRange(keys, [0, 1], vm.config.yRange);
                if (outRange) {
                    console.debug('[Curve Editor] keys out of range');
                    return;
                }
                const customEvent = new CustomEvent(type, {
                    detail: {
                        value: {
                            ...vm.value,
                            keys,
                        },
                    },
                });
                panel.$.editor.getRootNode().dispatchEvent(customEvent);
            },
            onMulti(event) {
                event.stopPropagation();
                event.preventDefault();
                const value = event.target.value;
                // 相同值或者无效值不作响应
                if (vm.value.multiplier === value || value < 0 || !value) {
                    return;
                }
                // panel.$.editor.curveCtrl.grid.yFormat = function(value: number) {
                //     return parseFloat((value * (vm.value.multiplier || 1) / this.yMaxValue).toFixed(2));
                // };
                const newMulti = value / vm.value.multiplier;
                vm.value.keys = patchMultiToKeys(vm.value.keys, newMulti);
                panel.$.editor.config.yRange = panel.$.editor.config.yRange.map((y) => y * newMulti);
                vm.value.multiplier = value;
                panel.$.editor.initCurveCtrl();
                panel.$.editor.value = transValueToCurves(vm.value, vm.label);
                vm.emit('change');
            },
            onMultiConfirm(event) {
                event.stopPropagation();
                event.preventDefault();
                const value = event.target.value;
                const $target = event.target;
                // 相同值或者无效值不作响应
                if (!value || value <= 0) {
                    requestAnimationFrame(() => {
                        $target.value = panel?.option?.value?.multiplier || 1;
                    });
                    return;
                }
                vm.emit('confirm');
            },
        },
        template: vueTemplate,
    });
    panel.$.editor = vm.$refs.editor;
    vm.init();
}
// 防止意外情况出现数据错误
function checkValueOutRange(keys, xRange, yRange) {
    if (!xRange && !yRange) {
        return false;
    }
    return keys.find((item) => {
        const { x, y } = item.point;
        if ((xRange && typeof xRange[0] === 'number' && x < xRange[0]) || (xRange && typeof xRange[1] === 'number' && x > xRange[1])) {
            return true;
        }
        if ((yRange && typeof yRange[0] === 'number' && y < yRange[0]) || (yRange && typeof yRange[1] === 'number' && y > yRange[1])) {
            return true;
        }
        return false;
    });
}
function patchMultiToKeys(keys, multi) {
    multi = multi || panel.option.value.multiplier || 1;
    return keys.map((key) => {
        return {
            tangentWeightMode: key.tangentWeightMode,
            interpMode: key.interpMode,
            inTangentWeight: key.inTangentWeight * multi,
            outTangentWeight: key.outTangentWeight * multi,
            point: {
                x: key.point.x,
                y: key.point.y * multi,
            },
            inTangent: key.inTangent * multi,
            outTangent: key.inTangent * multi,
        };
    });
}
function unpatchMultiToKeys(keys, multi) {
    multi = multi || panel.option.value.multiplier || 1;
    return keys.map((key) => {
        const res = {
            tangentWeightMode: key.tangentWeightMode,
            interpMode: key.interpMode,
            inTangentWeight: key.inTangentWeight / multi,
            outTangentWeight: key.outTangentWeight / multi,
            point: {
                x: key.point.x,
                y: key.point.y / multi,
            },
            inTangent: key.inTangent / multi,
            outTangent: key.inTangent / multi,
        };
        return res;
    });
}
function transValueToCurves(value, key) {
    return {
        duration: 1,
        wrapMode: 1,
        curveInfos: {
            [key]: {
                preWrapMode: value.preWrapMode,
                postWrapMode: value.postWrapMode,
                keys: value.keys,
                color: 'red',
            },
        },
    };
}
function transCurvesToKeys(curveValue, key) {
    return curveValue.curveInfos[key].keys;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2N1cnZlLWVkaXRvci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7OztBQUViLDJCQUFrQztBQUNsQyx1Q0FBd0M7QUFDeEMsK0JBQTRCO0FBQzVCLDZEQUFrQztBQUVsQyxNQUFNLGNBQWMsR0FBRyxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDBDQUEwQyxDQUFDLENBQUMsQ0FBQztBQXNCakcsSUFBSSxLQUFhLENBQUM7QUFDbEIsSUFBSSxFQUFPLENBQUM7QUFFWixNQUFNLFdBQVcsR0FBRyxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDeEYsUUFBQSxRQUFRLEdBQWM7O0NBRWxDLENBQUM7QUFFVyxRQUFBLEtBQUssR0FBRyxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHdCQUF3QixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFeEUsUUFBQSxDQUFDLEdBQUc7SUFDYixpRkFBaUY7SUFDakYsU0FBUyxFQUFFLGVBQWU7Q0FDN0IsQ0FBQztBQUVXLFFBQUEsT0FBTyxHQUFHO0lBQ25CLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBOEM7UUFDdEQsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNSLE9BQU87U0FDVjtRQUVELGFBQWE7UUFDYixLQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUVyQixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEtBQUssQ0FBQyxLQUFLLFdBQVcsQ0FBQyxDQUFDO1lBQzdELEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1NBQ3JCO2FBQU07WUFDSCxN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QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyByZWFkSlNPTlN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5cbmNvbnN0IGRlZmF1bHRQcmVzZXRzID0gcmVhZEpTT05TeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL2N1cnZlLWVkaXRvci9wcmVzZXQuanNvbicpKTtcblxuLy8gQHRzLWlnbm9yZVxuaW50ZXJmYWNlIElPcHRpb24gZXh0ZW5kcyBFZGl0b3IuUGFuZWwuX2tpdENvbnRyb2wuSU9wdGlvbnMge1xuICAgIGNvbmZpZz86IHtcbiAgICAgICAgLy8gVE9ETyDkuI3lrozmlbTlrprkuYlcbiAgICAgICAgeVJhbmdlOiBudW1iZXJbXTtcbiAgICAgICAgc2hvd1ByZVdyYXBNb2RlOiBib29sZWFuO1xuICAgICAgICBzaG93UG9zdFdyYXBNb2RlOiBib29sZWFuO1xuICAgIH07XG4gICAgdmFsdWU6IGFueTtcbiAgICBsYWJlbDogc3RyaW5nO1xufVxuaW50ZXJmYWNlIElQYW5lbCB7XG4gICAgJDoge1xuICAgICAgICBlZGl0b3I6IGFueTtcbiAgICAgICAgY29udGFpbmVyOiBIVE1MRWxlbWVudDtcbiAgICB9O1xuICAgIG9wdGlvbjogSU9wdGlvbjtcbiAgICB0aW1lc3RhbXA6IG51bWJlcjtcbn1cblxubGV0IHBhbmVsOiBJUGFuZWw7XG5sZXQgdm06IGFueTtcblxuY29uc3QgdnVlVGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvY3VydmUtZWRpdG9yL2luZGV4Lmh0bWwnKSwgJ3V0ZjgnKTtcbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuICAgIDxkaXYgY2xhc3M9XCJjdXJ2ZS1lZGl0b3JcIj48L2Rpdj5cbmA7XG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uL2N1cnZlLWVkaXRvci5jc3MnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0ICQgPSB7XG4gICAgLy8gZWRpdG9yOiAnLmVkaXRvcicsIC8vIHVpLWN1cnZlLWVkaXRvciBlbGVtZW50LCB3aWxsIGJlIHNldCBpbiB2dWUgbW91bnRlZCBob29rXG4gICAgY29udGFpbmVyOiAnLmN1cnZlLWVkaXRvcicsXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICBhc3luYyByZXNldChwYXJhbTogeyB2YWx1ZTogYW55OyBjb25maWc6IGFueTsgbGFiZWw6IGFueSB9KSB7XG4gICAgICAgIGlmICghcGFyYW0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcGFuZWwub3B0aW9uID0gcGFyYW07XG5cbiAgICAgICAgaWYgKCFwYXJhbS5jb25maWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgR2V0IGNvbmZpZyBvZiBjdXJ2ZSAoJHtwYXJhbS5sYWJlbH0pIGZhaWxlZCFgKTtcbiAgICAgICAgICAgIHBhcmFtLmNvbmZpZyA9IHt9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihwYXJhbS5jb25maWcsIHtcbiAgICAgICAgICAgICAgICBheGlzTWFyZ2luOiAyMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJhbS52YWx1ZS5tdWx0aXBsaWVyKSB7XG4gICAgICAgICAgICBwYXJhbS52YWx1ZS5rZXlzID0gcGF0Y2hNdWx0aVRvS2V5cyhwYXJhbS52YWx1ZS5rZXlzLCBwYXJhbS52YWx1ZS5tdWx0aXBsaWVyKTtcbiAgICAgICAgICAgIGlmIChwYXJhbS5jb25maWcueVJhbmdlKSB7XG4gICAgICAgICAgICAgICAgcGFyYW0uY29uZmlnLnlSYW5nZSA9IHBhcmFtLmNvbmZpZy55UmFuZ2UubWFwKChpOiBudW1iZXIpID0+IGkgKiBwYXJhbS52YWx1ZS5tdWx0aXBsaWVyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyYW0uY29uZmlnLnlSYW5nZSA9IFswLCAxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcmFtLnZhbHVlLm11bHRpcGxpZXIgPSAxO1xuICAgICAgICAgICAgcGFyYW0uY29uZmlnLnlSYW5nZSA9IHBhcmFtLmNvbmZpZy55UmFuZ2UgfHwgWzAsIDFdO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdm0pIHtcbiAgICAgICAgICAgIGluaXRWdWUuY2FsbCh0aGlzLCBwYXJhbSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETyDph43mlrDmorPnkIbmlbDmja7mm7TmlrDmnLrliLZcbiAgICAgICAgdm0udmFsdWUgPSBwYXJhbS52YWx1ZTtcbiAgICAgICAgdm0ubGFiZWwgPSBwYXJhbS5sYWJlbDtcbiAgICAgICAgdm0uY29uZmlnLnNob3dQcmVXcmFwTW9kZSA9ICEhcGFyYW0uY29uZmlnLnNob3dQcmVXcmFwTW9kZTtcbiAgICAgICAgdm0uY29uZmlnLnNob3dQb3N0V3JhcE1vZGUgPSAhIXBhcmFtLmNvbmZpZy5zaG93UG9zdFdyYXBNb2RlO1xuICAgICAgICBwYXJhbS5jb25maWcuc3BhY2luZ0ZyYW1lID0gKGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygndWkta2l0JywgJ2N1cnZlLWVkaXRvci5zcGFjaW5nRnJhbWUnKSkgfHwgMC4xO1xuICAgICAgICB2bS5jb25maWcubmVnYXRpdmUgPSBwYXJhbS5jb25maWcueVJhbmdlICYmIHBhcmFtLmNvbmZpZy55UmFuZ2VbMF0gPj0gMCA/IGZhbHNlIDogdHJ1ZTtcblxuICAgICAgICBwYW5lbC4kLmVkaXRvci5jdXJ2ZUN0cmwuY2xlYXIoKTtcbiAgICAgICAgcGFuZWwuJC5lZGl0b3IuY29uZmlnID0gT2JqZWN0LmFzc2lnbihwYW5lbC4kLmVkaXRvci5jb25maWcsIHBhcmFtLmNvbmZpZyk7XG4gICAgICAgIHBhbmVsLiQuZWRpdG9yLmluaXRDdXJ2ZUN0cmwoKTtcbiAgICAgICAgcGFuZWwuJC5lZGl0b3IudmFsdWUgPSB0cmFuc1ZhbHVlVG9DdXJ2ZXMocGFyYW0udmFsdWUsIHBhcmFtLmxhYmVsKTtcbiAgICB9LFxuXG4gICAgY2xlYXIoKSB7fSxcblxuICAgIC8vIOW/q+aNt+mUrlxuICAgIGRlbGV0ZVNlbGVjdGVkS2V5cygpIHtcbiAgICAgICAgcGFuZWwuJC5lZGl0b3IuY3VydmVDdHJsICYmIHBhbmVsLiQuZWRpdG9yLmN1cnZlQ3RybC5kZWxTZWxlY3RlZEtleXMoKTtcbiAgICB9LFxuXG4gICAgY29weVNlbGVjdGVkS2V5cygpIHtcbiAgICAgICAgcGFuZWwuJC5lZGl0b3IuY3VydmVDdHJsICYmIHBhbmVsLiQuZWRpdG9yLmN1cnZlQ3RybC5jb3B5U2VsZWN0ZWRLZXlzKCk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcGFuZWwgPSB0aGlzO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgIHZtPy4kZGVzdHJveSgpO1xuICAgIHZtID0gbnVsbDtcbiAgICBkZWxldGUgcGFuZWwuJC5lZGl0b3I7XG59XG5cbmZ1bmN0aW9uIGluaXRWdWUob3B0aW9uOiBhbnkpIHtcbiAgICBsZXQgdGltZXI6IGFueSA9IG51bGw7XG5cbiAgICB2bT8uJGRlc3Ryb3koKTtcbiAgICB2bSA9IG5ldyBWdWUoe1xuICAgICAgICBlbDogcGFuZWwuJC5jb250YWluZXIsXG4gICAgICAgIGRpcmVjdGl2ZXM6IHtcbiAgICAgICAgICAgIHNldDoge1xuICAgICAgICAgICAgICAgIGluc2VydGVkOiBmdW5jdGlvbihlbCwgYmluZGluZywgdm5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBhcmcsIHZhbHVlIH0gPSBiaW5kaW5nO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBSZWZsZWN0LnNldChlbCwgYXJnLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oZWwsIGJpbmRpbmcsIHZub2RlLCBvbGRWbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGFyZywgdmFsdWUgfSA9IGJpbmRpbmc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlZmxlY3Quc2V0KGVsLCBhcmcsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBkYXRhKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtYXhWYWx1ZToge1xuICAgICAgICAgICAgICAgICAgICB4OiA1LFxuICAgICAgICAgICAgICAgICAgICB5OiA1LFxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBzaG93U2V0dGluZ3M6IGZhbHNlLFxuXG4gICAgICAgICAgICAgICAgcHJlc2V0czoge1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB7fSxcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tOiB7fSxcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgcHJlc2V0Q29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgIG5lZ2F0aXZlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0YWI6ICdkZWZhdWx0JyxcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbmV3UHJlc2V0OiB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICB2YWx1ZTogb3B0aW9uLnZhbHVlLFxuXG4gICAgICAgICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgIHNob3dQcmVXcmFwTW9kZTogKG9wdGlvbi5jb25maWcgJiYgb3B0aW9uLmNvbmZpZy5zaG93UHJlV3JhcE1vZGUpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgIHNob3dQb3N0V3JhcE1vZGU6IChvcHRpb24uY29uZmlnICYmIG9wdGlvbi5jb25maWcuc2hvd1Bvc3RXcmFwTW9kZSkgfHwgMCxcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbGFiZWw6IG9wdGlvbi5sYWJlbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICAgIG9uUmVtb3ZlUHJlc2V0KG5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHZtLiRzZXQodm0ucHJlc2V0cy5jdXN0b20sIG5hbWUsIG51bGwpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB2bS5wcmVzZXRzLmN1c3RvbVtuYW1lXTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuUHJvZmlsZS5zZXRDb25maWcoJ3VpLWtpdCcsICdjdXJ2ZS1lZGl0b3IuY3VzdG9tUHJlc2V0cycsIHZtLnByZXNldHMuY3VzdG9tLCAnZ2xvYmFsJyk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBzaG93UG9wdXAoKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB2bS5zaG93U2V0dGluZ3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBoaWRlUG9wdXAoKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB2bS5zaG93U2V0dGluZ3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21QcmVzZXRzID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKCd1aS1raXQnLCAnY3VydmUtZWRpdG9yLmN1c3RvbVByZXNldHMnKTtcbiAgICAgICAgICAgICAgICBpZiAoIXZtKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgIHZtLnByZXNldHMuY3VzdG9tID0gY3VzdG9tUHJlc2V0cyB8fCB7fTtcbiAgICAgICAgICAgICAgICB2bS5wcmVzZXRzLmRlZmF1bHQgPSBkZWZhdWx0UHJlc2V0cy5kZWZhdWx0Lm1hcCgoa2V5czogYW55W10pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXMsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcGFuZWwuJC5lZGl0b3IuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICBwYW5lbC4kLmVkaXRvci5jb25maWcgPSBPYmplY3QuYXNzaWduKHBhbmVsLiQuZWRpdG9yLmNvbmZpZywgb3B0aW9uLmNvbmZpZyk7XG4gICAgICAgICAgICAgICAgcGFuZWwuJC5lZGl0b3IuaW5pdEN1cnZlQ3RybCgpO1xuICAgICAgICAgICAgICAgIHBhbmVsLiQuZWRpdG9yLnZhbHVlID0gdHJhbnNWYWx1ZVRvQ3VydmVzKHZtLnZhbHVlLCB2bS5sYWJlbCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbkN1cnZlU2V0dGluZ3MoZXZlbnQ6IGFueSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJzZUludChldmVudC50YXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKCduYW1lJyk7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Bvc3RXcmFwTW9kZSc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ByZVdyYXBNb2RlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsLiQuZWRpdG9yLmN1cnZlQ3RybC51cGRhdGVDdXJ2ZVdyYXBNb2RlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZtLnZhbHVlW25hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYW5lbC4kLmVkaXRvci52YWx1ZSA9IHRyYW5zVmFsdWVUb0N1cnZlcyh2bS52YWx1ZSwgdm0ubGFiZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdm0uZW1pdCgnY2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5lbWl0KCdjb25maXJtJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3BhY2luZ0ZyYW1lJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsLiQuZWRpdG9yLmN1cnZlQ3RybC5jb25maWcuc3BhY2luZ0ZyYW1lID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOW6lOeUqOafkOS4quabsue6v+mihOiuvlxuICAgICAgICAgICAgICogQHBhcmFtIGV2ZW50XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFzeW5jIG9uUHJlc2V0KGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKCdpbmRleCcpO1xuICAgICAgICAgICAgICAgIGlmICghaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHZtLnByZXNldHNbdm0ucHJlc2V0Q29uZmlnLnRhYl1baW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmICghdmFsdWUgfHwgIXZhbHVlLmtleXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHBhdGNoTXVsdGlUb0tleXMoSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh2YWx1ZS5rZXlzKSkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dFJhbmdlID0ga2V5cy5maW5kKFxuICAgICAgICAgICAgICAgICAgICAoaXRlbSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucG9pbnQueSAhPT1cbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5VdGlscy5NYXRoLmNsYW1wKGl0ZW0ucG9pbnQueSwgcGFuZWwub3B0aW9uLmNvbmZpZyEueVJhbmdlWzBdLCBwYW5lbC5vcHRpb24uY29uZmlnIS55UmFuZ2VbMV0pLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKG91dFJhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOW8ueeql+ivoumXrueahOaXtuWAme+8jOS8muWkseWOu+eEpueCue+8jOmcgOimgeWFiOS4jeiDveiuqemdouadv+WFs+mXrVxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5QYW5lbC5fX3Byb3RlY3RlZF9fLmhvbGRLaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKEVkaXRvci5JMThuLnQoJ3VpLWtpdC5jdXJ2ZV9lZGl0b3IucHJlc2V0T3V0UmFuZ2UnKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogWydjYW5jZWwnLCAnY29uZmlybSddLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQucmVzcG9uc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6XkuIDpgY3phY3nva7nmoTlj5blgLzojIPlm7TmmK/lkKbnrKblkIjpooTmnJ/vvIzkuI3nrKblkIjlvLnnqpfmj5DnpLrnlKjmiLfpgInmi6lcbiAgICAgICAgICAgICAgICB2bS52YWx1ZS5rZXlzID0gcGF0Y2hNdWx0aVRvS2V5cyh2YWx1ZS5rZXlzKTtcbiAgICAgICAgICAgICAgICBwYW5lbC4kLmVkaXRvci52YWx1ZSA9IHRyYW5zVmFsdWVUb0N1cnZlcyh2bS52YWx1ZSwgdm0ubGFiZWwpO1xuICAgICAgICAgICAgICAgIHZtLmVtaXQoJ2NoYW5nZScpO1xuICAgICAgICAgICAgICAgIHZtLmVtaXQoJ2NvbmZpcm0nKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uUmVzZXRTY2FsZSgpIHtcbiAgICAgICAgICAgICAgICBwYW5lbC4kLmVkaXRvci5jdXJ2ZUN0cmwucmVzZXRTY2FsZSgpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDmlrDlop7mm7Lnur/pooTorr5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25OZXdQcmVzZXQoKSB7XG4gICAgICAgICAgICAgICAgdm0uJHNldCh2bS5wcmVzZXRzLmN1c3RvbSwgdm0ubmV3UHJlc2V0Lm5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgLi4udm0udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGtleXM6IHVucGF0Y2hNdWx0aVRvS2V5cyh2bS52YWx1ZS5rZXlzKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuUHJvZmlsZS5zZXRDb25maWcoJ3VpLWtpdCcsICdjdXJ2ZS1lZGl0b3IuY3VzdG9tUHJlc2V0cycsIHZtLnByZXNldHMuY3VzdG9tLCAnZ2xvYmFsJykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3UHJlc2V0Lm5hbWUgPSAnJztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogY3VydmUgZWRpdG9yIOeahOaVsOaNruWPmOWMllxuICAgICAgICAgICAgICogQHBhcmFtIHR5cGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBlbWl0KHR5cGU6ICdjaGFuZ2UnIHwgJ2NvbmZpcm0nLCB2YWx1ZTogYW55KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnZW1pdCcsIHR5cGUsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSAmJiAodm0udmFsdWUua2V5cyA9IHRyYW5zQ3VydmVzVG9LZXlzKHZhbHVlLCB2bS5sYWJlbCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB1bnBhdGNoTXVsdGlUb0tleXModm0udmFsdWUua2V5cyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0UmFuZ2UgPSBjaGVja1ZhbHVlT3V0UmFuZ2Uoa2V5cywgWzAsIDFdLCB2bS5jb25maWcueVJhbmdlKTtcblxuICAgICAgICAgICAgICAgIGlmIChvdXRSYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdbQ3VydmUgRWRpdG9yXSBrZXlzIG91dCBvZiByYW5nZScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQodHlwZSwge1xuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4udm0udmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcGFuZWwuJC5lZGl0b3IuZ2V0Um9vdE5vZGUoKS5kaXNwYXRjaEV2ZW50KGN1c3RvbUV2ZW50KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uTXVsdGkoZXZlbnQ6IGFueSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGV2ZW50LnRhcmdldC52YWx1ZTtcbiAgICAgICAgICAgICAgICAvLyDnm7jlkIzlgLzmiJbogIXml6DmlYjlgLzkuI3kvZzlk43lupRcbiAgICAgICAgICAgICAgICBpZiAodm0udmFsdWUubXVsdGlwbGllciA9PT0gdmFsdWUgfHwgdmFsdWUgPCAwIHx8ICF2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHBhbmVsLiQuZWRpdG9yLmN1cnZlQ3RybC5ncmlkLnlGb3JtYXQgPSBmdW5jdGlvbih2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBwYXJzZUZsb2F0KCh2YWx1ZSAqICh2bS52YWx1ZS5tdWx0aXBsaWVyIHx8IDEpIC8gdGhpcy55TWF4VmFsdWUpLnRvRml4ZWQoMikpO1xuICAgICAgICAgICAgICAgIC8vIH07XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3TXVsdGkgPSB2YWx1ZSAvIHZtLnZhbHVlLm11bHRpcGxpZXI7XG4gICAgICAgICAgICAgICAgdm0udmFsdWUua2V5cyA9IHBhdGNoTXVsdGlUb0tleXModm0udmFsdWUua2V5cywgbmV3TXVsdGkpO1xuXG4gICAgICAgICAgICAgICAgcGFuZWwuJC5lZGl0b3IuY29uZmlnLnlSYW5nZSA9IHBhbmVsLiQuZWRpdG9yLmNvbmZpZy55UmFuZ2UubWFwKCh5OiBudW1iZXIpID0+IHkgKiBuZXdNdWx0aSk7XG4gICAgICAgICAgICAgICAgdm0udmFsdWUubXVsdGlwbGllciA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHBhbmVsLiQuZWRpdG9yLmluaXRDdXJ2ZUN0cmwoKTtcbiAgICAgICAgICAgICAgICBwYW5lbC4kLmVkaXRvci52YWx1ZSA9IHRyYW5zVmFsdWVUb0N1cnZlcyh2bS52YWx1ZSwgdm0ubGFiZWwpO1xuICAgICAgICAgICAgICAgIHZtLmVtaXQoJ2NoYW5nZScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uTXVsdGlDb25maXJtKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbnN0ICR0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICAgICAgLy8g55u45ZCM5YC85oiW6ICF5peg5pWI5YC85LiN5L2c5ZON5bqUXG4gICAgICAgICAgICAgICAgaWYgKCF2YWx1ZSB8fCB2YWx1ZSA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdGFyZ2V0LnZhbHVlID0gcGFuZWw/Lm9wdGlvbj8udmFsdWU/Lm11bHRpcGxpZXIgfHwgMTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdm0uZW1pdCgnY29uZmlybScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHZ1ZVRlbXBsYXRlLFxuICAgIH0pO1xuXG4gICAgcGFuZWwuJC5lZGl0b3IgPSB2bS4kcmVmcy5lZGl0b3I7XG4gICAgdm0uaW5pdCgpO1xufVxuXG4vLyDpmLLmraLmhI/lpJbmg4XlhrXlh7rnjrDmlbDmja7plJnor69cbmZ1bmN0aW9uIGNoZWNrVmFsdWVPdXRSYW5nZShrZXlzOiBhbnlbXSwgeFJhbmdlPzogbnVtYmVyW10sIHlSYW5nZT86IG51bWJlcltdKSB7XG4gICAgaWYgKCF4UmFuZ2UgJiYgIXlSYW5nZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBrZXlzLmZpbmQoKGl0ZW0pID0+IHtcbiAgICAgICAgY29uc3QgeyB4LCB5IH0gPSBpdGVtLnBvaW50O1xuICAgICAgICBpZiAoKHhSYW5nZSAmJiB0eXBlb2YgeFJhbmdlWzBdID09PSAnbnVtYmVyJyAmJiB4IDwgeFJhbmdlWzBdKSB8fCAoeFJhbmdlICYmIHR5cGVvZiB4UmFuZ2VbMV0gPT09ICdudW1iZXInICYmIHggPiB4UmFuZ2VbMV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHlSYW5nZSAmJiB0eXBlb2YgeVJhbmdlWzBdID09PSAnbnVtYmVyJyAmJiB5IDwgeVJhbmdlWzBdKSB8fCAoeVJhbmdlICYmIHR5cGVvZiB5UmFuZ2VbMV0gPT09ICdudW1iZXInICYmIHkgPiB5UmFuZ2VbMV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBhdGNoTXVsdGlUb0tleXMoa2V5czogYW55W10sIG11bHRpPzogbnVtYmVyKSB7XG4gICAgbXVsdGkgPSBtdWx0aSB8fCBwYW5lbC5vcHRpb24udmFsdWUubXVsdGlwbGllciB8fCAxO1xuICAgIHJldHVybiBrZXlzLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0YW5nZW50V2VpZ2h0TW9kZToga2V5LnRhbmdlbnRXZWlnaHRNb2RlLFxuICAgICAgICAgICAgaW50ZXJwTW9kZToga2V5LmludGVycE1vZGUsXG4gICAgICAgICAgICBpblRhbmdlbnRXZWlnaHQ6IGtleS5pblRhbmdlbnRXZWlnaHQgKiBtdWx0aSEsXG4gICAgICAgICAgICBvdXRUYW5nZW50V2VpZ2h0OiBrZXkub3V0VGFuZ2VudFdlaWdodCAqIG11bHRpISxcbiAgICAgICAgICAgIHBvaW50OiB7XG4gICAgICAgICAgICAgICAgeDoga2V5LnBvaW50LngsXG4gICAgICAgICAgICAgICAgeToga2V5LnBvaW50LnkgKiBtdWx0aSEsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5UYW5nZW50OiBrZXkuaW5UYW5nZW50ICogbXVsdGkhLFxuICAgICAgICAgICAgb3V0VGFuZ2VudDoga2V5LmluVGFuZ2VudCAqIG11bHRpISxcbiAgICAgICAgfTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gdW5wYXRjaE11bHRpVG9LZXlzKGtleXM6IGFueVtdLCBtdWx0aT86IG51bWJlcikge1xuICAgIG11bHRpID0gbXVsdGkgfHwgcGFuZWwub3B0aW9uLnZhbHVlLm11bHRpcGxpZXIgfHwgMTtcbiAgICByZXR1cm4ga2V5cy5tYXAoKGtleSkgPT4ge1xuICAgICAgICBjb25zdCByZXMgPSB7XG4gICAgICAgICAgICB0YW5nZW50V2VpZ2h0TW9kZToga2V5LnRhbmdlbnRXZWlnaHRNb2RlLFxuICAgICAgICAgICAgaW50ZXJwTW9kZToga2V5LmludGVycE1vZGUsXG4gICAgICAgICAgICBpblRhbmdlbnRXZWlnaHQ6IGtleS5pblRhbmdlbnRXZWlnaHQgLyBtdWx0aSEsXG4gICAgICAgICAgICBvdXRUYW5nZW50V2VpZ2h0OiBrZXkub3V0VGFuZ2VudFdlaWdodCAvIG11bHRpISxcbiAgICAgICAgICAgIHBvaW50OiB7XG4gICAgICAgICAgICAgICAgeDoga2V5LnBvaW50LngsXG4gICAgICAgICAgICAgICAgeToga2V5LnBvaW50LnkgLyBtdWx0aSEsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5UYW5nZW50OiBrZXkuaW5UYW5nZW50IC8gbXVsdGkhLFxuICAgICAgICAgICAgb3V0VGFuZ2VudDoga2V5LmluVGFuZ2VudCAvIG11bHRpISxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gdHJhbnNWYWx1ZVRvQ3VydmVzKHZhbHVlOiBhbnksIGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZHVyYXRpb246IDEsXG4gICAgICAgIHdyYXBNb2RlOiAxLFxuICAgICAgICBjdXJ2ZUluZm9zOiB7XG4gICAgICAgICAgICBba2V5XToge1xuICAgICAgICAgICAgICAgIHByZVdyYXBNb2RlOiB2YWx1ZS5wcmVXcmFwTW9kZSxcbiAgICAgICAgICAgICAgICBwb3N0V3JhcE1vZGU6IHZhbHVlLnBvc3RXcmFwTW9kZSxcbiAgICAgICAgICAgICAgICBrZXlzOiB2YWx1ZS5rZXlzLFxuICAgICAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gdHJhbnNDdXJ2ZXNUb0tleXMoY3VydmVWYWx1ZTogYW55LCBrZXk6IHN0cmluZykge1xuICAgIHJldHVybiBjdXJ2ZVZhbHVlLmN1cnZlSW5mb3Nba2V5XS5rZXlzO1xufVxuIl19