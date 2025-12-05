"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scene_message_1 = require("./shared/scene-message");
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
const panelDataMap = new WeakMap();
const Component = Vue.extend({
    data: () => {
        return {
            remaining: [],
            finished: [],
            logInfos: [],
            currentInfo: null,
            isClearing: false,
            isBaking: false,
            isStopping: false,
        };
    },
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
    methods: {
        onClearUpdated(value) {
            this.isClearing = value;
        },
        startBake() {
            this.isBaking = true;
            this.clearLog();
            (0, scene_message_1.operation)('start-bake');
            Editor.Metrics._trackEventWithTimer({
                category: 'bakingSystem',
                id: 'A100014',
                value: 1,
            });
        },
        stopBake() {
            this.isStopping = this.isBaking;
            (0, scene_message_1.query)('query-bake-info').then(result => {
                if (!result.currentInfo) {
                    this.isStopping = false;
                    this.isBaking = false;
                }
            });
            if (this.currentInfo) {
                this.log(Editor.I18n.t('reflection-probe.panel.log.start_cancel', { nodeName: this.currentInfo.nodeName }));
            }
            (0, scene_message_1.operation)('cancel-bake');
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
            this.isBaking = false;
            this.isStopping = false;
        },
        async clearResults() {
            this.clearLog();
            this.isClearing = true;
            await (0, scene_message_1.operation)('clear-results');
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
    template: /*html */ `
        <div class="reflectionProbe">
            <div class="main">
                <ui-button v-show="!isBaking" type="primary" @confirm="startBake"><ui-label value="i18n:reflection-probe.panel.start_bake"></ui-label></ui-button>
                <ui-button v-show="isBaking" :disabled="isStopping" type="danger" @confirm="stopBake"><ui-label value="i18n:reflection-probe.panel.cancel_bake"></ui-label></ui-button>
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
            const { remaining, finished, currentInfo } = await (0, scene_message_1.query)('query-bake-info');
            const isClearing = !!await (0, scene_message_1.query)('query-is-clearing');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwwREFBMEQ7QUFHMUQsTUFBTSxHQUFHLEdBQW1CLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3ZELEdBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUNqQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFFNUIsTUFBTSxZQUFZLEdBQUcsSUFBSSxPQUFPLEVBQWtCLENBQUM7QUFDbkQsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUN6QixJQUFJLEVBQUUsR0FBRyxFQUFFO1FBQ1AsT0FBTztZQUNILFNBQVMsRUFBRSxFQUF3QztZQUNuRCxRQUFRLEVBQUUsRUFBd0M7WUFDbEQsUUFBUSxFQUFFLEVBQXdFO1lBQ2xGLFdBQVcsRUFBRSxJQUFzQztZQUNuRCxVQUFVLEVBQUUsS0FBSztZQUNqQixRQUFRLEVBQUUsS0FBSztZQUNmLFVBQVUsRUFBRSxLQUFLO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBQ0QsUUFBUSxFQUFFO1FBQ04sV0FBVztZQUNQLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsdUNBQXVDLEVBQUU7Z0JBQzFELFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRTtnQkFDdEMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFO2dCQUMvQixRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLElBQUksRUFBRTthQUM3QyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBQ0QsVUFBVTtZQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FB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VCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDZjtJQUNMLENBQUM7SUFDRCxLQUFLO1FBQ0QsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxJQUFJLFNBQVMsRUFBRTtZQUNYLFNBQVMsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDL0IsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3QjtJQUNMLENBQUM7Q0FFSixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBRdWVyeUJha2VSZXN1bHQsIFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvLCBSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3QgfSBmcm9tICcuLi9AdHlwZXMvcHJvdGVjdGVkJztcbmltcG9ydCB7IHF1ZXJ5LCBvcGVyYXRpb24gfSBmcm9tICcuL3NoYXJlZC9zY2VuZS1tZXNzYWdlJztcblxuaW1wb3J0IHR5cGUgeyBWdWVDb25zdHJ1Y3RvciB9IGZyb20gJ3Z1ZSc7XG5jb25zdCBWdWU6IFZ1ZUNvbnN0cnVjdG9yID0gcmVxdWlyZSgndnVlL2Rpc3QvdnVlLmpzJyk7XG5WdWUuY29uZmlnLnByb2R1Y3Rpb25UaXAgPSBmYWxzZTtcblZ1ZS5jb25maWcuZGV2dG9vbHMgPSBmYWxzZTtcblxuY29uc3QgcGFuZWxEYXRhTWFwID0gbmV3IFdlYWtNYXA8YW55LCBQYW5lbERhdGE+KCk7XG5jb25zdCBDb21wb25lbnQgPSBWdWUuZXh0ZW5kKHtcbiAgICBkYXRhOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZW1haW5pbmc6IFtdIGFzIHJlYWRvbmx5IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvW10sXG4gICAgICAgICAgICBmaW5pc2hlZDogW10gYXMgcmVhZG9ubHkgUmVmbGVjdGlvblByb2JlQmFrZUluZm9bXSxcbiAgICAgICAgICAgIGxvZ0luZm9zOiBbXSBhcyB7IHRleHQ6IHN0cmluZywgdHlwZTogJ3dhcm5pbmcnIHwgJ2Vycm9yJyB8ICdsb2cnLCBrZXk6IG51bWJlciB9W10sXG4gICAgICAgICAgICBjdXJyZW50SW5mbzogbnVsbCBhcyBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mbyB8IG51bGwsXG4gICAgICAgICAgICBpc0NsZWFyaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGlzQmFraW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGlzU3RvcHBpbmc6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgcHJvZ3Jlc3NMb2coKTogc3RyaW5nIHtcbiAgICAgICAgICAgIHJldHVybiBFZGl0b3IuSTE4bi50KCdyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmxvZy5zdGFydF9iYWtlJywge1xuICAgICAgICAgICAgICAgIGN1cnJlbnROdW06IHRoaXMuY3VycmVudE51bS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHRvdGFsTnVtOiB0aGlzLnRvdGFsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbm9kZU5hbWU6IHRoaXMuY3VycmVudEluZm8/Lm5vZGVOYW1lIHx8ICcnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnROdW0oKTogbnVtYmVyIHtcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5jdXJyZW50SW5mbyA/IDEgOiAwKSArIHRoaXMuZmluaXNoZWQubGVuZ3RoO1xuICAgICAgICB9LFxuICAgICAgICBwcm9ncmVzcygpOiBudW1iZXIge1xuICAgICAgICAgICAgaWYgKHRoaXMudG90YWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTAwICogdGhpcy5maW5pc2hlZC5sZW5ndGggLyB0aGlzLnRvdGFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0sXG4gICAgICAgIHRvdGFsKCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maW5pc2hlZC5sZW5ndGggKyB0aGlzLnJlbWFpbmluZy5sZW5ndGggKyAodGhpcy5jdXJyZW50SW5mbyA/IDEgOiAwKTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNGaXJzdEJ1aWxkKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluaXNoZWQubGVuZ3RoID09PSAwO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBvbkNsZWFyVXBkYXRlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgICAgICAgICAgdGhpcy5pc0NsZWFyaW5nID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIHN0YXJ0QmFrZSgpIHtcbiAgICAgICAgICAgIHRoaXMuaXNCYWtpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5jbGVhckxvZygpO1xuICAgICAgICAgICAgb3BlcmF0aW9uKCdzdGFydC1iYWtlJyk7XG4gICAgICAgICAgICBFZGl0b3IuTWV0cmljcy5fdHJhY2tFdmVudFdpdGhUaW1lcih7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdiYWtpbmdTeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGlkOiAnQTEwMDAxNCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IDEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcEJha2UoKSB7XG4gICAgICAgICAgICB0aGlzLmlzU3RvcHBpbmcgPSB0aGlzLmlzQmFraW5nO1xuICAgICAgICAgICAgcXVlcnkoJ3F1ZXJ5LWJha2UtaW5mbycpLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdC5jdXJyZW50SW5mbyl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNTdG9wcGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQmFraW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50SW5mbyl7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2coRWRpdG9yLkkxOG4udCgncmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5sb2cuc3RhcnRfY2FuY2VsJywgeyBub2RlTmFtZTogdGhpcy5jdXJyZW50SW5mby5ub2RlTmFtZSB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcGVyYXRpb24oJ2NhbmNlbC1iYWtlJyk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uQmFrZVN0YXJ0KGluZm86IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmZvID0gaW5mbztcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2codGhpcy5wcm9ncmVzc0xvZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9uQmFrZUVuZChlcnI6IEVycm9yIHwgJ2NhbmNlbCcgfCBudWxsLCBpbmZvPzogUmVmbGVjdGlvblByb2JlQmFrZUluZm8pIHtcbiAgICAgICAgICAgIGlmIChlcnIgPT09ICdjYW5jZWwnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVtYWluaW5nLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nKEVkaXRvci5JMThuLnQoJ3JlZmxlY3Rpb24tcHJvYmUucGFuZWwubG9nLmNhbmNlbF9zdWNjZXNzJykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyICE9PSBudWxsICYmIGluZm8pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yKEVkaXRvci5JMThuLnQoXG4gICAgICAgICAgICAgICAgICAgICdyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmxvZy5iYWtlX2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IGluZm8ubm9kZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnI6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgRmFpbGVkIHRvIGJha2UgcmVmbGVjdGlvbiBwcm9iZSBvbiB0aGUgbm9kZSAke2luZm8ubm9kZU5hbWV9IHdpdGggZXJyb3IgOiAgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYEZhaWxlZCB0byBiYWtlIHJlZmxlY3Rpb24gcHJvYmUgb24gdGhlIG5vZGUgJHtpbmZvLm5vZGVOYW1lfSB3aXRoIHN0YWNrIHRyYWNlIDogJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICghZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2coRWRpdG9yLkkxOG4udCgncmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5sb2cuYmFrZV9maW5pc2hlZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVOYW1lOiBpbmZvLm5vZGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudE51bTogdGhpcy5jdXJyZW50TnVtLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbE51bTogdGhpcy50b3RhbC50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOayoeaciSBpbmZvIOWwseS7o+ihqOWcuuaZr+S4gOS4quWPjeWwhOaOoumSiOmDveayoeacieebtOaOpeinpuWPkeeDmOeEmee7k+adn1xuICAgICAgICAgICAgICAgIGlmICghaW5mbyB8fCB0aGlzLnJlbWFpbmluZy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZyhFZGl0b3IuSTE4bi50KCdyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmxvZy5iYWtlX2FsbF9maW5pc2hlZCcsIHsgbnVtOiB0aGlzLnRvdGFsLnRvU3RyaW5nKCkgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3VycmVudEluZm8gPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5pc0Jha2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5pc1N0b3BwaW5nID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIGFzeW5jIGNsZWFyUmVzdWx0cygpIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJMb2coKTtcbiAgICAgICAgICAgIHRoaXMuaXNDbGVhcmluZyA9IHRydWU7XG4gICAgICAgICAgICBhd2FpdCBvcGVyYXRpb24oJ2NsZWFyLXJlc3VsdHMnKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25CYWtlVXBkYXRlKHJlc3VsdDogUXVlcnlCYWtlUmVzdWx0KSB7XG4gICAgICAgICAgICB0aGlzLnJlbWFpbmluZyA9IHJlc3VsdC5yZW1haW5pbmc7XG4gICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gcmVzdWx0LmZpbmlzaGVkO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5mbyA9IHJlc3VsdC5jdXJyZW50SW5mbyA/PyBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBsb2codGV4dDogc3RyaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ0luZm9zLnB1c2goeyB0ZXh0LCB0eXBlOiAnbG9nJywga2V5OiBwZXJmb3JtYW5jZS5ub3coKSArIE1hdGgucmFuZG9tKCkgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHdhcm5pbmcodGV4dDogc3RyaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ0luZm9zLnB1c2goeyB0ZXh0LCB0eXBlOiAnd2FybmluZycsIGtleTogcGVyZm9ybWFuY2Uubm93KCkgKyBNYXRoLnJhbmRvbSgpIH0pO1xuICAgICAgICB9LFxuICAgICAgICBlcnJvcih0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIHRoaXMubG9nSW5mb3MucHVzaCh7IHRleHQsIHR5cGU6ICdlcnJvcicsIGtleTogcGVyZm9ybWFuY2Uubm93KCkgKyBNYXRoLnJhbmRvbSgpIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvKiog5riF56m65omA5pyJ5pel5b+XICovXG4gICAgICAgIGNsZWFyTG9nKCkge1xuICAgICAgICAgICAgdGhpcy5sb2dJbmZvcy5zcGxpY2UoMCwgdGhpcy5sb2dJbmZvcy5sZW5ndGgpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IC8qaHRtbCAqL2BcbiAgICAgICAgPGRpdiBjbGFzcz1cInJlZmxlY3Rpb25Qcm9iZVwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1haW5cIj5cbiAgICAgICAgICAgICAgICA8dWktYnV0dG9uIHYtc2hvdz1cIiFpc0Jha2luZ1wiIHR5cGU9XCJwcmltYXJ5XCIgQGNvbmZpcm09XCJzdGFydEJha2VcIj48dWktbGFiZWwgdmFsdWU9XCJpMThuOnJlZmxlY3Rpb24tcHJvYmUucGFuZWwuc3RhcnRfYmFrZVwiPjwvdWktbGFiZWw+PC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiB2LXNob3c9XCJpc0Jha2luZ1wiIDpkaXNhYmxlZD1cImlzU3RvcHBpbmdcIiB0eXBlPVwiZGFuZ2VyXCIgQGNvbmZpcm09XCJzdG9wQmFrZVwiPjx1aS1sYWJlbCB2YWx1ZT1cImkxOG46cmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5jYW5jZWxfYmFrZVwiPjwvdWktbGFiZWw+PC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiB0eXBlPVwiZGFuZ2VyXCIgOmRpc2FibGVkPVwiaXNDbGVhcmluZyB8fCBpc0Jha2luZ1wiIEBjb25maXJtPVwiY2xlYXJSZXN1bHRzXCI+PHVpLWxhYmVsIHZhbHVlPVwiaTE4bjpyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmNsZWFyX3Jlc3VsdFwiPjwvdWktbGFiZWw+PC91aS1idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDx1aS1wcm9ncmVzcyB2LXNob3c9XCJpc0Jha2luZ1wiIDp2YWx1ZT1cInByb2dyZXNzXCI+PC91aS1wcm9ncmVzcz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwib3V0cHV0XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgdi1mb3I9XCIoaXRlbSwgaW5kZXgpIGluIGxvZ0luZm9zXCIgOnR5cGU9XCJpdGVtLnR5cGVcIiA6a2V5PVwiaXRlbS5rZXlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgPnt7IGl0ZW0udGV4dCB9fTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj4gICAgXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgYCxcblxufSk7XG5pbnRlcmZhY2UgUGFuZWxEYXRhIHtcbiAgICBjb21wb25lbnQ6IEluc3RhbmNlVHlwZTx0eXBlb2YgQ29tcG9uZW50PixcbiAgICBvbkJha2VTdGFydCguLi5hcmdzOiBQYXJhbWV0ZXJzPFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdFsncmVmbGVjdGlvbi1wcm9iZTpiYWtlLXN0YXJ0J10+KTogdm9pZCxcbiAgICBvbkJha2VFbmQoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1lbmQnXT4pOiB2b2lkLFxuICAgIG9uQmFrZVVwZGF0ZSguLi5hcmdzOiBQYXJhbWV0ZXJzPFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdFsncmVmbGVjdGlvbi1wcm9iZTp1cGRhdGUtYmFrZS1pbmZvJ10+KTogdm9pZCxcbiAgICBvbkNsZWFyVXBkYXRlZCguLi5hcmdzOiBQYXJhbWV0ZXJzPFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdFsncmVmbGVjdGlvbi1wcm9iZTpjbGVhci1lbmQnXT4pOiB2b2lkLFxufVxuXG5jb25zdCBtZXRob2RzOiBPbWl0PFBhbmVsRGF0YSwgJ2NvbXBvbmVudCc+ICYgeyBpbml0OiAoKSA9PiBQcm9taXNlPHZvaWQ+IH0gPSB7XG4gICAgb25CYWtlU3RhcnQoLi4uYXJncykge1xuICAgICAgICBwYW5lbERhdGFNYXAuZ2V0KHRoaXMpPy5jb21wb25lbnQub25CYWtlU3RhcnQoLi4uYXJncyk7XG4gICAgfSxcblxuICAgIG9uQmFrZUVuZCguLi5hcmdzKSB7XG4gICAgICAgIHBhbmVsRGF0YU1hcC5nZXQodGhpcyk/LmNvbXBvbmVudC5vbkJha2VFbmQoLi4uYXJncyk7XG4gICAgfSxcbiAgICBvbkJha2VVcGRhdGUoLi4uYXJncykge1xuICAgICAgICBwYW5lbERhdGFNYXAuZ2V0KHRoaXMpPy5jb21wb25lbnQub25CYWtlVXBkYXRlKC4uLmFyZ3MpO1xuICAgIH0sXG4gICAgb25DbGVhclVwZGF0ZWQoLi4uYXJncykge1xuICAgICAgICBwYW5lbERhdGFNYXAuZ2V0KHRoaXMpPy5jb21wb25lbnQub25DbGVhclVwZGF0ZWQoLi4uYXJncyk7XG4gICAgfSxcbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBpZiAoIXBhbmVsRGF0YU1hcC5nZXQodGhpcykpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgcmVtYWluaW5nLCBmaW5pc2hlZCwgY3VycmVudEluZm8gfSA9IGF3YWl0IHF1ZXJ5KCdxdWVyeS1iYWtlLWluZm8nKTtcbiAgICAgICAgICAgIGNvbnN0IGlzQ2xlYXJpbmcgPSAhIWF3YWl0IHF1ZXJ5KCdxdWVyeS1pcy1jbGVhcmluZycpO1xuICAgICAgICAgICAgY29uc3Qgdm0gPSBuZXcgQ29tcG9uZW50KHtcbiAgICAgICAgICAgICAgICBlbDogKHRoaXMgYXMgYW55KS4kLmFwcCxcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZyxcbiAgICAgICAgICAgICAgICAgICAgZmluaXNoZWQsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJbmZvLFxuICAgICAgICAgICAgICAgICAgICBpc0NsZWFyaW5nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3Qgb25CYWtlU3RhcnQgPSAoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1zdGFydCddPikgPT4ge1xuICAgICAgICAgICAgICAgIHZtLm9uQmFrZVN0YXJ0KC4uLmFyZ3MpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IG9uQmFrZUVuZCA9ICguLi5hcmdzOiBQYXJhbWV0ZXJzPFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdFsncmVmbGVjdGlvbi1wcm9iZTpiYWtlLWVuZCddPikgPT4ge1xuICAgICAgICAgICAgICAgIHZtLm9uQmFrZUVuZCguLi5hcmdzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBvbkJha2VVcGRhdGUgPSAoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbyddPikgPT4ge1xuICAgICAgICAgICAgICAgIHZtLm9uQmFrZVVwZGF0ZSguLi5hcmdzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBvbkNsZWFyVXBkYXRlZCA9ICguLi5hcmdzOiBQYXJhbWV0ZXJzPFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdFsncmVmbGVjdGlvbi1wcm9iZTpjbGVhci1lbmQnXT4pID0+IHtcbiAgICAgICAgICAgICAgICB2bS5vbkNsZWFyVXBkYXRlZCguLi5hcmdzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHBhbmVsRGF0YU1hcC5zZXQodGhpcywge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogdm0sXG4gICAgICAgICAgICAgICAgb25CYWtlU3RhcnQsXG4gICAgICAgICAgICAgICAgb25CYWtlRW5kLFxuICAgICAgICAgICAgICAgIG9uQmFrZVVwZGF0ZSxcbiAgICAgICAgICAgICAgICBvbkNsZWFyVXBkYXRlZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcbn07XG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5kZWZpbmUoe1xuICAgIHRlbXBsYXRlOiAvKmh0bWwgKi9gXG4gICAgPGRpdiBpZD1cImFwcFwiPjwvZGl2PlxuICAgIGAsXG4gICAgJDoge1xuICAgICAgICBhcHA6ICcjYXBwJyxcbiAgICB9LFxuICAgIG1ldGhvZHMsXG4gICAgc3R5bGU6IC8qY3NzICovYFxuICAgICAgICAucmVmbGVjdGlvblByb2JlIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICAgIHBhZGRpbmc6IDMwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAubWFpbiB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIH1cblxuICAgICAgICAubWFpbiA+IHVpLWJ1dHRvbiB7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOjE1cHg7XG4gICAgICAgICAgICB3aWR0aDogMjAwcHg7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgICAgIH1cblxuICAgICAgICAuZm9vdGVyIHtcbiAgICAgICAgICAgIGZsZXg6IDE7XG4gICAgICAgICAgICBtaW4taGVpZ2h0OiAxMjBweDtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWNvbG9yLW5vcm1hbC1maWxsLWVtcGhhc2lzKTtcbiAgICAgICAgICAgIG92ZXJmbG93OiBhdXRvO1xuICAgICAgICAgICAgbWFyZ2luOiAwIDE0cHggMTRweCAxNHB4O1xuICAgICAgICAgICAgcGFkZGluZzogN3B4IDE0cHg7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLm91dHB1dCB7XG4gICAgICAgICAgICBwYWRkaW5nLWJvdHRvbTogMjBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5vdXRwdXQgPiBkaXZbdHlwZT1cImVycm9yXCJdIHtcbiAgICAgICAgICAgIGNvbG9yOiB2YXIoLS1jb2xvci1kYW5nZXItZmlsbC1ub3JtYWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLm91dHB1dCA+IGRpdlt0eXBlPVwid2FybmluZ1wiXSB7XG4gICAgICAgICAgICBjb2xvcjogdmFyKC0tY29sb3Itd2Fybi1maWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHVpLXByb2dyZXNzIHtcbiAgICAgICAgICAgIG1hcmdpbjogMTRweDtcbiAgICAgICAgfVxuICAgIGAsXG4gICAgYXN5bmMgcmVhZHkoKSB7XG4gICAgICAgIGNvbnN0IGlzUmVhZHkgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1pcy1yZWFkeScpO1xuICAgICAgICBpZiAoaXNSZWFkeSkge1xuICAgICAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNsb3NlKCkge1xuICAgICAgICBjb25zdCBwYW5lbERhdGEgPSBwYW5lbERhdGFNYXAuZ2V0KHRoaXMpO1xuICAgICAgICBpZiAocGFuZWxEYXRhKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuY29tcG9uZW50LiRkZXN0cm95KCk7XG4gICAgICAgICAgICBwYW5lbERhdGFNYXAuZGVsZXRlKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxufSk7Il19