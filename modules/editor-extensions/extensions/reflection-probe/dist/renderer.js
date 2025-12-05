"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scene_message_1 = require("./shared/scene-message");
const vue = require('vue/dist/vue');
vue.config.devtools = false;
vue.config.productionTip = false;
const panelDataMap = new WeakMap();
const Component = vue.extend({
    template: /*html */ `
        <div class="reflectionProbe">
            <div class="main">
                <ui-button v-show="!isBaking" type="primary" @confirm="startBake"><ui-label value="i18n:reflection-probe.panel.start_bake"></ui-label></ui-button>
                <ui-button v-show="isBaking" type="danger" @confirm="stopBake"><ui-label value="i18n:reflection-probe.panel.cancel_bake"></ui-label></ui-button>
                <ui-button type="danger" :disabled="isClearing || isBaking" @confirm="clearResults"><ui-label value="i18n:reflection-probe.panel.clear_result"></ui-label></ui-button>
            </div>
            <ui-progress v-show="isBaking" :value="progress"></ui-progress>
            <div class="footer">
                <div class="output">
                    <div v-for="(item, index) in logInfos" :type="item.type" :key="item.key">
                        <div >{{ item.text }}</div>
                    </div>
                </div>    
            </div>
        </div>
    `,
    computed: {
        progressLog() {
            return Editor.I18n.t('reflection-probe.panel.log.start_bake', {
                currentNum: this.currentNum.toString(),
                totalNum: this.total.toString(),
                nodeName: this.currentInfo?.nodeName || '',
            });
        },
        currentNum() {
            return (this.currentInfo ? 1 : 0) + this.finished.length;
        },
        isBaking() {
            return Boolean(this.remaining.length || this.currentInfo);
        },
        progress() {
            if (this.total) {
                return 100 * this.finished.length / this.total;
            }
            return 0;
        },
        total() {
            return this.finished.length + this.remaining.length + (this.currentInfo ? 1 : 0);
        },
        isFirstBuild() {
            return this.finished.length === 0;
        },
    },
    data: () => {
        return {
            remaining: [],
            finished: [],
            logInfos: [],
            currentInfo: null,
            isClearing: false,
        };
    },
    methods: {
        onClearUpdated(value) {
            this.isClearing = value;
        },
        startBake() {
            this.clearLog();
            scene_message_1.operation('start-bake');
            Editor.Metrics._trackEventWithTimer({
                category: 'bakingSystem',
                id: 'A100014',
                value: 1,
            });
        },
        stopBake() {
            this.log(Editor.I18n.t('reflection-probe.panel.log.start_cancel', { nodeName: this.currentInfo.nodeName }));
            scene_message_1.operation('cancel-bake');
        },
        onBakeStart(info) {
            this.currentInfo = info;
            if (this.total) {
                this.log(this.progressLog);
            }
        },
        onBakeEnd(err, info) {
            if (err === 'cancel') {
                if (this.remaining.length <= 1) {
                    this.log(Editor.I18n.t('reflection-probe.panel.log.cancel_success'));
                }
            }
            else if (err !== null && info) {
                this.error(Editor.I18n.t('reflection-probe.panel.log.bake_error', {
                    nodeName: info.nodeName,
                    err: err.message,
                }));
                console.debug(`Failed to bake reflection probe on the node ${info.nodeName} with error :  ${err.message}`);
                if (err.stack) {
                    console.debug(`Failed to bake reflection probe on the node ${info.nodeName} with stack trace : ${err.stack}`);
                }
            }
            else if (!err) {
                if (info) {
                    this.log(Editor.I18n.t('reflection-probe.panel.log.bake_finished', {
                        nodeName: info.nodeName,
                        currentNum: this.currentNum.toString(),
                        totalNum: this.total.toString(),
                    }));
                }
                // 没有 info 就代表场景一个反射探针都没有直接触发烘焙结束
                if (!info || this.remaining.length == 0) {
                    this.log(Editor.I18n.t('reflection-probe.panel.log.bake_all_finished', { num: this.total.toString() }));
                }
            }
            this.currentInfo = null;
        },
        async clearResults() {
            this.clearLog();
            this.isClearing = true;
            await scene_message_1.operation('clear-results');
        },
        onBakeUpdate(result) {
            this.remaining = result.remaining;
            this.finished = result.finished;
            this.currentInfo = result.currentInfo ?? null;
        },
        log(text) {
            this.logInfos.push({ text, type: 'log', key: performance.now() + Math.random() });
        },
        warning(text) {
            this.logInfos.push({ text, type: 'warning', key: performance.now() + Math.random() });
        },
        error(text) {
            this.logInfos.push({ text, type: 'error', key: performance.now() + Math.random() });
        },
        /** 清空所有日志 */
        clearLog() {
            this.logInfos.splice(0, this.logInfos.length);
        },
    },
});
const methods = {
    onBakeStart(...args) {
        panelDataMap.get(this)?.component.onBakeStart(...args);
    },
    onBakeEnd(...args) {
        panelDataMap.get(this)?.component.onBakeEnd(...args);
    },
    onBakeUpdate(...args) {
        panelDataMap.get(this)?.component.onBakeUpdate(...args);
    },
    onClearUpdated(...args) {
        panelDataMap.get(this)?.component.onClearUpdated(...args);
    },
    async init() {
        if (!panelDataMap.get(this)) {
            const { remaining, finished, currentInfo } = await scene_message_1.query('query-bake-info');
            const isClearing = !!await scene_message_1.query('query-is-clearing');
            const vm = new Component({
                el: this.$.app,
                data: {
                    remaining,
                    finished,
                    currentInfo,
                    isClearing,
                },
            });
            const onBakeStart = (...args) => {
                vm.onBakeStart(...args);
            };
            const onBakeEnd = (...args) => {
                vm.onBakeEnd(...args);
            };
            const onBakeUpdate = (...args) => {
                vm.onBakeUpdate(...args);
            };
            const onClearUpdated = (...args) => {
                vm.onClearUpdated(...args);
            };
            panelDataMap.set(this, {
                component: vm,
                onBakeStart,
                onBakeEnd,
                onBakeUpdate,
                onClearUpdated,
            });
        }
    },
};
module.exports = Editor.Panel.define({
    template: /*html */ `
    <div id="app"></div>
    `,
    $: {
        app: '#app',
    },
    methods,
    style: /*css */ `
        .reflectionProbe {
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100%;
            padding: 30px;
        }

        .main {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .main > ui-button {
            margin-bottom:15px;
            width: 200px;
            border-radius: 4px;
        }

        .footer {
            flex: 1;
            min-height: 120px;
            background-color: var(--color-normal-fill-emphasis);
            overflow: auto;
            margin: 0 14px 14px 14px;
            padding: 7px 14px;
            border-radius: 4px;
            width: 100%;
        }
        
        .output {
            padding-bottom: 20px;
        }

        .output > div[type="error"] {
            color: var(--color-danger-fill-normal);
        }

        .output > div[type="warning"] {
            color: var(--color-warn-fill);
        }

        ui-progress {
            margin: 14px;
        }
    `,
    async ready() {
        const isReady = await Editor.Message.request('scene', 'query-is-ready');
        if (isReady) {
            this.init();
        }
    },
    close() {
        const panelData = panelDataMap.get(this);
        if (panelData) {
            panelData.component.$destroy();
            panelDataMap.delete(this);
        }
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwwREFBMEQ7QUFFMUQsTUFBTSxHQUFHLEdBQWlDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNsRSxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDNUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLE1BQU0sWUFBWSxHQUFHLElBQUksT0FBTyxFQUFrQixDQUFDO0FBQ25ELE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFDekIsUUFBUSxFQUFFLFNBQVMsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7OztLQWdCbEI7SUFDRCxRQUFRLEVBQUU7UUFDTixXQUFXO1lBQ1AsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyx1Q0FBdUMsRUFBRTtnQkFDMUQsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFO2dCQUN0QyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUU7Z0JBQy9CLFFBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLFFBQVEsSUFBSSxFQUFFO2FBQzdDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFDRCxVQUFVO1lBQ04sT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDN0QsQ0FBQztRQUNELFFBQVE7WUFDSixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUNELFFBQVE7WUFDSixJQUFJLElBQUksQ0FBQyxL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RSxDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQy9CLENBQUMsQ0FBQztZQUVGLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFO2dCQUNuQixTQUFTLEVBQUUsRUFBRTtnQkFDYixXQUFXO2dCQUNYLFNBQVM7Z0JBQ1QsWUFBWTtnQkFDWixjQUFjO2FBQ2pCLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztDQUNKLENBQUM7QUFDRixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLFFBQVEsRUFBRSxTQUFTLENBQUE7O0tBRWxCO0lBQ0QsQ0FBQyxFQUFFO1FBQ0MsR0FBRyxFQUFFLE1BQU07S0FDZDtJQUNELE9BQU87SUFDUCxLQUFLLEVBQUUsUUFBUSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQStDZDtJQUNELEtBQUssQ0FBQyxLQUFLO1FBQ1AsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RSxJQUFJLE9BQU8sRUFBRTtZQUNULElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNmO0lBQ0wsQ0FBQztJQUNELEtBQUs7UUFDRCxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLElBQUksU0FBUyxFQUFFO1lBQ1gsU0FBUyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMvQixZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzdCO0lBQ0wsQ0FBQztDQUVKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFF1ZXJ5QmFrZVJlc3VsdCwgUmVmbGVjdGlvblByb2JlQmFrZUluZm8sIFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdCB9IGZyb20gJy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgcXVlcnksIG9wZXJhdGlvbiB9IGZyb20gJy4vc2hhcmVkL3NjZW5lLW1lc3NhZ2UnO1xuXG5jb25zdCB2dWU6IHR5cGVvZiBpbXBvcnQoJ3Z1ZScpLmRlZmF1bHQgPSByZXF1aXJlKCd2dWUvZGlzdC92dWUnKTtcbnZ1ZS5jb25maWcuZGV2dG9vbHMgPSBmYWxzZTtcbnZ1ZS5jb25maWcucHJvZHVjdGlvblRpcCA9IGZhbHNlO1xuY29uc3QgcGFuZWxEYXRhTWFwID0gbmV3IFdlYWtNYXA8YW55LCBQYW5lbERhdGE+KCk7XG5jb25zdCBDb21wb25lbnQgPSB2dWUuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogLypodG1sICovYFxuICAgICAgICA8ZGl2IGNsYXNzPVwicmVmbGVjdGlvblByb2JlXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWFpblwiPlxuICAgICAgICAgICAgICAgIDx1aS1idXR0b24gdi1zaG93PVwiIWlzQmFraW5nXCIgdHlwZT1cInByaW1hcnlcIiBAY29uZmlybT1cInN0YXJ0QmFrZVwiPjx1aS1sYWJlbCB2YWx1ZT1cImkxOG46cmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5zdGFydF9iYWtlXCI+PC91aS1sYWJlbD48L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8dWktYnV0dG9uIHYtc2hvdz1cImlzQmFraW5nXCIgdHlwZT1cImRhbmdlclwiIEBjb25maXJtPVwic3RvcEJha2VcIj48dWktbGFiZWwgdmFsdWU9XCJpMThuOnJlZmxlY3Rpb24tcHJvYmUucGFuZWwuY2FuY2VsX2Jha2VcIj48L3VpLWxhYmVsPjwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDx1aS1idXR0b24gdHlwZT1cImRhbmdlclwiIDpkaXNhYmxlZD1cImlzQ2xlYXJpbmcgfHwgaXNCYWtpbmdcIiBAY29uZmlybT1cImNsZWFyUmVzdWx0c1wiPjx1aS1sYWJlbCB2YWx1ZT1cImkxOG46cmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5jbGVhcl9yZXN1bHRcIj48L3VpLWxhYmVsPjwvdWktYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8dWktcHJvZ3Jlc3Mgdi1zaG93PVwiaXNCYWtpbmdcIiA6dmFsdWU9XCJwcm9ncmVzc1wiPjwvdWktcHJvZ3Jlc3M+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm91dHB1dFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHYtZm9yPVwiKGl0ZW0sIGluZGV4KSBpbiBsb2dJbmZvc1wiIDp0eXBlPVwiaXRlbS50eXBlXCIgOmtleT1cIml0ZW0ua2V5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2ID57eyBpdGVtLnRleHQgfX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+ICAgIFxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgIGAsXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgcHJvZ3Jlc3NMb2coKTogc3RyaW5nIHtcbiAgICAgICAgICAgIHJldHVybiBFZGl0b3IuSTE4bi50KCdyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmxvZy5zdGFydF9iYWtlJywge1xuICAgICAgICAgICAgICAgIGN1cnJlbnROdW06IHRoaXMuY3VycmVudE51bS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHRvdGFsTnVtOiB0aGlzLnRvdGFsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbm9kZU5hbWU6IHRoaXMuY3VycmVudEluZm8/Lm5vZGVOYW1lIHx8ICcnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnROdW0oKTogbnVtYmVyIHtcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5jdXJyZW50SW5mbyA/IDEgOiAwKSArIHRoaXMuZmluaXNoZWQubGVuZ3RoO1xuICAgICAgICB9LFxuICAgICAgICBpc0Jha2luZygpOiBib29sZWFuIHtcbiAgICAgICAgICAgIHJldHVybiBCb29sZWFuKHRoaXMucmVtYWluaW5nLmxlbmd0aCB8fCB0aGlzLmN1cnJlbnRJbmZvKTtcbiAgICAgICAgfSxcbiAgICAgICAgcHJvZ3Jlc3MoKTogbnVtYmVyIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDEwMCAqIHRoaXMuZmluaXNoZWQubGVuZ3RoIC8gdGhpcy50b3RhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9LFxuICAgICAgICB0b3RhbCgpOiBudW1iZXIge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluaXNoZWQubGVuZ3RoICsgdGhpcy5yZW1haW5pbmcubGVuZ3RoICsgKHRoaXMuY3VycmVudEluZm8gPyAxIDogMCk7XG4gICAgICAgIH0sXG4gICAgICAgIGlzRmlyc3RCdWlsZCgpOiBib29sZWFuIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbmlzaGVkLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGRhdGE6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlbWFpbmluZzogW10gYXMgcmVhZG9ubHkgUmVmbGVjdGlvblByb2JlQmFrZUluZm9bXSxcbiAgICAgICAgICAgIGZpbmlzaGVkOiBbXSBhcyByZWFkb25seSBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mb1tdLFxuICAgICAgICAgICAgbG9nSW5mb3M6IFtdIGFzIHsgdGV4dDogc3RyaW5nLCB0eXBlOiAnd2FybmluZycgfCAnZXJyb3InIHwgJ2xvZycsIGtleTogbnVtYmVyIH1bXSxcbiAgICAgICAgICAgIGN1cnJlbnRJbmZvOiBudWxsIGFzIFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvIHwgbnVsbCxcbiAgICAgICAgICAgIGlzQ2xlYXJpbmc6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBvbkNsZWFyVXBkYXRlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgICAgICAgICAgdGhpcy5pc0NsZWFyaW5nID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIHN0YXJ0QmFrZSgpIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJMb2coKTtcbiAgICAgICAgICAgIG9wZXJhdGlvbignc3RhcnQtYmFrZScpO1xuICAgICAgICAgICAgRWRpdG9yLk1ldHJpY3MuX3RyYWNrRXZlbnRXaXRoVGltZXIoe1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnYmFraW5nU3lzdGVtJyxcbiAgICAgICAgICAgICAgICBpZDogJ0ExMDAwMTQnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAxLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3BCYWtlKCkge1xuICAgICAgICAgICAgdGhpcy5sb2coRWRpdG9yLkkxOG4udCgncmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5sb2cuc3RhcnRfY2FuY2VsJywgeyBub2RlTmFtZTogdGhpcy5jdXJyZW50SW5mbyEubm9kZU5hbWUgfSkpO1xuICAgICAgICAgICAgb3BlcmF0aW9uKCdjYW5jZWwtYmFrZScpO1xuICAgICAgICB9LFxuICAgICAgICBvbkJha2VTdGFydChpbmZvOiBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mbykge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5mbyA9IGluZm87XG4gICAgICAgICAgICBpZiAodGhpcy50b3RhbCkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nKHRoaXMucHJvZ3Jlc3NMb2cpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvbkJha2VFbmQoZXJyOiBFcnJvciB8ICdjYW5jZWwnIHwgbnVsbCwgaW5mbz86IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKSB7XG4gICAgICAgICAgICBpZiAoZXJyID09PSAnY2FuY2VsJykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlbWFpbmluZy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZyhFZGl0b3IuSTE4bi50KCdyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmxvZy5jYW5jZWxfc3VjY2VzcycpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVyciAhPT0gbnVsbCAmJiBpbmZvKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvcihFZGl0b3IuSTE4bi50KFxuICAgICAgICAgICAgICAgICAgICAncmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5sb2cuYmFrZV9lcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVOYW1lOiBpbmZvLm5vZGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYEZhaWxlZCB0byBiYWtlIHJlZmxlY3Rpb24gcHJvYmUgb24gdGhlIG5vZGUgJHtpbmZvLm5vZGVOYW1lfSB3aXRoIGVycm9yIDogICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgICAgICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBGYWlsZWQgdG8gYmFrZSByZWZsZWN0aW9uIHByb2JlIG9uIHRoZSBub2RlICR7aW5mby5ub2RlTmFtZX0gd2l0aCBzdGFjayB0cmFjZSA6ICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWVycikge1xuICAgICAgICAgICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nKEVkaXRvci5JMThuLnQoJ3JlZmxlY3Rpb24tcHJvYmUucGFuZWwubG9nLmJha2VfZmluaXNoZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlTmFtZTogaW5mby5ub2RlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROdW06IHRoaXMuY3VycmVudE51bS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxOdW06IHRoaXMudG90YWwudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDmsqHmnIkgaW5mbyDlsLHku6PooajlnLrmma/kuIDkuKrlj43lsITmjqLpkojpg73msqHmnInnm7TmjqXop6blj5Hng5jnhJnnu5PmnZ9cbiAgICAgICAgICAgICAgICBpZiAoIWluZm8gfHwgdGhpcy5yZW1haW5pbmcubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2coRWRpdG9yLkkxOG4udCgncmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5sb2cuYmFrZV9hbGxfZmluaXNoZWQnLCB7IG51bTogdGhpcy50b3RhbC50b1N0cmluZygpIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmZvID0gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgY2xlYXJSZXN1bHRzKCkge1xuICAgICAgICAgICAgdGhpcy5jbGVhckxvZygpO1xuICAgICAgICAgICAgdGhpcy5pc0NsZWFyaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGF3YWl0IG9wZXJhdGlvbignY2xlYXItcmVzdWx0cycpO1xuICAgICAgICB9LFxuICAgICAgICBvbkJha2VVcGRhdGUocmVzdWx0OiBRdWVyeUJha2VSZXN1bHQpIHtcbiAgICAgICAgICAgIHRoaXMucmVtYWluaW5nID0gcmVzdWx0LnJlbWFpbmluZztcbiAgICAgICAgICAgIHRoaXMuZmluaXNoZWQgPSByZXN1bHQuZmluaXNoZWQ7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmZvID0gcmVzdWx0LmN1cnJlbnRJbmZvID8/IG51bGw7XG5cbiAgICAgICAgfSxcbiAgICAgICAgbG9nKHRleHQ6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy5sb2dJbmZvcy5wdXNoKHsgdGV4dCwgdHlwZTogJ2xvZycsIGtleTogcGVyZm9ybWFuY2Uubm93KCkgKyBNYXRoLnJhbmRvbSgpIH0pO1xuICAgICAgICB9LFxuICAgICAgICB3YXJuaW5nKHRleHQ6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy5sb2dJbmZvcy5wdXNoKHsgdGV4dCwgdHlwZTogJ3dhcm5pbmcnLCBrZXk6IHBlcmZvcm1hbmNlLm5vdygpICsgTWF0aC5yYW5kb20oKSB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3IodGV4dDogc3RyaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ0luZm9zLnB1c2goeyB0ZXh0LCB0eXBlOiAnZXJyb3InLCBrZXk6IHBlcmZvcm1hbmNlLm5vdygpICsgTWF0aC5yYW5kb20oKSB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqIOa4heepuuaJgOacieaXpeW/lyAqL1xuICAgICAgICBjbGVhckxvZygpIHtcbiAgICAgICAgICAgIHRoaXMubG9nSW5mb3Muc3BsaWNlKDAsIHRoaXMubG9nSW5mb3MubGVuZ3RoKTtcbiAgICAgICAgfSxcbiAgICB9LFxuXG59KTtcbmludGVyZmFjZSBQYW5lbERhdGEge1xuICAgIGNvbXBvbmVudDogSW5zdGFuY2VUeXBlPHR5cGVvZiBDb21wb25lbnQ+LFxuICAgIG9uQmFrZVN0YXJ0KC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOmJha2Utc3RhcnQnXT4pOiB2b2lkLFxuICAgIG9uQmFrZUVuZCguLi5hcmdzOiBQYXJhbWV0ZXJzPFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdFsncmVmbGVjdGlvbi1wcm9iZTpiYWtlLWVuZCddPik6IHZvaWQsXG4gICAgb25CYWtlVXBkYXRlKC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOnVwZGF0ZS1iYWtlLWluZm8nXT4pOiB2b2lkLFxuICAgIG9uQ2xlYXJVcGRhdGVkKC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOmNsZWFyLWVuZCddPik6IHZvaWQsXG59XG5cbmNvbnN0IG1ldGhvZHM6IE9taXQ8UGFuZWxEYXRhLCAnY29tcG9uZW50Jz4gJiB7IGluaXQ6ICgpID0+IFByb21pc2U8dm9pZD4gfSA9IHtcbiAgICBvbkJha2VTdGFydCguLi5hcmdzKSB7XG4gICAgICAgIHBhbmVsRGF0YU1hcC5nZXQodGhpcyk/LmNvbXBvbmVudC5vbkJha2VTdGFydCguLi5hcmdzKTtcbiAgICB9LFxuXG4gICAgb25CYWtlRW5kKC4uLmFyZ3MpIHtcbiAgICAgICAgcGFuZWxEYXRhTWFwLmdldCh0aGlzKT8uY29tcG9uZW50Lm9uQmFrZUVuZCguLi5hcmdzKTtcbiAgICB9LFxuICAgIG9uQmFrZVVwZGF0ZSguLi5hcmdzKSB7XG4gICAgICAgIHBhbmVsRGF0YU1hcC5nZXQodGhpcyk/LmNvbXBvbmVudC5vbkJha2VVcGRhdGUoLi4uYXJncyk7XG4gICAgfSxcbiAgICBvbkNsZWFyVXBkYXRlZCguLi5hcmdzKSB7XG4gICAgICAgIHBhbmVsRGF0YU1hcC5nZXQodGhpcyk/LmNvbXBvbmVudC5vbkNsZWFyVXBkYXRlZCguLi5hcmdzKTtcbiAgICB9LFxuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGlmICghcGFuZWxEYXRhTWFwLmdldCh0aGlzKSkge1xuICAgICAgICAgICAgY29uc3QgeyByZW1haW5pbmcsIGZpbmlzaGVkLCBjdXJyZW50SW5mbyB9ID0gYXdhaXQgcXVlcnkoJ3F1ZXJ5LWJha2UtaW5mbycpO1xuICAgICAgICAgICAgY29uc3QgaXNDbGVhcmluZyA9ICEhYXdhaXQgcXVlcnkoJ3F1ZXJ5LWlzLWNsZWFyaW5nJyk7XG4gICAgICAgICAgICBjb25zdCB2bSA9IG5ldyBDb21wb25lbnQoe1xuICAgICAgICAgICAgICAgIGVsOiAodGhpcyBhcyBhbnkpLiQuYXBwLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nLFxuICAgICAgICAgICAgICAgICAgICBmaW5pc2hlZCxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEluZm8sXG4gICAgICAgICAgICAgICAgICAgIGlzQ2xlYXJpbmcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBvbkJha2VTdGFydCA9ICguLi5hcmdzOiBQYXJhbWV0ZXJzPFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdFsncmVmbGVjdGlvbi1wcm9iZTpiYWtlLXN0YXJ0J10+KSA9PiB7XG4gICAgICAgICAgICAgICAgdm0ub25CYWtlU3RhcnQoLi4uYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgb25CYWtlRW5kID0gKC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOmJha2UtZW5kJ10+KSA9PiB7XG4gICAgICAgICAgICAgICAgdm0ub25CYWtlRW5kKC4uLmFyZ3MpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IG9uQmFrZVVwZGF0ZSA9ICguLi5hcmdzOiBQYXJhbWV0ZXJzPFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdFsncmVmbGVjdGlvbi1wcm9iZTp1cGRhdGUtYmFrZS1pbmZvJ10+KSA9PiB7XG4gICAgICAgICAgICAgICAgdm0ub25CYWtlVXBkYXRlKC4uLmFyZ3MpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IG9uQ2xlYXJVcGRhdGVkID0gKC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOmNsZWFyLWVuZCddPikgPT4ge1xuICAgICAgICAgICAgICAgIHZtLm9uQ2xlYXJVcGRhdGVkKC4uLmFyZ3MpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcGFuZWxEYXRhTWFwLnNldCh0aGlzLCB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiB2bSxcbiAgICAgICAgICAgICAgICBvbkJha2VTdGFydCxcbiAgICAgICAgICAgICAgICBvbkJha2VFbmQsXG4gICAgICAgICAgICAgICAgb25CYWtlVXBkYXRlLFxuICAgICAgICAgICAgICAgIG9uQ2xlYXJVcGRhdGVkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxufTtcbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yLlBhbmVsLmRlZmluZSh7XG4gICAgdGVtcGxhdGU6IC8qaHRtbCAqL2BcbiAgICA8ZGl2IGlkPVwiYXBwXCI+PC9kaXY+XG4gICAgYCxcbiAgICAkOiB7XG4gICAgICAgIGFwcDogJyNhcHAnLFxuICAgIH0sXG4gICAgbWV0aG9kcyxcbiAgICBzdHlsZTogLypjc3MgKi9gXG4gICAgICAgIC5yZWZsZWN0aW9uUHJvYmUge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgICAgcGFkZGluZzogMzBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5tYWluIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5tYWluID4gdWktYnV0dG9uIHtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206MTVweDtcbiAgICAgICAgICAgIHdpZHRoOiAyMDBweDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5mb290ZXIge1xuICAgICAgICAgICAgZmxleDogMTtcbiAgICAgICAgICAgIG1pbi1oZWlnaHQ6IDEyMHB4O1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tY29sb3Itbm9ybWFsLWZpbGwtZW1waGFzaXMpO1xuICAgICAgICAgICAgb3ZlcmZsb3c6IGF1dG87XG4gICAgICAgICAgICBtYXJnaW46IDAgMTRweCAxNHB4IDE0cHg7XG4gICAgICAgICAgICBwYWRkaW5nOiA3cHggMTRweDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAub3V0cHV0IHtcbiAgICAgICAgICAgIHBhZGRpbmctYm90dG9tOiAyMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLm91dHB1dCA+IGRpdlt0eXBlPVwiZXJyb3JcIl0ge1xuICAgICAgICAgICAgY29sb3I6IHZhcigtLWNvbG9yLWRhbmdlci1maWxsLW5vcm1hbCk7XG4gICAgICAgIH1cblxuICAgICAgICAub3V0cHV0ID4gZGl2W3R5cGU9XCJ3YXJuaW5nXCJdIHtcbiAgICAgICAgICAgIGNvbG9yOiB2YXIoLS1jb2xvci13YXJuLWZpbGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgdWktcHJvZ3Jlc3Mge1xuICAgICAgICAgICAgbWFyZ2luOiAxNHB4O1xuICAgICAgICB9XG4gICAgYCxcbiAgICBhc3luYyByZWFkeSgpIHtcbiAgICAgICAgY29uc3QgaXNSZWFkeSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWlzLXJlYWR5Jyk7XG4gICAgICAgIGlmIChpc1JlYWR5KSB7XG4gICAgICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IHBhbmVsRGF0YSA9IHBhbmVsRGF0YU1hcC5nZXQodGhpcyk7XG4gICAgICAgIGlmIChwYW5lbERhdGEpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5jb21wb25lbnQuJGRlc3Ryb3koKTtcbiAgICAgICAgICAgIHBhbmVsRGF0YU1hcC5kZWxldGUodGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG59KTsiXX0=