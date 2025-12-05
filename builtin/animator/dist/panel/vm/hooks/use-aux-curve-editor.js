"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuxCurveEditor = void 0;
const vue_js_1 = require("vue/dist/vue.js");
const animation_editor_1 = require("../../share/animation-editor");
const grid_ctrl_1 = require("../../share/grid-ctrl");
const ipc_event_1 = require("../../share/ipc-event");
const utils_1 = require("../../utils");
const store_aux_1 = require("./store-aux");
const store_base_1 = require("./store-base");
const store_grid_1 = require("./store-grid");
const use_curve_editor_1 = require("./use-curve-editor");
const DUMP_VALUE_TYPE = 'Float';
const CURVE_COLOR = "#7979D7" /* CurveColor.PURPLE */;
function useAuxCurveEditor(options) {
    const baseStore = (0, store_base_1.useBaseStore)();
    const auxCurveStore = (0, store_aux_1.useAuxCurveStore)();
    const currentClip = options.currentClip ?? (0, vue_js_1.computed)(() => baseStore.currentClip);
    const curveEditorVm = (0, use_curve_editor_1.useCurveEditor)({
        ...options,
        configure: (el) => {
            return animation_editor_1.animationEditor.configureCurveEditor(el);
        },
        uniqueName: 'auxCurve',
    });
    const { curveEditor: curveEl, getElement, paint, sample } = curveEditorVm;
    const lightCurve = (0, vue_js_1.ref)();
    const curveData = (0, vue_js_1.computed)(() => {
        const curves = auxCurveStore.curves;
        const selectedCurve = auxCurveStore.selectedCurve;
        if (curves.length < 1 || selectedCurve == null) {
            return null;
        }
        const data = {
            curveInfos: {},
            duration: 0,
            wrapMode: 0,
        };
        const keys = [];
        for (const keyframe of selectedCurve.keyframes) {
            if (keyframe.curve) {
                keys.push(keyframe.curve);
            }
        }
        data.curveInfos[selectedCurve.displayName] = {
            keys: keys,
            postWrapMode: selectedCurve.postExtrap,
            preWrapMode: selectedCurve.preExtrap,
            color: CURVE_COLOR,
        };
        return data;
    });
    const updateCurrentFrame = (frame) => {
        return animation_editor_1.animationEditor.updateCurrentFrame(frame);
    };
    // TODO: pass in from arguments
    const onCurveOperate = (operate, curveKeyFrames, targetFrame) => {
        // console.debug('curve operate', { operate, curveKeyFrames, targetFrame });
        if (!curveKeyFrames) {
            return;
        }
        switch (operate) {
            case 'select': {
                const selectKeyInfo = {
                    keyframes: [],
                    ctrl: false,
                    offset: 0,
                    offsetFrame: 0,
                    startX: 0,
                };
                for (const keysInfo of curveKeyFrames) {
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keysInfo.keys, DUMP_VALUE_TYPE);
                    const mappedKeys = keys.map((info, index) => {
                        const keyData = {
                            x: keysInfo.keys[index].key.canvas.x - grid_ctrl_1.gridCtrl.grid.xAxisOffset,
                            frame: info.frame,
                            rawFrame: info.frame,
                            key: keysInfo.key,
                        };
                        return keyData;
                    });
                    selectKeyInfo.keyframes.push(...mappedKeys);
                }
                auxCurveStore.selectKeyInfo = selectKeyInfo;
                break;
            }
            // 双击跳转到某个关键帧位置
            case 'db-select': {
                const currentKeys = curveKeyFrames[0].keys;
                const keys = (0, utils_1.transformCtrlKeyToDump)(currentKeys, DUMP_VALUE_TYPE);
                updateCurrentFrame(keys[0].frame);
                break;
            }
            case 'select-curve': {
                lightCurve.value = {
                    name: curveKeyFrames[0].key,
                    color: CURVE_COLOR,
                };
                break;
            }
            case 'select-curve-clip': {
                lightCurve.value = {
                    name: curveKeyFrames[0].key,
                    color: CURVE_COLOR,
                };
                break;
            }
            case 'apply-bezier': {
                // 所有关键帧值的修改
                const curveName = curveKeyFrames[0].key;
                const keys = (0, utils_1.transformCtrlKeyToDump)(curveKeyFrames[0].keys, DUMP_VALUE_TYPE);
                const modifyKeys = keys.map((item) => {
                    return (0, ipc_event_1.modifyAuxCurveOfKey)((0, vue_js_1.unref)(currentClip), curveName, item.frame, {
                        inTangent: item.inTangent,
                        outTangent: item.outTangent,
                        inTangentWeight: item.inTangentWeight,
                        outTangentWeight: item.outTangentWeight,
                        interpMode: item.interpMode,
                        tangentWeightMode: item.tangentWeightMode,
                    });
                });
                (0, ipc_event_1.IApplyOperation)(modifyKeys);
                break;
            }
            case 'scale-keys':
            case 'move-keys': {
                const moveKeys = [];
                const createKeys = [];
                const selectKeyInfo = {
                    keyframes: [],
                    ctrl: false,
                    offset: 0,
                    offsetFrame: 0,
                    startX: 0,
                };
                for (const curveInfo of curveKeyFrames) {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    for (let index = 0; index < keyInfos.length; index++) {
                        const item = keyInfos[index];
                        // 关键帧移动
                        const offsetFrameX = Math.round(item.key.point.x - item.raw.point.x);
                        const keyData = {
                            x: grid_ctrl_1.gridCtrl.grid.valueToPixelH(keys[index].frame) - grid_ctrl_1.gridCtrl.grid.xAxisOffset,
                            frame: keys[index].frame,
                            rawFrame: Math.round(item.raw.point.x),
                            offsetFrame: offsetFrameX,
                            key: curveInfo.key,
                        };
                        selectKeyInfo.keyframes.push(keyData);
                        const offsetFrameY = Math.round(item.key.point.y - item.raw.point.y);
                        if (!offsetFrameX && !offsetFrameY) {
                            continue;
                        }
                        if (offsetFrameX !== 0) {
                            moveKeys.push((0, ipc_event_1.moveAuxKeys)((0, vue_js_1.unref)(currentClip), curveInfo.key, [Math.round(item.raw.point.x)], offsetFrameX));
                        }
                        createKeys.push((0, ipc_event_1.createAuxKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, keys[index].frame, {
                            newValue: item.key.point.y,
                            inTangent: item.key.inTangent,
                            outTangent: item.key.outTangent,
                        }));
                    }
                }
                // 按顺序，先移动，再更新关键帧数据
                (0, ipc_event_1.IApplyOperation)([...moveKeys, ...createKeys]);
                auxCurveStore.selectKeyInfo = selectKeyInfo;
                break;
            }
            case 'tangent': {
                // 所有关键帧值的修改
                const targetProp = curveKeyFrames[0].key;
                const keys = (0, utils_1.transformCtrlKeyToDump)(curveKeyFrames[0].keys, DUMP_VALUE_TYPE);
                const modifyKeys = keys.map((item) => {
                    return (0, ipc_event_1.modifyAuxCurveOfKey)((0, vue_js_1.unref)(currentClip), targetProp, item.frame, {
                        inTangent: item.inTangent,
                        broken: item.broken,
                        outTangent: item.outTangent,
                        inTangentWeight: item.inTangentWeight,
                        outTangentWeight: item.outTangentWeight,
                    });
                });
                (0, ipc_event_1.IApplyOperation)(modifyKeys);
                break;
            }
            // TODO 暂时没有调用，需要场景支持 broken 数据的修改
            case 'change-broken-state': {
                // 所有关键帧值的修改
                const curveName = curveKeyFrames[0].key;
                const keys = (0, utils_1.transformCtrlKeyToDump)(curveKeyFrames[0].keys, DUMP_VALUE_TYPE);
                const modifyKeys = keys.map((item) => {
                    return (0, ipc_event_1.modifyAuxCurveOfKey)((0, vue_js_1.unref)(currentClip), curveName, item.frame, {
                        broken: item.broken,
                    });
                });
                (0, ipc_event_1.IApplyOperation)(modifyKeys);
                break;
            }
            case 'create-keys': {
                // 粘贴接口目前也走新建关键帧处理
                const createKeysTask = [];
                for (const curveInfo of curveKeyFrames) {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    keys.forEach((targetKey, index) => {
                        createKeysTask.push((0, ipc_event_1.createAuxKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, keys[index].frame, {
                            inTangent: targetKey.inTangent,
                            outTangent: targetKey.outTangent,
                            newValue: targetKey.dump.value,
                            interpMode: targetKey.interpMode,
                            tangentWeightMode: targetKey.tangentWeightMode,
                            inTangentWeight: targetKey.inTangentWeight,
                            outTangentWeight: targetKey.outTangentWeight,
                        }));
                    });
                }
                (0, ipc_event_1.IApplyOperation)(createKeysTask);
                break;
            }
            case 'change-interp-mode': {
                // 所有关键帧值的修改
                const modifyCurveOfKeys = [];
                curveKeyFrames.forEach((curveInfo) => {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    modifyCurveOfKeys.push(...keys.map((item) => {
                        return (0, ipc_event_1.modifyAuxCurveOfKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, item.frame, {
                            inTangent: item.inTangent,
                            outTangent: item.outTangent,
                            interpMode: item.interpMode,
                        });
                    }));
                });
                (0, ipc_event_1.IApplyOperation)(modifyCurveOfKeys);
                break;
            }
            case 'change-tangent-weight': {
                // 所有关键帧值的修改
                const modifyCurveOfKeys = [];
                curveKeyFrames.forEach((curveInfo) => {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    modifyCurveOfKeys.push(...keys.map((item) => {
                        return (0, ipc_event_1.modifyAuxCurveOfKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, item.frame, {
                            tangentWeightMode: item.tangentWeightMode,
                            inTangentWeight: item.inTangentWeight,
                            outTangentWeight: item.outTangentWeight,
                        });
                    }));
                });
                (0, ipc_event_1.IApplyOperation)(modifyCurveOfKeys);
                break;
            }
            case 'remove-keys': {
                const removeKeys = [];
                curveKeyFrames.forEach((curveInfo) => {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    removeKeys.push(...keys.map((item) => {
                        return (0, ipc_event_1.removeAuxKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, item.frame);
                    }));
                });
                (0, ipc_event_1.IApplyOperation)(removeKeys);
                auxCurveStore.selectKeyInfo = null;
                break;
            }
            case 'move-curve': {
                const createKeys = [];
                curveKeyFrames.forEach((curveInfo) => {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    // 整条曲线的上下移动：所有关键帧值的修改
                    createKeys.push(...keys.map((item) => {
                        return (0, ipc_event_1.createAuxKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, item.frame, {
                            newValue: item.dump.value,
                        });
                    }));
                });
                (0, ipc_event_1.IApplyOperation)(createKeys);
                break;
            }
            case 'copy': {
                // TODO: 支持多条曲线、多个关键帧的复制
                const srcCurve = curveKeyFrames[0];
                const srcKeyframe = srcCurve.keys[0];
                auxCurveStore.copyKeyframeSnap = {
                    clip: (0, vue_js_1.unref)(currentClip),
                    name: srcCurve.key,
                    frame: srcKeyframe.raw.point.x,
                    curve: {
                        ...srcKeyframe.raw,
                    },
                    dump: {
                        type: DUMP_VALUE_TYPE,
                        value: srcKeyframe.raw.point.y, // 当前帧对应的值
                    },
                };
                break;
            }
        }
    };
    const transformEvent = (0, store_grid_1.useTransformEvent)();
    // 监听其它操作导致 grid 改变时，同步到 curve editor
    transformEvent.onUpdate((key) => {
        if (key === 'aux_curve' || !grid_ctrl_1.gridCtrl.grid) {
            return;
        }
        const el = getElement();
        (0, grid_ctrl_1.syncAxisX)(grid_ctrl_1.gridCtrl.grid, el.curveCtrl.grid);
        paint(curveData.value);
    });
    // 处理 curve editor 发出的 transform 事件
    const onCurveTransform = () => {
        const el = getElement();
        if (grid_ctrl_1.gridCtrl.grid) {
            (0, grid_ctrl_1.syncAxisX)(el.curveCtrl.grid, grid_ctrl_1.gridCtrl.grid);
            transformEvent.emitUpdate('aux_curve');
        }
    };
    // FIXME: 仿照 prop 那边的实现，但不像预期的那样工作。还需要再排查。
    // 粘贴关键帧的 value 并不是复制的 value，而是鼠标位置表示的 value。
    const getCopyKeys = () => {
        const snap = auxCurveStore.copyKeyframeSnap;
        if (snap == null) {
            return [];
        }
        const copyKey = (0, utils_1.transDumpKeyToCurveKey)({
            ...snap.curve,
            frame: snap.frame,
            dump: snap.dump,
        });
        if (copyKey == null) {
            return [];
        }
        const keys = [
            {
                key: {
                    ...copyKey,
                    canvas: {
                        x: snap.frame,
                        y: snap.dump.value,
                    },
                },
                raw: snap.curve,
            },
        ];
        return [
            {
                key: snap.name,
                keys: keys,
            },
        ];
    };
    const configure = (uiCurve) => {
        animation_editor_1.animationEditor.configureCurveEditor(uiCurve);
        uiCurve.curveCtrl.getCopyKeys = getCopyKeys;
        uiCurve.curveCtrl.on('operate', onCurveOperate);
    };
    // 把 clip.sample 同步设置到曲线中
    (0, vue_js_1.watchEffect)(() => {
        sample.value = baseStore.currentSample;
    });
    (0, vue_js_1.watch)(curveData, (newData, oldData, onCleanup) => {
        let skip = false;
        (0, vue_js_1.nextTick)(() => {
            if (skip)
                return;
            paint(newData);
        });
        onCleanup(() => {
            skip = true;
        });
    }, {
        flush: 'post',
    });
    (0, vue_js_1.onMounted)(() => {
        (0, vue_js_1.nextTick)(() => {
            if (!curveEl.value) {
                return;
            }
            // FIXME: mounted 时设置曲线，但由于曲线编辑器默认没有显示，内部部分计算逻辑并不会生效，因此需要在第一次显示时再配置一次。
            // 可见 useCurveEditor 内部实现。
            configure(curveEl.value);
        });
    });
    (0, vue_js_1.onUnmounted)(() => {
        if (curveEl.value) {
            const uiCurve = curveEl.value;
            uiCurve.curveCtrl.off('operate', onCurveOperate);
        }
    });
    return {
        ...curveEditorVm,
        onTransform: onCurveTransform,
        onOperate: onCurveOperate,
    };
}
exports.useAuxCurveEditor = useAuxCurveEditor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlLWF1eC1jdXJ2ZS1lZGl0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zb3VyY2UvcGFuZWwvdm0vaG9va3MvdXNlLWF1eC1jdXJ2ZS1lZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNENBV3lCO0FBY3pCLG1FQUEyRTtBQUUzRSxxREFBNEQ7QUFDNUQscURBTytCO0FBQy9CLHVDQUE2RTtBQUU3RSwyQ0FBK0M7QUFDL0MsNkNBQTRDO0FBQzVDLDZDQUFpRDtBQUNqRCx5REFBdUY7QUFFdkYsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDO0FBQ2hDLE1BQU0sV0FBVyxvQ0FBb0IsQ0FBQztBQU90QyxTQUFnQixpQkFBaUIsQ0FBQyxPQUEyQjtJQUN6RCxNQUFNLFNBQVMsR0FBRyxJQUFBLHlCQUFZLEdBQUUsQ0FBQztJQUNqQyxNQUFNLGFBQWEsR0FBRyxJQUFBLDRCQUFnQixHQUFFLENBQUM7SUFFekMsTUFBTSxXQUFXLEdBQTBCLE9BQU8sQ0FBQyxXQUFXLElBQUksSUFBQSxpQkFBUSxFQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUV4RyxNQUFNLGFBQWEsR0FBRyxJQUFBLGlDQUFjLEVBQUM7UUFDakMsR0FBRyxPQUFPO1FBQ1YsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDZCxPQUFPLGtDQUFlLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUNELFVBQVUsRUFBRSxVQUFVO0tBQ3pCLENBQUMsQ0FBQztJQUNILE1BQU0sRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsYUFBYSxDQUFDO0lBRTFFLE1BQU0sVUFBVSxHQUFHLElBQUEsWUFBRyxHQUFPLENBQUM7SUFFOUIsTUFBTSxTQUFTLEdBQUcsSUFBQSxpQkFBUSxFQUFDLEdBQUcsRUFBRTtR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Q0FBQztBQWxjRCw4Q0FrY0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIGNvbXB1dGVkLFxuICAgIHJlZixcbiAgICB3YXRjaCxcbiAgICBvbk1vdW50ZWQsXG4gICAgb25Vbm1vdW50ZWQsXG4gICAgUmVmLFxuICAgIHVucmVmLFxuICAgIG5leHRUaWNrLFxuICAgIHdhdGNoRWZmZWN0LFxuICAgIHRvUmVmLFxufSBmcm9tICd2dWUvZGlzdC92dWUuanMnO1xuaW1wb3J0IHsgQ3VydmVFZGl0b3IgfSBmcm9tICdAZWRpdG9yL2NyZWF0b3ItdWkta2l0L2Rpc3QvcmVuZGVyZXInO1xuXG5pbXBvcnQge1xuICAgIElQcm9wQ3VydmVEdW1wRGF0YSxcbiAgICBJU2VsZWN0S2V5QmFzZSxcbiAgICBJQ3VydmVLZXlJbmZvcyxcbiAgICBJS2V5ZnJhbWVEYXRhQmFzZSxcbiAgICBJQW5pVk1UaGlzLFxuICAgIElDdXJ2ZVZhbHVlLFxuICAgIElDdXJ2ZUtleWZyYW1lLFxuICAgIE1heWJlUmVmLFxuICAgIElDdHJsS2V5ZnJhbWUsXG59IGZyb20gJy4uLy4uLy4uLy4uL0B0eXBlcy9wcml2YXRlJztcbmltcG9ydCB7IGFuaW1hdGlvbkVkaXRvciwgQ3VydmVDb2xvciB9IGZyb20gJy4uLy4uL3NoYXJlL2FuaW1hdGlvbi1lZGl0b3InO1xuXG5pbXBvcnQgeyBncmlkQ3RybCwgc3luY0F4aXNYIH0gZnJvbSAnLi4vLi4vc2hhcmUvZ3JpZC1jdHJsJztcbmltcG9ydCB7XG4gICAgSUFwcGx5T3BlcmF0aW9uLFxuICAgIGNyZWF0ZUF1eEtleSxcbiAgICBJQW5pbU9wZXJhdGlvbixcbiAgICByZW1vdmVBdXhLZXksXG4gICAgbW92ZUF1eEtleXMsXG4gICAgbW9kaWZ5QXV4Q3VydmVPZktleSxcbn0gZnJvbSAnLi4vLi4vc2hhcmUvaXBjLWV2ZW50JztcbmltcG9ydCB7IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAsIHRyYW5zRHVtcEtleVRvQ3VydmVLZXkgfSBmcm9tICcuLi8uLi91dGlscyc7XG5cbmltcG9ydCB7IHVzZUF1eEN1cnZlU3RvcmUgfSBmcm9tICcuL3N0b3JlLWF1eCc7XG5pbXBvcnQgeyB1c2VCYXNlU3RvcmUgfSBmcm9tICcuL3N0b3JlLWJhc2UnO1xuaW1wb3J0IHsgdXNlVHJhbnNmb3JtRXZlbnQgfSBmcm9tICcuL3N0b3JlLWdyaWQnO1xuaW1wb3J0IHsgdXNlQ3VydmVFZGl0b3IsIEN1cnZlT3BlcmF0ZSwgQ3VydmVPcGVyYXRlSGFuZGxlciB9IGZyb20gJy4vdXNlLWN1cnZlLWVkaXRvcic7XG5cbmNvbnN0IERVTVBfVkFMVUVfVFlQRSA9ICdGbG9hdCc7XG5jb25zdCBDVVJWRV9DT0xPUiA9IEN1cnZlQ29sb3IuUFVSUExFO1xuXG5leHBvcnQgaW50ZXJmYWNlIFVzZUF1eEN1cnZlT3B0aW9ucyB7XG4gICAgc2l6ZTogeyB3aWR0aDogTWF5YmVSZWY8bnVtYmVyPjsgaGVpZ2h0OiBNYXliZVJlZjxudW1iZXI+IH07XG4gICAgY3VycmVudENsaXA/OiBSZWFkb25seTxSZWY8c3RyaW5nPj47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VBdXhDdXJ2ZUVkaXRvcihvcHRpb25zOiBVc2VBdXhDdXJ2ZU9wdGlvbnMpIHtcbiAgICBjb25zdCBiYXNlU3RvcmUgPSB1c2VCYXNlU3RvcmUoKTtcbiAgICBjb25zdCBhdXhDdXJ2ZVN0b3JlID0gdXNlQXV4Q3VydmVTdG9yZSgpO1xuXG4gICAgY29uc3QgY3VycmVudENsaXA6IFJlYWRvbmx5PFJlZjxzdHJpbmc+PiA9IG9wdGlvbnMuY3VycmVudENsaXAgPz8gY29tcHV0ZWQoKCkgPT4gYmFzZVN0b3JlLmN1cnJlbnRDbGlwKTtcblxuICAgIGNvbnN0IGN1cnZlRWRpdG9yVm0gPSB1c2VDdXJ2ZUVkaXRvcih7XG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIGNvbmZpZ3VyZTogKGVsKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYW5pbWF0aW9uRWRpdG9yLmNvbmZpZ3VyZUN1cnZlRWRpdG9yKGVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgdW5pcXVlTmFtZTogJ2F1eEN1cnZlJyxcbiAgICB9KTtcbiAgICBjb25zdCB7IGN1cnZlRWRpdG9yOiBjdXJ2ZUVsLCBnZXRFbGVtZW50LCBwYWludCwgc2FtcGxlIH0gPSBjdXJ2ZUVkaXRvclZtO1xuXG4gICAgY29uc3QgbGlnaHRDdXJ2ZSA9IHJlZjxhbnk+KCk7XG5cbiAgICBjb25zdCBjdXJ2ZURhdGEgPSBjb21wdXRlZCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnZlcyA9IGF1eEN1cnZlU3RvcmUuY3VydmVzO1xuICAgICAgICBjb25zdCBzZWxlY3RlZEN1cnZlID0gYXV4Q3VydmVTdG9yZS5zZWxlY3RlZEN1cnZlO1xuXG4gICAgICAgIGlmIChjdXJ2ZXMubGVuZ3RoIDwgMSB8fCBzZWxlY3RlZEN1cnZlID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0YTogSUN1cnZlVmFsdWUgPSB7XG4gICAgICAgICAgICBjdXJ2ZUluZm9zOiB7fSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiAwLFxuICAgICAgICAgICAgd3JhcE1vZGU6IDAsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qga2V5czogSUN1cnZlS2V5ZnJhbWVbXSA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3Qga2V5ZnJhbWUgb2Ygc2VsZWN0ZWRDdXJ2ZS5rZXlmcmFtZXMpIHtcbiAgICAgICAgICAgIGlmIChrZXlmcmFtZS5jdXJ2ZSkge1xuICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXlmcmFtZS5jdXJ2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLmN1cnZlSW5mb3Nbc2VsZWN0ZWRDdXJ2ZS5kaXNwbGF5TmFtZV0gPSB7XG4gICAgICAgICAgICBrZXlzOiBrZXlzLFxuICAgICAgICAgICAgcG9zdFdyYXBNb2RlOiBzZWxlY3RlZEN1cnZlLnBvc3RFeHRyYXAsXG4gICAgICAgICAgICBwcmVXcmFwTW9kZTogc2VsZWN0ZWRDdXJ2ZS5wcmVFeHRyYXAsXG4gICAgICAgICAgICBjb2xvcjogQ1VSVkVfQ09MT1IsXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSk7XG5cbiAgICBjb25zdCB1cGRhdGVDdXJyZW50RnJhbWUgPSAoZnJhbWU6IG51bWJlcikgPT4ge1xuICAgICAgICByZXR1cm4gYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZUN1cnJlbnRGcmFtZShmcmFtZSk7XG4gICAgfTtcblxuICAgIC8vIFRPRE86IHBhc3MgaW4gZnJvbSBhcmd1bWVudHNcbiAgICBjb25zdCBvbkN1cnZlT3BlcmF0ZTogQ3VydmVPcGVyYXRlSGFuZGxlciA9IChvcGVyYXRlLCBjdXJ2ZUtleUZyYW1lcywgdGFyZ2V0RnJhbWUpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5kZWJ1ZygnY3VydmUgb3BlcmF0ZScsIHsgb3BlcmF0ZSwgY3VydmVLZXlGcmFtZXMsIHRhcmdldEZyYW1lIH0pO1xuICAgICAgICBpZiAoIWN1cnZlS2V5RnJhbWVzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKG9wZXJhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NlbGVjdCc6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWxlY3RLZXlJbmZvOiBJU2VsZWN0S2V5QmFzZSA9IHtcbiAgICAgICAgICAgICAgICAgICAga2V5ZnJhbWVzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgY3RybDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogMCxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0RnJhbWU6IDAsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0WDogMCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5c0luZm8gb2YgY3VydmVLZXlGcmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAoa2V5c0luZm8ua2V5cywgRFVNUF9WQUxVRV9UWVBFKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFwcGVkS2V5cyA9IGtleXMubWFwKChpbmZvLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5RGF0YTogSUtleWZyYW1lRGF0YUJhc2UgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDoga2V5c0luZm8ua2V5c1tpbmRleF0ua2V5LmNhbnZhcy54IC0gZ3JpZEN0cmwuZ3JpZCEueEF4aXNPZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWU6IGluZm8uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmF3RnJhbWU6IGluZm8uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBrZXlzSW5mby5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleURhdGE7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RLZXlJbmZvLmtleWZyYW1lcy5wdXNoKC4uLm1hcHBlZEtleXMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGF1eEN1cnZlU3RvcmUuc2VsZWN0S2V5SW5mbyA9IHNlbGVjdEtleUluZm87XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOWPjOWHu+i3s+i9rOWIsOafkOS4quWFs+mUruW4p+S9jee9rlxuICAgICAgICAgICAgY2FzZSAnZGItc2VsZWN0Jzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRLZXlzID0gY3VydmVLZXlGcmFtZXNbMF0ua2V5cztcbiAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChjdXJyZW50S2V5cywgRFVNUF9WQUxVRV9UWVBFKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVDdXJyZW50RnJhbWUoa2V5c1swXS5mcmFtZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdzZWxlY3QtY3VydmUnOiB7XG4gICAgICAgICAgICAgICAgbGlnaHRDdXJ2ZS52YWx1ZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogY3VydmVLZXlGcmFtZXNbMF0ua2V5LFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogQ1VSVkVfQ09MT1IsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ3NlbGVjdC1jdXJ2ZS1jbGlwJzoge1xuICAgICAgICAgICAgICAgIGxpZ2h0Q3VydmUudmFsdWUgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGN1cnZlS2V5RnJhbWVzWzBdLmtleSxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IENVUlZFX0NPTE9SLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdhcHBseS1iZXppZXInOiB7XG4gICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgY29uc3QgY3VydmVOYW1lID0gY3VydmVLZXlGcmFtZXNbMF0ua2V5O1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGN1cnZlS2V5RnJhbWVzWzBdLmtleXMsIERVTVBfVkFMVUVfVFlQRSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kaWZ5S2V5cyA9IGtleXMhLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kaWZ5QXV4Q3VydmVPZktleSh1bnJlZihjdXJyZW50Q2xpcCksIGN1cnZlTmFtZSwgaXRlbS5mcmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50OiBpdGVtLmluVGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnQ6IGl0ZW0ub3V0VGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudFdlaWdodDogaXRlbS5pblRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRUYW5nZW50V2VpZ2h0OiBpdGVtLm91dFRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnBNb2RlOiBpdGVtLmludGVycE1vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YW5nZW50V2VpZ2h0TW9kZTogaXRlbS50YW5nZW50V2VpZ2h0TW9kZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKG1vZGlmeUtleXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnc2NhbGUta2V5cyc6XG4gICAgICAgICAgICBjYXNlICdtb3ZlLWtleXMnOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbW92ZUtleXM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsZWN0S2V5SW5mbzogSVNlbGVjdEtleUJhc2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIGtleWZyYW1lczogW10sXG4gICAgICAgICAgICAgICAgICAgIGN0cmw6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldEZyYW1lOiAwLFxuICAgICAgICAgICAgICAgICAgICBzdGFydFg6IDAsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGN1cnZlSW5mbyBvZiBjdXJ2ZUtleUZyYW1lcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlJbmZvcyA9IGN1cnZlSW5mby5rZXlzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChrZXlJbmZvcywgRFVNUF9WQUxVRV9UWVBFKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGtleUluZm9zLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IGtleUluZm9zW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWFs+mUruW4p+enu+WKqFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0RnJhbWVYID0gTWF0aC5yb3VuZChpdGVtLmtleS5wb2ludC54IC0gaXRlbS5yYXcucG9pbnQueCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlEYXRhOiBJS2V5ZnJhbWVEYXRhQmFzZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBncmlkQ3RybC5ncmlkIS52YWx1ZVRvUGl4ZWxIKGtleXNbaW5kZXhdLmZyYW1lKSAtIGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lOiBrZXlzW2luZGV4XS5mcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdGcmFtZTogTWF0aC5yb3VuZChpdGVtLnJhdy5wb2ludC54KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXRGcmFtZTogb2Zmc2V0RnJhbWVYLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogY3VydmVJbmZvLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RLZXlJbmZvLmtleWZyYW1lcy5wdXNoKGtleURhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0RnJhbWVZID0gTWF0aC5yb3VuZChpdGVtLmtleS5wb2ludC55IC0gaXRlbS5yYXcucG9pbnQueSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9mZnNldEZyYW1lWCAmJiAhb2Zmc2V0RnJhbWVZKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvZmZzZXRGcmFtZVggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb3ZlS2V5cy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb3ZlQXV4S2V5cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVucmVmKGN1cnJlbnRDbGlwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnZlSW5mby5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbTWF0aC5yb3VuZChpdGVtLnJhdy5wb2ludC54KV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXRGcmFtZVgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUtleXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBdXhLZXkodW5yZWYoY3VycmVudENsaXApLCBjdXJ2ZUluZm8ua2V5LCBrZXlzW2luZGV4XS5mcmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZTogaXRlbS5rZXkucG9pbnQueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50OiBpdGVtLmtleS5pblRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnQ6IGl0ZW0ua2V5Lm91dFRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOaMiemhuuW6j++8jOWFiOenu+WKqO+8jOWGjeabtOaWsOWFs+mUruW4p+aVsOaNrlxuICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihbLi4ubW92ZUtleXMsIC4uLmNyZWF0ZUtleXNdKTtcbiAgICAgICAgICAgICAgICBhdXhDdXJ2ZVN0b3JlLnNlbGVjdEtleUluZm8gPSBzZWxlY3RLZXlJbmZvO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAndGFuZ2VudCc6IHtcbiAgICAgICAgICAgICAgICAvLyDmiYDmnInlhbPplK7luKflgLznmoTkv67mlLlcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRQcm9wID0gY3VydmVLZXlGcmFtZXNbMF0ua2V5O1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGN1cnZlS2V5RnJhbWVzWzBdLmtleXMsIERVTVBfVkFMVUVfVFlQRSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kaWZ5S2V5cyA9IGtleXMubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2RpZnlBdXhDdXJ2ZU9mS2V5KHVucmVmKGN1cnJlbnRDbGlwKSwgdGFyZ2V0UHJvcCwgaXRlbS5mcmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50OiBpdGVtLmluVGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyb2tlbjogaXRlbS5icm9rZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRUYW5nZW50OiBpdGVtLm91dFRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnRXZWlnaHQ6IGl0ZW0uaW5UYW5nZW50V2VpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudFdlaWdodDogaXRlbS5vdXRUYW5nZW50V2VpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihtb2RpZnlLZXlzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE8g5pqC5pe25rKh5pyJ6LCD55So77yM6ZyA6KaB5Zy65pmv5pSv5oyBIGJyb2tlbiDmlbDmja7nmoTkv67mlLlcbiAgICAgICAgICAgIGNhc2UgJ2NoYW5nZS1icm9rZW4tc3RhdGUnOiB7XG4gICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgY29uc3QgY3VydmVOYW1lID0gY3VydmVLZXlGcmFtZXNbMF0ua2V5O1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGN1cnZlS2V5RnJhbWVzWzBdLmtleXMsIERVTVBfVkFMVUVfVFlQRSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kaWZ5S2V5cyA9IGtleXMhLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kaWZ5QXV4Q3VydmVPZktleSh1bnJlZihjdXJyZW50Q2xpcCksIGN1cnZlTmFtZSwgaXRlbS5mcmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJva2VuOiBpdGVtLmJyb2tlbixcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24obW9kaWZ5S2V5cyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdjcmVhdGUta2V5cyc6IHtcbiAgICAgICAgICAgICAgICAvLyDnspjotLTmjqXlj6Pnm67liY3kuZ/otbDmlrDlu7rlhbPplK7luKflpITnkIZcbiAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVLZXlzVGFzazogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY3VydmVJbmZvIG9mIGN1cnZlS2V5RnJhbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleUluZm9zID0gY3VydmVJbmZvLmtleXM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCBEVU1QX1ZBTFVFX1RZUEUpO1xuICAgICAgICAgICAgICAgICAgICBrZXlzLmZvckVhY2goKHRhcmdldEtleSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUtleXNUYXNrLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlQXV4S2V5KHVucmVmKGN1cnJlbnRDbGlwKSwgY3VydmVJbmZvLmtleSwga2V5c1tpbmRleF0uZnJhbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50OiB0YXJnZXRLZXkuaW5UYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRUYW5nZW50OiB0YXJnZXRLZXkub3V0VGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWU6IHRhcmdldEtleS5kdW1wLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnBNb2RlOiB0YXJnZXRLZXkuaW50ZXJwTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFuZ2VudFdlaWdodE1vZGU6IHRhcmdldEtleS50YW5nZW50V2VpZ2h0TW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50V2VpZ2h0OiB0YXJnZXRLZXkuaW5UYW5nZW50V2VpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRUYW5nZW50V2VpZ2h0OiB0YXJnZXRLZXkub3V0VGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24oY3JlYXRlS2V5c1Rhc2spO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnY2hhbmdlLWludGVycC1tb2RlJzoge1xuICAgICAgICAgICAgICAgIC8vIOaJgOacieWFs+mUruW4p+WAvOeahOS/ruaUuVxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmeUN1cnZlT2ZLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgY3VydmVLZXlGcmFtZXMuZm9yRWFjaCgoY3VydmVJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleUluZm9zID0gY3VydmVJbmZvLmtleXM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCBEVU1QX1ZBTFVFX1RZUEUpO1xuICAgICAgICAgICAgICAgICAgICBtb2RpZnlDdXJ2ZU9mS2V5cy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgLi4ua2V5cy5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kaWZ5QXV4Q3VydmVPZktleSh1bnJlZihjdXJyZW50Q2xpcCksIGN1cnZlSW5mby5rZXksIGl0ZW0uZnJhbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50OiBpdGVtLmluVGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudDogaXRlbS5vdXRUYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnBNb2RlOiBpdGVtLmludGVycE1vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihtb2RpZnlDdXJ2ZU9mS2V5cyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdjaGFuZ2UtdGFuZ2VudC13ZWlnaHQnOiB7XG4gICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgY29uc3QgbW9kaWZ5Q3VydmVPZktleXM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgICAgICBjdXJ2ZUtleUZyYW1lcy5mb3JFYWNoKChjdXJ2ZUluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAoa2V5SW5mb3MsIERVTVBfVkFMVUVfVFlQRSk7XG4gICAgICAgICAgICAgICAgICAgIG1vZGlmeUN1cnZlT2ZLZXlzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5rZXlzLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2RpZnlBdXhDdXJ2ZU9mS2V5KHVucmVmKGN1cnJlbnRDbGlwKSwgY3VydmVJbmZvLmtleSwgaXRlbS5mcmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YW5nZW50V2VpZ2h0TW9kZTogaXRlbS50YW5nZW50V2VpZ2h0TW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50V2VpZ2h0OiBpdGVtLmluVGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudFdlaWdodDogaXRlbS5vdXRUYW5nZW50V2VpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKG1vZGlmeUN1cnZlT2ZLZXlzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ3JlbW92ZS1rZXlzJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZUtleXM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgICAgICBjdXJ2ZUtleUZyYW1lcy5mb3JFYWNoKChjdXJ2ZUluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAoa2V5SW5mb3MsIERVTVBfVkFMVUVfVFlQRSk7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUtleXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmtleXMubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbW92ZUF1eEtleSh1bnJlZihjdXJyZW50Q2xpcCksIGN1cnZlSW5mby5rZXksIGl0ZW0uZnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24ocmVtb3ZlS2V5cyk7XG4gICAgICAgICAgICAgICAgYXV4Q3VydmVTdG9yZS5zZWxlY3RLZXlJbmZvID0gbnVsbDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ21vdmUtY3VydmUnOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlS2V5czogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlJbmZvcyA9IGN1cnZlSW5mby5rZXlzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChrZXlJbmZvcywgRFVNUF9WQUxVRV9UWVBFKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5pW05p2h5puy57q/55qE5LiK5LiL56e75Yqo77ya5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZUtleXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmtleXMubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUF1eEtleSh1bnJlZihjdXJyZW50Q2xpcCksIGN1cnZlSW5mby5rZXksIGl0ZW0uZnJhbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWU6IGl0ZW0uZHVtcC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihjcmVhdGVLZXlzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FzZSAnY29weSc6IHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiDmlK/mjIHlpJrmnaHmm7Lnur/jgIHlpJrkuKrlhbPplK7luKfnmoTlpI3liLZcbiAgICAgICAgICAgICAgICBjb25zdCBzcmNDdXJ2ZSA9IGN1cnZlS2V5RnJhbWVzWzBdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNyY0tleWZyYW1lID0gc3JjQ3VydmUua2V5c1swXTtcblxuICAgICAgICAgICAgICAgIGF1eEN1cnZlU3RvcmUuY29weUtleWZyYW1lU25hcCA9IHtcbiAgICAgICAgICAgICAgICAgICAgY2xpcDogdW5yZWYoY3VycmVudENsaXApLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBzcmNDdXJ2ZS5rZXksXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lOiBzcmNLZXlmcmFtZS5yYXcucG9pbnQueCwgLy8g5b2T5YmN5omA5aSE55qE5binXG4gICAgICAgICAgICAgICAgICAgIGN1cnZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5zcmNLZXlmcmFtZS5yYXcsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGR1bXA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IERVTVBfVkFMVUVfVFlQRSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBzcmNLZXlmcmFtZS5yYXcucG9pbnQueSwgLy8g5b2T5YmN5bin5a+55bqU55qE5YC8XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1FdmVudCA9IHVzZVRyYW5zZm9ybUV2ZW50KCk7XG4gICAgLy8g55uR5ZCs5YW25a6D5pON5L2c5a+86Ie0IGdyaWQg5pS55Y+Y5pe277yM5ZCM5q2l5YiwIGN1cnZlIGVkaXRvclxuICAgIHRyYW5zZm9ybUV2ZW50Lm9uVXBkYXRlKChrZXkpID0+IHtcbiAgICAgICAgaWYgKGtleSA9PT0gJ2F1eF9jdXJ2ZScgfHwgIWdyaWRDdHJsLmdyaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVsID0gZ2V0RWxlbWVudCgpO1xuXG4gICAgICAgIHN5bmNBeGlzWChncmlkQ3RybC5ncmlkLCBlbC5jdXJ2ZUN0cmwuZ3JpZCk7XG5cbiAgICAgICAgcGFpbnQoY3VydmVEYXRhLnZhbHVlKTtcbiAgICB9KTtcblxuICAgIC8vIOWkhOeQhiBjdXJ2ZSBlZGl0b3Ig5Y+R5Ye655qEIHRyYW5zZm9ybSDkuovku7ZcbiAgICBjb25zdCBvbkN1cnZlVHJhbnNmb3JtID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBlbCA9IGdldEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKGdyaWRDdHJsLmdyaWQpIHtcbiAgICAgICAgICAgIHN5bmNBeGlzWChlbC5jdXJ2ZUN0cmwuZ3JpZCwgZ3JpZEN0cmwuZ3JpZCk7XG5cbiAgICAgICAgICAgIHRyYW5zZm9ybUV2ZW50LmVtaXRVcGRhdGUoJ2F1eF9jdXJ2ZScpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIEZJWE1FOiDku7/nhacgcHJvcCDpgqPovrnnmoTlrp7njrDvvIzkvYbkuI3lg4/pooTmnJ/nmoTpgqPmoLflt6XkvZzjgILov5jpnIDopoHlho3mjpLmn6XjgIJcbiAgICAvLyDnspjotLTlhbPplK7luKfnmoQgdmFsdWUg5bm25LiN5piv5aSN5Yi255qEIHZhbHVl77yM6ICM5piv6byg5qCH5L2N572u6KGo56S655qEIHZhbHVl44CCXG4gICAgY29uc3QgZ2V0Q29weUtleXMgPSAoKTogSUN1cnZlS2V5SW5mb3NbXSA9PiB7XG4gICAgICAgIGNvbnN0IHNuYXAgPSBhdXhDdXJ2ZVN0b3JlLmNvcHlLZXlmcmFtZVNuYXA7XG4gICAgICAgIGlmIChzbmFwID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvcHlLZXkgPSB0cmFuc0R1bXBLZXlUb0N1cnZlS2V5KHtcbiAgICAgICAgICAgIC4uLnNuYXAuY3VydmUsXG4gICAgICAgICAgICBmcmFtZTogc25hcC5mcmFtZSxcbiAgICAgICAgICAgIGR1bXA6IHNuYXAuZHVtcCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGNvcHlLZXkgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qga2V5czogSUN0cmxLZXlmcmFtZVtdID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGtleToge1xuICAgICAgICAgICAgICAgICAgICAuLi5jb3B5S2V5LFxuICAgICAgICAgICAgICAgICAgICBjYW52YXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHNuYXAuZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBzbmFwLmR1bXAudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByYXc6IHNuYXAuY3VydmUsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xuXG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAga2V5OiBzbmFwLm5hbWUsXG4gICAgICAgICAgICAgICAga2V5czoga2V5cyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF07XG4gICAgfTtcblxuICAgIGNvbnN0IGNvbmZpZ3VyZSA9ICh1aUN1cnZlOiBFZGl0b3IuVUkuSFRNTEN1c3RvbUVsZW1lbnQpID0+IHtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNvbmZpZ3VyZUN1cnZlRWRpdG9yKHVpQ3VydmUpO1xuXG4gICAgICAgIHVpQ3VydmUuY3VydmVDdHJsLmdldENvcHlLZXlzID0gZ2V0Q29weUtleXM7XG5cbiAgICAgICAgdWlDdXJ2ZS5jdXJ2ZUN0cmwub24oJ29wZXJhdGUnLCBvbkN1cnZlT3BlcmF0ZSk7XG4gICAgfTtcblxuICAgIC8vIOaKiiBjbGlwLnNhbXBsZSDlkIzmraXorr7nva7liLDmm7Lnur/kuK1cbiAgICB3YXRjaEVmZmVjdCgoKSA9PiB7XG4gICAgICAgIHNhbXBsZS52YWx1ZSA9IGJhc2VTdG9yZS5jdXJyZW50U2FtcGxlO1xuICAgIH0pO1xuXG4gICAgd2F0Y2goXG4gICAgICAgIGN1cnZlRGF0YSxcbiAgICAgICAgKG5ld0RhdGEsIG9sZERhdGEsIG9uQ2xlYW51cCkgPT4ge1xuICAgICAgICAgICAgbGV0IHNraXAgPSBmYWxzZTtcblxuICAgICAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChza2lwKSByZXR1cm47XG4gICAgICAgICAgICAgICAgcGFpbnQobmV3RGF0YSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgb25DbGVhbnVwKCgpID0+IHtcbiAgICAgICAgICAgICAgICBza2lwID0gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBmbHVzaDogJ3Bvc3QnLFxuICAgICAgICB9LFxuICAgICk7XG5cbiAgICBvbk1vdW50ZWQoKCkgPT4ge1xuICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWN1cnZlRWwudmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZJWE1FOiBtb3VudGVkIOaXtuiuvue9ruabsue6v++8jOS9hueUseS6juabsue6v+e8lui+keWZqOm7mOiupOayoeacieaYvuekuu+8jOWGhemDqOmDqOWIhuiuoeeul+mAu+i+keW5tuS4jeS8mueUn+aViO+8jOWboOatpOmcgOimgeWcqOesrOS4gOasoeaYvuekuuaXtuWGjemFjee9ruS4gOasoeOAglxuICAgICAgICAgICAgLy8g5Y+v6KeBIHVzZUN1cnZlRWRpdG9yIOWGhemDqOWunueOsOOAglxuICAgICAgICAgICAgY29uZmlndXJlKGN1cnZlRWwudmFsdWUpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIG9uVW5tb3VudGVkKCgpID0+IHtcbiAgICAgICAgaWYgKGN1cnZlRWwudmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHVpQ3VydmUgPSBjdXJ2ZUVsLnZhbHVlO1xuXG4gICAgICAgICAgICB1aUN1cnZlLmN1cnZlQ3RybC5vZmYoJ29wZXJhdGUnLCBvbkN1cnZlT3BlcmF0ZSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIC4uLmN1cnZlRWRpdG9yVm0sXG5cbiAgICAgICAgb25UcmFuc2Zvcm06IG9uQ3VydmVUcmFuc2Zvcm0sXG4gICAgICAgIG9uT3BlcmF0ZTogb25DdXJ2ZU9wZXJhdGUsXG4gICAgfTtcbn1cbiJdfQ==