"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scene_message_1 = require("./shared/scene-message");
const vue = require('vue/dist/vue.js');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwwREFBMEQ7QUFFMUQsTUFBTSxHQUFHLEdBQWlDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3JFLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUM1QixHQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDakMsTUFBTSxZQUFZLEdBQUcsSUFBSSxPQUFPLEVBQWtCLENBQUM7QUFDbkQsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUN6QixRQUFRLEVBQUUsU0FBUyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0tBZ0JsQjtJQUNELFFBQVEsRUFBRTtRQUNOLFdBQVc7WUFDUCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLHVDQUF1QyxFQUFFO2dCQUMxRCxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUU7Z0JBQ3RDLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtnQkFDL0IsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxJQUFJLEVBQUU7YUFDN0MsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUNELFVBQVU7WUFDTixPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUM3RCxDQUFDO1FBQ0QsUUFBUTtZQUNKLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ0QsUUFBUTtZQUNKLElBQUksSUFBSSxDQUFD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QUFFLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDL0IsQ0FBQyxDQUFDO1lBRUYsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUU7Z0JBQ25CLFNBQVMsRUFBRSxFQUFFO2dCQUNiLFdBQVc7Z0JBQ1gsU0FBUztnQkFDVCxZQUFZO2dCQUNaLGNBQWM7YUFDakIsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDO0NBQ0osQ0FBQztBQUNGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDakMsUUFBUSxFQUFFLFNBQVMsQ0FBQTs7S0FFbEI7SUFDRCxDQUFDLEVBQUU7UUFDQyxHQUFHLEVBQUUsTUFBTTtLQUNkO0lBQ0QsT0FBTztJQUNQLEtBQUssRUFBRSxRQUFRLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBK0NkO0lBQ0QsS0FBSyxDQUFDLEtBQUs7UUFDUCxNQUFNLE9BQU8sR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3hFLElBQUksT0FBTyxFQUFFO1lBQ1QsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2Y7SUFDTCxDQUFDO0lBQ0QsS0FBSztRQUNELE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekMsSUFBSSxTQUFTLEVBQUU7WUFDWCxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQy9CLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDN0I7SUFDTCxDQUFDO0NBRUosQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUXVlcnlCYWtlUmVzdWx0LCBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mbywgUmVmbGVjdGlvblByb2JlQnJvYWRjYXN0IH0gZnJvbSAnLi4vQHR5cGVzL3Byb3RlY3RlZCc7XG5pbXBvcnQgeyBxdWVyeSwgb3BlcmF0aW9uIH0gZnJvbSAnLi9zaGFyZWQvc2NlbmUtbWVzc2FnZSc7XG5cbmNvbnN0IHZ1ZTogdHlwZW9mIGltcG9ydCgndnVlJykuZGVmYXVsdCA9IHJlcXVpcmUoJ3Z1ZS9kaXN0L3Z1ZS5qcycpO1xudnVlLmNvbmZpZy5kZXZ0b29scyA9IGZhbHNlO1xudnVlLmNvbmZpZy5wcm9kdWN0aW9uVGlwID0gZmFsc2U7XG5jb25zdCBwYW5lbERhdGFNYXAgPSBuZXcgV2Vha01hcDxhbnksIFBhbmVsRGF0YT4oKTtcbmNvbnN0IENvbXBvbmVudCA9IHZ1ZS5leHRlbmQoe1xuICAgIHRlbXBsYXRlOiAvKmh0bWwgKi9gXG4gICAgICAgIDxkaXYgY2xhc3M9XCJyZWZsZWN0aW9uUHJvYmVcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtYWluXCI+XG4gICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiB2LXNob3c9XCIhaXNCYWtpbmdcIiB0eXBlPVwicHJpbWFyeVwiIEBjb25maXJtPVwic3RhcnRCYWtlXCI+PHVpLWxhYmVsIHZhbHVlPVwiaTE4bjpyZWZsZWN0aW9uLXByb2JlLnBhbmVsLnN0YXJ0X2Jha2VcIj48L3VpLWxhYmVsPjwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDx1aS1idXR0b24gdi1zaG93PVwiaXNCYWtpbmdcIiB0eXBlPVwiZGFuZ2VyXCIgQGNvbmZpcm09XCJzdG9wQmFrZVwiPjx1aS1sYWJlbCB2YWx1ZT1cImkxOG46cmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5jYW5jZWxfYmFrZVwiPjwvdWktbGFiZWw+PC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiB0eXBlPVwiZGFuZ2VyXCIgOmRpc2FibGVkPVwiaXNDbGVhcmluZyB8fCBpc0Jha2luZ1wiIEBjb25maXJtPVwiY2xlYXJSZXN1bHRzXCI+PHVpLWxhYmVsIHZhbHVlPVwiaTE4bjpyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmNsZWFyX3Jlc3VsdFwiPjwvdWktbGFiZWw+PC91aS1idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDx1aS1wcm9ncmVzcyB2LXNob3c9XCJpc0Jha2luZ1wiIDp2YWx1ZT1cInByb2dyZXNzXCI+PC91aS1wcm9ncmVzcz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwib3V0cHV0XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgdi1mb3I9XCIoaXRlbSwgaW5kZXgpIGluIGxvZ0luZm9zXCIgOnR5cGU9XCJpdGVtLnR5cGVcIiA6a2V5PVwiaXRlbS5rZXlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgPnt7IGl0ZW0udGV4dCB9fTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgYCxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICBwcm9ncmVzc0xvZygpOiBzdHJpbmcge1xuICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5JMThuLnQoJ3JlZmxlY3Rpb24tcHJvYmUucGFuZWwubG9nLnN0YXJ0X2Jha2UnLCB7XG4gICAgICAgICAgICAgICAgY3VycmVudE51bTogdGhpcy5jdXJyZW50TnVtLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdG90YWxOdW06IHRoaXMudG90YWwudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBub2RlTmFtZTogdGhpcy5jdXJyZW50SW5mbz8ubm9kZU5hbWUgfHwgJycsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgY3VycmVudE51bSgpOiBudW1iZXIge1xuICAgICAgICAgICAgcmV0dXJuICh0aGlzLmN1cnJlbnRJbmZvID8gMSA6IDApICsgdGhpcy5maW5pc2hlZC5sZW5ndGg7XG4gICAgICAgIH0sXG4gICAgICAgIGlzQmFraW5nKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgcmV0dXJuIEJvb2xlYW4odGhpcy5yZW1haW5pbmcubGVuZ3RoIHx8IHRoaXMuY3VycmVudEluZm8pO1xuICAgICAgICB9LFxuICAgICAgICBwcm9ncmVzcygpOiBudW1iZXIge1xuICAgICAgICAgICAgaWYgKHRoaXMudG90YWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTAwICogdGhpcy5maW5pc2hlZC5sZW5ndGggLyB0aGlzLnRvdGFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0sXG4gICAgICAgIHRvdGFsKCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maW5pc2hlZC5sZW5ndGggKyB0aGlzLnJlbWFpbmluZy5sZW5ndGggKyAodGhpcy5jdXJyZW50SW5mbyA/IDEgOiAwKTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNGaXJzdEJ1aWxkKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluaXNoZWQubGVuZ3RoID09PSAwO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgZGF0YTogKCkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVtYWluaW5nOiBbXSBhcyByZWFkb25seSBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mb1tdLFxuICAgICAgICAgICAgZmluaXNoZWQ6IFtdIGFzIHJlYWRvbmx5IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvW10sXG4gICAgICAgICAgICBsb2dJbmZvczogW10gYXMgeyB0ZXh0OiBzdHJpbmcsIHR5cGU6ICd3YXJuaW5nJyB8ICdlcnJvcicgfCAnbG9nJywga2V5OiBudW1iZXIgfVtdLFxuICAgICAgICAgICAgY3VycmVudEluZm86IG51bGwgYXMgUmVmbGVjdGlvblByb2JlQmFrZUluZm8gfCBudWxsLFxuICAgICAgICAgICAgaXNDbGVhcmluZzogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIG9uQ2xlYXJVcGRhdGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgICAgICB0aGlzLmlzQ2xlYXJpbmcgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RhcnRCYWtlKCkge1xuICAgICAgICAgICAgdGhpcy5jbGVhckxvZygpO1xuICAgICAgICAgICAgb3BlcmF0aW9uKCdzdGFydC1iYWtlJyk7XG4gICAgICAgICAgICBFZGl0b3IuTWV0cmljcy5fdHJhY2tFdmVudFdpdGhUaW1lcih7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdiYWtpbmdTeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGlkOiAnQTEwMDAxNCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IDEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcEJha2UoKSB7XG4gICAgICAgICAgICB0aGlzLmxvZyhFZGl0b3IuSTE4bi50KCdyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmxvZy5zdGFydF9jYW5jZWwnLCB7IG5vZGVOYW1lOiB0aGlzLmN1cnJlbnRJbmZvIS5ub2RlTmFtZSB9KSk7XG4gICAgICAgICAgICBvcGVyYXRpb24oJ2NhbmNlbC1iYWtlJyk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uQmFrZVN0YXJ0KGluZm86IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmZvID0gaW5mbztcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2codGhpcy5wcm9ncmVzc0xvZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9uQmFrZUVuZChlcnI6IEVycm9yIHwgJ2NhbmNlbCcgfCBudWxsLCBpbmZvPzogUmVmbGVjdGlvblByb2JlQmFrZUluZm8pIHtcbiAgICAgICAgICAgIGlmIChlcnIgPT09ICdjYW5jZWwnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVtYWluaW5nLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nKEVkaXRvci5JMThuLnQoJ3JlZmxlY3Rpb24tcHJvYmUucGFuZWwubG9nLmNhbmNlbF9zdWNjZXNzJykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyICE9PSBudWxsICYmIGluZm8pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yKEVkaXRvci5JMThuLnQoXG4gICAgICAgICAgICAgICAgICAgICdyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmxvZy5iYWtlX2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IGluZm8ubm9kZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnI6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgRmFpbGVkIHRvIGJha2UgcmVmbGVjdGlvbiBwcm9iZSBvbiB0aGUgbm9kZSAke2luZm8ubm9kZU5hbWV9IHdpdGggZXJyb3IgOiAgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYEZhaWxlZCB0byBiYWtlIHJlZmxlY3Rpb24gcHJvYmUgb24gdGhlIG5vZGUgJHtpbmZvLm5vZGVOYW1lfSB3aXRoIHN0YWNrIHRyYWNlIDogJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICghZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2coRWRpdG9yLkkxOG4udCgncmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5sb2cuYmFrZV9maW5pc2hlZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVOYW1lOiBpbmZvLm5vZGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudE51bTogdGhpcy5jdXJyZW50TnVtLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbE51bTogdGhpcy50b3RhbC50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOayoeaciSBpbmZvIOWwseS7o+ihqOWcuuaZr+S4gOS4quWPjeWwhOaOoumSiOmDveayoeacieebtOaOpeinpuWPkeeDmOeEmee7k+adn1xuICAgICAgICAgICAgICAgIGlmICghaW5mbyB8fCB0aGlzLnJlbWFpbmluZy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZyhFZGl0b3IuSTE4bi50KCdyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmxvZy5iYWtlX2FsbF9maW5pc2hlZCcsIHsgbnVtOiB0aGlzLnRvdGFsLnRvU3RyaW5nKCkgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3VycmVudEluZm8gPSBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBhc3luYyBjbGVhclJlc3VsdHMoKSB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTG9nKCk7XG4gICAgICAgICAgICB0aGlzLmlzQ2xlYXJpbmcgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgb3BlcmF0aW9uKCdjbGVhci1yZXN1bHRzJyk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uQmFrZVVwZGF0ZShyZXN1bHQ6IFF1ZXJ5QmFrZVJlc3VsdCkge1xuICAgICAgICAgICAgdGhpcy5yZW1haW5pbmcgPSByZXN1bHQucmVtYWluaW5nO1xuICAgICAgICAgICAgdGhpcy5maW5pc2hlZCA9IHJlc3VsdC5maW5pc2hlZDtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEluZm8gPSByZXN1bHQuY3VycmVudEluZm8gPz8gbnVsbDtcblxuICAgICAgICB9LFxuICAgICAgICBsb2codGV4dDogc3RyaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ0luZm9zLnB1c2goeyB0ZXh0LCB0eXBlOiAnbG9nJywga2V5OiBwZXJmb3JtYW5jZS5ub3coKSArIE1hdGgucmFuZG9tKCkgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHdhcm5pbmcodGV4dDogc3RyaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ0luZm9zLnB1c2goeyB0ZXh0LCB0eXBlOiAnd2FybmluZycsIGtleTogcGVyZm9ybWFuY2Uubm93KCkgKyBNYXRoLnJhbmRvbSgpIH0pO1xuICAgICAgICB9LFxuICAgICAgICBlcnJvcih0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIHRoaXMubG9nSW5mb3MucHVzaCh7IHRleHQsIHR5cGU6ICdlcnJvcicsIGtleTogcGVyZm9ybWFuY2Uubm93KCkgKyBNYXRoLnJhbmRvbSgpIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvKiog5riF56m65omA5pyJ5pel5b+XICovXG4gICAgICAgIGNsZWFyTG9nKCkge1xuICAgICAgICAgICAgdGhpcy5sb2dJbmZvcy5zcGxpY2UoMCwgdGhpcy5sb2dJbmZvcy5sZW5ndGgpO1xuICAgICAgICB9LFxuICAgIH0sXG5cbn0pO1xuaW50ZXJmYWNlIFBhbmVsRGF0YSB7XG4gICAgY29tcG9uZW50OiBJbnN0YW5jZVR5cGU8dHlwZW9mIENvbXBvbmVudD4sXG4gICAgb25CYWtlU3RhcnQoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1zdGFydCddPik6IHZvaWQsXG4gICAgb25CYWtlRW5kKC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOmJha2UtZW5kJ10+KTogdm9pZCxcbiAgICBvbkJha2VVcGRhdGUoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbyddPik6IHZvaWQsXG4gICAgb25DbGVhclVwZGF0ZWQoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6Y2xlYXItZW5kJ10+KTogdm9pZCxcbn1cblxuY29uc3QgbWV0aG9kczogT21pdDxQYW5lbERhdGEsICdjb21wb25lbnQnPiAmIHsgaW5pdDogKCkgPT4gUHJvbWlzZTx2b2lkPiB9ID0ge1xuICAgIG9uQmFrZVN0YXJ0KC4uLmFyZ3MpIHtcbiAgICAgICAgcGFuZWxEYXRhTWFwLmdldCh0aGlzKT8uY29tcG9uZW50Lm9uQmFrZVN0YXJ0KC4uLmFyZ3MpO1xuICAgIH0sXG5cbiAgICBvbkJha2VFbmQoLi4uYXJncykge1xuICAgICAgICBwYW5lbERhdGFNYXAuZ2V0KHRoaXMpPy5jb21wb25lbnQub25CYWtlRW5kKC4uLmFyZ3MpO1xuICAgIH0sXG4gICAgb25CYWtlVXBkYXRlKC4uLmFyZ3MpIHtcbiAgICAgICAgcGFuZWxEYXRhTWFwLmdldCh0aGlzKT8uY29tcG9uZW50Lm9uQmFrZVVwZGF0ZSguLi5hcmdzKTtcbiAgICB9LFxuICAgIG9uQ2xlYXJVcGRhdGVkKC4uLmFyZ3MpIHtcbiAgICAgICAgcGFuZWxEYXRhTWFwLmdldCh0aGlzKT8uY29tcG9uZW50Lm9uQ2xlYXJVcGRhdGVkKC4uLmFyZ3MpO1xuICAgIH0sXG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgaWYgKCFwYW5lbERhdGFNYXAuZ2V0KHRoaXMpKSB7XG4gICAgICAgICAgICBjb25zdCB7IHJlbWFpbmluZywgZmluaXNoZWQsIGN1cnJlbnRJbmZvIH0gPSBhd2FpdCBxdWVyeSgncXVlcnktYmFrZS1pbmZvJyk7XG4gICAgICAgICAgICBjb25zdCBpc0NsZWFyaW5nID0gISFhd2FpdCBxdWVyeSgncXVlcnktaXMtY2xlYXJpbmcnKTtcbiAgICAgICAgICAgIGNvbnN0IHZtID0gbmV3IENvbXBvbmVudCh7XG4gICAgICAgICAgICAgICAgZWw6ICh0aGlzIGFzIGFueSkuJC5hcHAsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmcsXG4gICAgICAgICAgICAgICAgICAgIGZpbmlzaGVkLFxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SW5mbyxcbiAgICAgICAgICAgICAgICAgICAgaXNDbGVhcmluZyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9uQmFrZVN0YXJ0ID0gKC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOmJha2Utc3RhcnQnXT4pID0+IHtcbiAgICAgICAgICAgICAgICB2bS5vbkJha2VTdGFydCguLi5hcmdzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBvbkJha2VFbmQgPSAoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1lbmQnXT4pID0+IHtcbiAgICAgICAgICAgICAgICB2bS5vbkJha2VFbmQoLi4uYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgb25CYWtlVXBkYXRlID0gKC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOnVwZGF0ZS1iYWtlLWluZm8nXT4pID0+IHtcbiAgICAgICAgICAgICAgICB2bS5vbkJha2VVcGRhdGUoLi4uYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgb25DbGVhclVwZGF0ZWQgPSAoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6Y2xlYXItZW5kJ10+KSA9PiB7XG4gICAgICAgICAgICAgICAgdm0ub25DbGVhclVwZGF0ZWQoLi4uYXJncyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBwYW5lbERhdGFNYXAuc2V0KHRoaXMsIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQ6IHZtLFxuICAgICAgICAgICAgICAgIG9uQmFrZVN0YXJ0LFxuICAgICAgICAgICAgICAgIG9uQmFrZUVuZCxcbiAgICAgICAgICAgICAgICBvbkJha2VVcGRhdGUsXG4gICAgICAgICAgICAgICAgb25DbGVhclVwZGF0ZWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG59O1xubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3IuUGFuZWwuZGVmaW5lKHtcbiAgICB0ZW1wbGF0ZTogLypodG1sICovYFxuICAgIDxkaXYgaWQ9XCJhcHBcIj48L2Rpdj5cbiAgICBgLFxuICAgICQ6IHtcbiAgICAgICAgYXBwOiAnI2FwcCcsXG4gICAgfSxcbiAgICBtZXRob2RzLFxuICAgIHN0eWxlOiAvKmNzcyAqL2BcbiAgICAgICAgLnJlZmxlY3Rpb25Qcm9iZSB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgICBwYWRkaW5nOiAzMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLm1haW4ge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgLm1haW4gPiB1aS1idXR0b24ge1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbToxNXB4O1xuICAgICAgICAgICAgd2lkdGg6IDIwMHB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLmZvb3RlciB7XG4gICAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgICAgbWluLWhlaWdodDogMTIwcHg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1ub3JtYWwtZmlsbC1lbXBoYXNpcyk7XG4gICAgICAgICAgICBvdmVyZmxvdzogYXV0bztcbiAgICAgICAgICAgIG1hcmdpbjogMCAxNHB4IDE0cHggMTRweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDdweCAxNHB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC5vdXRwdXQge1xuICAgICAgICAgICAgcGFkZGluZy1ib3R0b206IDIwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAub3V0cHV0ID4gZGl2W3R5cGU9XCJlcnJvclwiXSB7XG4gICAgICAgICAgICBjb2xvcjogdmFyKC0tY29sb3ItZGFuZ2VyLWZpbGwtbm9ybWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5vdXRwdXQgPiBkaXZbdHlwZT1cIndhcm5pbmdcIl0ge1xuICAgICAgICAgICAgY29sb3I6IHZhcigtLWNvbG9yLXdhcm4tZmlsbCk7XG4gICAgICAgIH1cblxuICAgICAgICB1aS1wcm9ncmVzcyB7XG4gICAgICAgICAgICBtYXJnaW46IDE0cHg7XG4gICAgICAgIH1cbiAgICBgLFxuICAgIGFzeW5jIHJlYWR5KCkge1xuICAgICAgICBjb25zdCBpc1JlYWR5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktaXMtcmVhZHknKTtcbiAgICAgICAgaWYgKGlzUmVhZHkpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBjbG9zZSgpIHtcbiAgICAgICAgY29uc3QgcGFuZWxEYXRhID0gcGFuZWxEYXRhTWFwLmdldCh0aGlzKTtcbiAgICAgICAgaWYgKHBhbmVsRGF0YSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLmNvbXBvbmVudC4kZGVzdHJveSgpO1xuICAgICAgICAgICAgcGFuZWxEYXRhTWFwLmRlbGV0ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbn0pOyJdfQ==