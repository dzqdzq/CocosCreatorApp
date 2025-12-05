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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwwREFBMEQ7QUFFMUQsTUFBTSxHQUFHLEdBQWlDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNsRSxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDNUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLE1BQU0sWUFBWSxHQUFHLElBQUksT0FBTyxFQUFrQixDQUFDO0FBQ25ELE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFDekIsUUFBUSxFQUFFLFNBQVMsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7OztLQWdCbEI7SUFDRCxRQUFRLEVBQUU7UUFDTixXQUFXO1lBQ1AsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyx1Q0FBdUMsRUFBRTtnQkFDMUQsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFO2dCQUN0QyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUU7Z0JBQy9CLFFBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLFFBQVEsSUFBSSxFQUFFO2FBQzdDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFDRCxVQUFVO1lBQ04sT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDN0QsQ0FBQztRQUNELFFBQVE7WUFDSixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUNELFFBQVE7WUFDSixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUM7Z0JBQ1gsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzthQUNsRDtZQUNELE9BQU8sQ0FBQyxDQUFDO1FBQ2IsQ0FBQztRQUNELEtBQUs7WUFDRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUN0RixDQUFDO1FBQ0QsWUFBWTtZQUNSLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLENBQUM7S0FDSjtJQUNELElBQUksRUFBRSxHQUFHLEVBQUU7UUFDUCxPQUFPO1lBQ0gsU0FBUyxFQUFFLEVBQXdDO1lBQ25ELFFBQVEsRUFBRSxFQUF1QztZQUNqRCxRQUFRLEVBQUUsRUFBa0U7WUFDNUUsV0FBVyxFQUFFLElBQXNDO1lBQ25ELFVBQVUsRUFBRSxLQUFLO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBQ0QsT0FBTyxFQUFFO1FBQ0wsY0FBYyxDQUFDLEtBQWM7WUFDekIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDNUIsQ0FBQztRQUNELFNBQVM7WUFDTCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEIseUJBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN4QixNQUFNLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDO2dCQUNoQyxRQUFRLEVBQUUsY0FBYztnQkFDeEIsRUFBRSxFQUFFLFNBQVM7Z0JBQ2IsS0FBSyxFQUFFLENBQUM7YUFDWCxDQUFDLENBQUM7UUFDUCxDQUFDO1FBQ0QsUUFBUTtZQUNKLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMseUNBQXlDLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVksQ0FBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0cseUJBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBQ0QsV0FBVyxDQUFDLElBQTZCO1lBQ3JDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBQztnQkFDWCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUM5QjtRQUNMLENBQUM7UUFDRCxTQUFTLENBQUMsR0FBNEIsRUFBRSxJQUE4QjtZQUNsRSxJQUFJLEdBQUcsS0FBSyxRQUFRLEVBQUM7Z0JBQ2pCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFDO29CQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLDJDQUEyQyxDQUFDLENBQUMsQ0FBQztpQkFDeEU7YUFDSjtpQkFBTSxJQUFJLEdBQUcsS0FBSyxJQUFJLElBQUksSUFBSSxFQUFDO2dCQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUNwQix1Q0FBdUMsRUFBRTtvQkFDckMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO29CQUN2QixHQUFHLEVBQUUsR0FBRyxDQUFDLE9BQU87aUJBQ25CLENBQUMsQ0FDTCxDQUFDO2dCQUNGLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0NBQStDLElBQUksQ0FBQyxRQUFRLGtCQUFrQixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDM0csSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFDO29CQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0NBQStDLElBQUksQ0FBQyxRQUFRLHVCQUF1QixHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztpQkFDakg7YUFDSjtpQkFBTSxJQUFJLENBQUMsR0FBRyxFQUFDO2dCQUNaLElBQUksSUFBSSxFQUFDO29CQUNMLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsMENBQTBDLEVBQUU7d0JBQy9ELFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTt3QkFDdkIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFO3dCQUN0QyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUU7cUJBQ2xDLENBQUMsQ0FBQyxDQUFDO2lCQUNQO2dCQUNELGlDQUFpQztnQkFDakMsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7b0JBQ3JDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsOENBQThDLEVBQUUsRUFBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQztpQkFDekc7YUFDSjtZQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQzVCLENBQUM7UUFDRCxLQUFLLENBQUMsWUFBWTtZQUNkLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixNQUFNLHlCQUFTLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUNELFlBQVksQ0FBQyxNQUF1QjtZQUNoQyxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7WUFDbEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUM7UUFFbEQsQ0FBQztRQUNELEdBQUcsQ0FBQyxJQUFZO1lBQ1osSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUNELE9BQU8sQ0FBQyxJQUFZO1lBQ2hCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUMsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFDRCxLQUFLLENBQUMsSUFBWTtZQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUMsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFDRCxhQUFhO1FBQ2IsUUFBUTtZQUNKLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xELENBQUM7S0FDSjtDQUVKLENBQUMsQ0FBQztBQVNILE1BQU0sT0FBTyxHQUErRDtJQUN4RSxXQUFXLENBQUMsR0FBRyxJQUFJO1FBQ2YsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELFNBQVMsQ0FBQyxHQUFHLElBQUk7UUFDYixZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBQ0QsWUFBWSxDQUFDLEdBQUcsSUFBSTtRQUNoQixZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBQ0QsY0FBYyxDQUFDLEdBQUcsSUFBSTtRQUNsQixZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxjQUFjLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBQ0QsS0FBSyxDQUFDLElBQUk7UUFDTixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBQztZQUN4QixNQUFNLEVBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUMsR0FBRyxNQUFNLHFCQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBRTtZQUMzRSxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsTUFBTSxxQkFBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDdEQsTUFBTSxFQUFFLEdBQUcsSUFBSSxTQUFTLENBQUM7Z0JBQ3JCLEVBQUUsRUFBRyxJQUFZLENBQUUsQ0FBQyxDQUFDLEdBQUc7Z0JBQ3hCLElBQUksRUFBRTtvQkFDRixTQUFTO29CQUNULFFBQVE7b0JBQ1IsV0FBVztvQkFDWCxVQUFVO2lCQUNiO2FBQ0osQ0FBQyxDQUFDO1lBRUgsTUFBTSxXQUFXLEdBQUcsQ0FBQyxHQUFHLElBQXlFLEVBQUUsRUFBRTtnQkFDakcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQztZQUNGLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBRyxJQUF1RSxFQUFFLEVBQUU7Z0JBQzdGLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUMxQixDQUFDLENBQUM7WUFDRixNQUFNLFlBQVksR0FBRyxDQUFDLEdBQUcsSUFBK0UsRUFBRSxFQUFFO2dCQUN4RyxFQUFFLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDN0IsQ0FBQyxDQUFDO1lBQ0YsTUFBTSxjQUFjLEdBQUcsQ0FBQyxHQUFHLElBQXdFLEVBQUUsRUFBRTtnQkFDbkcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQy9CLENBQUMsQ0FBQztZQUVGLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFO2dCQUNuQixTQUFTLEVBQUUsRUFBRTtnQkFDYixXQUFXO2dCQUNYLFNBQVM7Z0JBQ1QsWUFBWTtnQkFDWixjQUFjO2FBQ2pCLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztDQUNKLENBQUM7QUFDRixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLFFBQVEsRUFBRSxTQUFTLENBQUE7O0tBRWxCO0lBQ0QsQ0FBQyxFQUFFO1FBQ0MsR0FBRyxFQUFFLE1BQU07S0FDZDtJQUNELE9BQU87SUFDUCxLQUFLLEVBQUUsUUFBUSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQStDZDtJQUNELEtBQUssQ0FBQyxLQUFLO1FBQ1AsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RSxJQUFJLE9BQU8sRUFBRTtZQUNULElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNmO0lBQ0wsQ0FBQztJQUNELEtBQUs7UUFDRCxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLElBQUksU0FBUyxFQUFFO1lBQ1gsU0FBUyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMvQixZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzdCO0lBQ0wsQ0FBQztDQUVKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFF1ZXJ5QmFrZVJlc3VsdCwgUmVmbGVjdGlvblByb2JlQmFrZUluZm8sIFJlZmxlY3Rpb25Qcm9iZUJyb2FkY2FzdCB9IGZyb20gJy4uL0B0eXBlcy9wcm90ZWN0ZWQnO1xuaW1wb3J0IHsgcXVlcnksIG9wZXJhdGlvbiB9IGZyb20gJy4vc2hhcmVkL3NjZW5lLW1lc3NhZ2UnO1xuXG5jb25zdCB2dWU6IHR5cGVvZiBpbXBvcnQoJ3Z1ZScpLmRlZmF1bHQgPSByZXF1aXJlKCd2dWUvZGlzdC92dWUnKTtcbnZ1ZS5jb25maWcuZGV2dG9vbHMgPSBmYWxzZTtcbnZ1ZS5jb25maWcucHJvZHVjdGlvblRpcCA9IGZhbHNlO1xuY29uc3QgcGFuZWxEYXRhTWFwID0gbmV3IFdlYWtNYXA8YW55LCBQYW5lbERhdGE+KCk7XG5jb25zdCBDb21wb25lbnQgPSB2dWUuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogLypodG1sICovYFxuICAgICAgICA8ZGl2IGNsYXNzPVwicmVmbGVjdGlvblByb2JlXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWFpblwiPlxuICAgICAgICAgICAgICAgIDx1aS1idXR0b24gdi1zaG93PVwiIWlzQmFraW5nXCIgdHlwZT1cInByaW1hcnlcIiBAY29uZmlybT1cInN0YXJ0QmFrZVwiPjx1aS1sYWJlbCB2YWx1ZT1cImkxOG46cmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5zdGFydF9iYWtlXCI+PC91aS1sYWJlbD48L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8dWktYnV0dG9uIHYtc2hvdz1cImlzQmFraW5nXCIgdHlwZT1cImRhbmdlclwiIEBjb25maXJtPVwic3RvcEJha2VcIj48dWktbGFiZWwgdmFsdWU9XCJpMThuOnJlZmxlY3Rpb24tcHJvYmUucGFuZWwuY2FuY2VsX2Jha2VcIj48L3VpLWxhYmVsPjwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDx1aS1idXR0b24gdHlwZT1cImRhbmdlclwiIDpkaXNhYmxlZD1cImlzQ2xlYXJpbmcgfHwgaXNCYWtpbmdcIiBAY29uZmlybT1cImNsZWFyUmVzdWx0c1wiPjx1aS1sYWJlbCB2YWx1ZT1cImkxOG46cmVmbGVjdGlvbi1wcm9iZS5wYW5lbC5jbGVhcl9yZXN1bHRcIj48L3VpLWxhYmVsPjwvdWktYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8dWktcHJvZ3Jlc3Mgdi1zaG93PVwiaXNCYWtpbmdcIiA6dmFsdWU9XCJwcm9ncmVzc1wiPjwvdWktcHJvZ3Jlc3M+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm91dHB1dFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHYtZm9yPVwiKGl0ZW0sIGluZGV4KSBpbiBsb2dJbmZvc1wiIDp0eXBlPVwiaXRlbS50eXBlXCIgOmtleT1cIml0ZW0ua2V5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2ID57eyBpdGVtLnRleHQgfX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+ICAgIFxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgIGAsXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgcHJvZ3Jlc3NMb2coKTogc3RyaW5nIHtcbiAgICAgICAgICAgIHJldHVybiBFZGl0b3IuSTE4bi50KCdyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmxvZy5zdGFydF9iYWtlJywge1xuICAgICAgICAgICAgICAgIGN1cnJlbnROdW06IHRoaXMuY3VycmVudE51bS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHRvdGFsTnVtOiB0aGlzLnRvdGFsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbm9kZU5hbWU6IHRoaXMuY3VycmVudEluZm8/Lm5vZGVOYW1lIHx8ICcnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnROdW0oKTogbnVtYmVyIHtcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5jdXJyZW50SW5mbyA/IDEgOiAwKSArIHRoaXMuZmluaXNoZWQubGVuZ3RoO1xuICAgICAgICB9LFxuICAgICAgICBpc0Jha2luZygpOiBib29sZWFuIHtcbiAgICAgICAgICAgIHJldHVybiBCb29sZWFuKHRoaXMucmVtYWluaW5nLmxlbmd0aCB8fCB0aGlzLmN1cnJlbnRJbmZvKTtcbiAgICAgICAgfSwgIFxuICAgICAgICBwcm9ncmVzcygpOiBudW1iZXJ7XG4gICAgICAgICAgICBpZiAodGhpcy50b3RhbCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDEwMCAqIHRoaXMuZmluaXNoZWQubGVuZ3RoIC8gdGhpcy50b3RhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9LFxuICAgICAgICB0b3RhbCgpOiBudW1iZXIge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluaXNoZWQubGVuZ3RoICsgdGhpcy5yZW1haW5pbmcubGVuZ3RoICsgKHRoaXMuY3VycmVudEluZm8gPyAxIDogMCApO1xuICAgICAgICB9LFxuICAgICAgICBpc0ZpcnN0QnVpbGQoKTogYm9vbGVhbntcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbmlzaGVkLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGRhdGE6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlbWFpbmluZzogW10gYXMgcmVhZG9ubHkgUmVmbGVjdGlvblByb2JlQmFrZUluZm9bXSxcbiAgICAgICAgICAgIGZpbmlzaGVkOiBbXWFzIHJlYWRvbmx5IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvW10sXG4gICAgICAgICAgICBsb2dJbmZvczogW10gYXMge3RleHQ6IHN0cmluZywgdHlwZTogJ3dhcm5pbmcnfCdlcnJvcid8J2xvZycsIGtleTogbnVtYmVyfVtdLFxuICAgICAgICAgICAgY3VycmVudEluZm86IG51bGwgYXMgUmVmbGVjdGlvblByb2JlQmFrZUluZm8gfCBudWxsLFxuICAgICAgICAgICAgaXNDbGVhcmluZzogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIG9uQ2xlYXJVcGRhdGVkKHZhbHVlOiBib29sZWFuKXtcbiAgICAgICAgICAgIHRoaXMuaXNDbGVhcmluZyA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBzdGFydEJha2UoKSB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTG9nKCk7XG4gICAgICAgICAgICBvcGVyYXRpb24oJ3N0YXJ0LWJha2UnKTtcbiAgICAgICAgICAgIEVkaXRvci5NZXRyaWNzLl90cmFja0V2ZW50V2l0aFRpbWVyKHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ2Jha2luZ1N5c3RlbScsXG4gICAgICAgICAgICAgICAgaWQ6ICdBMTAwMDE0JyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogMSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBzdG9wQmFrZSgpIHtcbiAgICAgICAgICAgIHRoaXMubG9nKEVkaXRvci5JMThuLnQoJ3JlZmxlY3Rpb24tcHJvYmUucGFuZWwubG9nLnN0YXJ0X2NhbmNlbCcsIHtub2RlTmFtZTogdGhpcy5jdXJyZW50SW5mbyEubm9kZU5hbWV9KSk7XG4gICAgICAgICAgICBvcGVyYXRpb24oJ2NhbmNlbC1iYWtlJyk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uQmFrZVN0YXJ0KGluZm86IFJlZmxlY3Rpb25Qcm9iZUJha2VJbmZvKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmZvID0gaW5mbztcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsKXtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZyh0aGlzLnByb2dyZXNzTG9nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25CYWtlRW5kKGVycjogRXJyb3IgfCAnY2FuY2VsJyB8IG51bGwsIGluZm8/OiBSZWZsZWN0aW9uUHJvYmVCYWtlSW5mbykge1xuICAgICAgICAgICAgaWYgKGVyciA9PT0gJ2NhbmNlbCcpe1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlbWFpbmluZy5sZW5ndGggPD0gMSl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nKEVkaXRvci5JMThuLnQoJ3JlZmxlY3Rpb24tcHJvYmUucGFuZWwubG9nLmNhbmNlbF9zdWNjZXNzJykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyICE9PSBudWxsICYmIGluZm8pe1xuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IoRWRpdG9yLkkxOG4udChcbiAgICAgICAgICAgICAgICAgICAgJ3JlZmxlY3Rpb24tcHJvYmUucGFuZWwubG9nLmJha2VfZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlTmFtZTogaW5mby5ub2RlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycjogZXJyLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBGYWlsZWQgdG8gYmFrZSByZWZsZWN0aW9uIHByb2JlIG9uIHRoZSBub2RlICR7aW5mby5ub2RlTmFtZX0gd2l0aCBlcnJvciA6ICAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhY2spe1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBGYWlsZWQgdG8gYmFrZSByZWZsZWN0aW9uIHByb2JlIG9uIHRoZSBub2RlICR7aW5mby5ub2RlTmFtZX0gd2l0aCBzdGFjayB0cmFjZSA6ICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWVycil7XG4gICAgICAgICAgICAgICAgaWYgKGluZm8pe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZyhFZGl0b3IuSTE4bi50KCdyZWZsZWN0aW9uLXByb2JlLnBhbmVsLmxvZy5iYWtlX2ZpbmlzaGVkJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IGluZm8ubm9kZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50TnVtOiB0aGlzLmN1cnJlbnROdW0udG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsTnVtOiB0aGlzLnRvdGFsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5rKh5pyJIGluZm8g5bCx5Luj6KGo5Zy65pmv5LiA5Liq5Y+N5bCE5o6i6ZKI6YO95rKh5pyJ55u05o6l6Kem5Y+R54OY54SZ57uT5p2fXG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvIHx8IHRoaXMucmVtYWluaW5nLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nKEVkaXRvci5JMThuLnQoJ3JlZmxlY3Rpb24tcHJvYmUucGFuZWwubG9nLmJha2VfYWxsX2ZpbmlzaGVkJywge251bTogdGhpcy50b3RhbC50b1N0cmluZygpfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3VycmVudEluZm8gPSBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBhc3luYyBjbGVhclJlc3VsdHMoKXtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJMb2coKTtcbiAgICAgICAgICAgIHRoaXMuaXNDbGVhcmluZyA9IHRydWU7XG4gICAgICAgICAgICBhd2FpdCBvcGVyYXRpb24oJ2NsZWFyLXJlc3VsdHMnKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25CYWtlVXBkYXRlKHJlc3VsdDogUXVlcnlCYWtlUmVzdWx0KSB7XG4gICAgICAgICAgICB0aGlzLnJlbWFpbmluZyA9IHJlc3VsdC5yZW1haW5pbmc7XG4gICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gcmVzdWx0LmZpbmlzaGVkO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5mbyA9IHJlc3VsdC5jdXJyZW50SW5mbyA/PyBudWxsO1xuXG4gICAgICAgIH0sXG4gICAgICAgIGxvZyh0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIHRoaXMubG9nSW5mb3MucHVzaCh7dGV4dCwgdHlwZTogJ2xvZycsIGtleTogcGVyZm9ybWFuY2Uubm93KCkgKyBNYXRoLnJhbmRvbSgpfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHdhcm5pbmcodGV4dDogc3RyaW5nKXtcbiAgICAgICAgICAgIHRoaXMubG9nSW5mb3MucHVzaCh7dGV4dCwgdHlwZTogJ3dhcm5pbmcnLCBrZXk6IHBlcmZvcm1hbmNlLm5vdygpICsgTWF0aC5yYW5kb20oKX0pO1xuICAgICAgICB9LFxuICAgICAgICBlcnJvcih0ZXh0OiBzdHJpbmcpe1xuICAgICAgICAgICAgdGhpcy5sb2dJbmZvcy5wdXNoKHt0ZXh0LCB0eXBlOiAnZXJyb3InLCBrZXk6IHBlcmZvcm1hbmNlLm5vdygpICsgTWF0aC5yYW5kb20oKX0pO1xuICAgICAgICB9LFxuICAgICAgICAvKiog5riF56m65omA5pyJ5pel5b+XICovXG4gICAgICAgIGNsZWFyTG9nKCkge1xuICAgICAgICAgICAgdGhpcy5sb2dJbmZvcy5zcGxpY2UoMCwgdGhpcy5sb2dJbmZvcy5sZW5ndGgpO1xuICAgICAgICB9LFxuICAgIH0sXG5cbn0pO1xuaW50ZXJmYWNlIFBhbmVsRGF0YSB7XG4gICAgY29tcG9uZW50OiBJbnN0YW5jZVR5cGU8dHlwZW9mIENvbXBvbmVudD4sXG4gICAgb25CYWtlU3RhcnQoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1zdGFydCddPik6IHZvaWQsXG4gICAgb25CYWtlRW5kKC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOmJha2UtZW5kJ10+KTogdm9pZCxcbiAgICBvbkJha2VVcGRhdGUoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6dXBkYXRlLWJha2UtaW5mbyddPik6IHZvaWQsXG4gICAgb25DbGVhclVwZGF0ZWQoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6Y2xlYXItZW5kJ10+KTogdm9pZCxcbn1cblxuY29uc3QgbWV0aG9kczogT21pdDxQYW5lbERhdGEsICdjb21wb25lbnQnPiAmIHtpbml0OiAoKSA9PiBQcm9taXNlPHZvaWQ+fSA9IHtcbiAgICBvbkJha2VTdGFydCguLi5hcmdzKSB7XG4gICAgICAgIHBhbmVsRGF0YU1hcC5nZXQodGhpcyk/LmNvbXBvbmVudC5vbkJha2VTdGFydCguLi5hcmdzKTtcbiAgICB9LFxuICAgIFxuICAgIG9uQmFrZUVuZCguLi5hcmdzKXtcbiAgICAgICAgcGFuZWxEYXRhTWFwLmdldCh0aGlzKT8uY29tcG9uZW50Lm9uQmFrZUVuZCguLi5hcmdzKTtcbiAgICB9LFxuICAgIG9uQmFrZVVwZGF0ZSguLi5hcmdzKXtcbiAgICAgICAgcGFuZWxEYXRhTWFwLmdldCh0aGlzKT8uY29tcG9uZW50Lm9uQmFrZVVwZGF0ZSguLi5hcmdzKTtcbiAgICB9LFxuICAgIG9uQ2xlYXJVcGRhdGVkKC4uLmFyZ3Mpe1xuICAgICAgICBwYW5lbERhdGFNYXAuZ2V0KHRoaXMpPy5jb21wb25lbnQub25DbGVhclVwZGF0ZWQoLi4uYXJncyk7ICAgICAgICAgICBcbiAgICB9LCAgICBcbiAgICBhc3luYyBpbml0KCl7XG4gICAgICAgIGlmICghcGFuZWxEYXRhTWFwLmdldCh0aGlzKSl7XG4gICAgICAgICAgICBjb25zdCB7cmVtYWluaW5nLCBmaW5pc2hlZCwgY3VycmVudEluZm99ID0gYXdhaXQgcXVlcnkoJ3F1ZXJ5LWJha2UtaW5mbycpIDtcbiAgICAgICAgICAgIGNvbnN0IGlzQ2xlYXJpbmcgPSAhIWF3YWl0IHF1ZXJ5KCdxdWVyeS1pcy1jbGVhcmluZycpO1xuICAgICAgICAgICAgY29uc3Qgdm0gPSBuZXcgQ29tcG9uZW50KHtcbiAgICAgICAgICAgICAgICBlbDogKHRoaXMgYXMgYW55KSAuJC5hcHAsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmcsXG4gICAgICAgICAgICAgICAgICAgIGZpbmlzaGVkLFxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SW5mbyxcbiAgICAgICAgICAgICAgICAgICAgaXNDbGVhcmluZyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9uQmFrZVN0YXJ0ID0gKC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOmJha2Utc3RhcnQnXT4pID0+IHtcbiAgICAgICAgICAgICAgICB2bS5vbkJha2VTdGFydCguLi5hcmdzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBvbkJha2VFbmQgPSAoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6YmFrZS1lbmQnXT4pID0+IHtcbiAgICAgICAgICAgICAgICB2bS5vbkJha2VFbmQoLi4uYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgb25CYWtlVXBkYXRlID0gKC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVmbGVjdGlvblByb2JlQnJvYWRjYXN0WydyZWZsZWN0aW9uLXByb2JlOnVwZGF0ZS1iYWtlLWluZm8nXT4pID0+IHtcbiAgICAgICAgICAgICAgICB2bS5vbkJha2VVcGRhdGUoLi4uYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3Qgb25DbGVhclVwZGF0ZWQgPSAoLi4uYXJnczogUGFyYW1ldGVyczxSZWZsZWN0aW9uUHJvYmVCcm9hZGNhc3RbJ3JlZmxlY3Rpb24tcHJvYmU6Y2xlYXItZW5kJ10+KSA9PiB7XG4gICAgICAgICAgICAgICAgdm0ub25DbGVhclVwZGF0ZWQoLi4uYXJncyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBwYW5lbERhdGFNYXAuc2V0KHRoaXMsIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQ6IHZtLFxuICAgICAgICAgICAgICAgIG9uQmFrZVN0YXJ0LFxuICAgICAgICAgICAgICAgIG9uQmFrZUVuZCxcbiAgICAgICAgICAgICAgICBvbkJha2VVcGRhdGUsXG4gICAgICAgICAgICAgICAgb25DbGVhclVwZGF0ZWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG59O1xubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3IuUGFuZWwuZGVmaW5lKHtcbiAgICB0ZW1wbGF0ZTogLypodG1sICovYFxuICAgIDxkaXYgaWQ9XCJhcHBcIj48L2Rpdj5cbiAgICBgLFxuICAgICQ6IHtcbiAgICAgICAgYXBwOiAnI2FwcCcsXG4gICAgfSxcbiAgICBtZXRob2RzLFxuICAgIHN0eWxlOiAvKmNzcyAqL2BcbiAgICAgICAgLnJlZmxlY3Rpb25Qcm9iZSB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgICBwYWRkaW5nOiAzMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLm1haW4ge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgLm1haW4gPiB1aS1idXR0b24ge1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbToxNXB4O1xuICAgICAgICAgICAgd2lkdGg6IDIwMHB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLmZvb3RlciB7XG4gICAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgICAgbWluLWhlaWdodDogMTIwcHg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1ub3JtYWwtZmlsbC1lbXBoYXNpcyk7XG4gICAgICAgICAgICBvdmVyZmxvdzogYXV0bztcbiAgICAgICAgICAgIG1hcmdpbjogMCAxNHB4IDE0cHggMTRweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDdweCAxNHB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC5vdXRwdXQge1xuICAgICAgICAgICAgcGFkZGluZy1ib3R0b206IDIwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAub3V0cHV0ID4gZGl2W3R5cGU9XCJlcnJvclwiXSB7XG4gICAgICAgICAgICBjb2xvcjogdmFyKC0tY29sb3ItZGFuZ2VyLWZpbGwtbm9ybWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5vdXRwdXQgPiBkaXZbdHlwZT1cIndhcm5pbmdcIl0ge1xuICAgICAgICAgICAgY29sb3I6IHZhcigtLWNvbG9yLXdhcm4tZmlsbCk7XG4gICAgICAgIH1cblxuICAgICAgICB1aS1wcm9ncmVzcyB7XG4gICAgICAgICAgICBtYXJnaW46IDE0cHg7XG4gICAgICAgIH1cbiAgICBgLFxuICAgIGFzeW5jIHJlYWR5KCkge1xuICAgICAgICBjb25zdCBpc1JlYWR5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktaXMtcmVhZHknKTtcbiAgICAgICAgaWYgKGlzUmVhZHkpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBjbG9zZSgpe1xuICAgICAgICBjb25zdCBwYW5lbERhdGEgPSBwYW5lbERhdGFNYXAuZ2V0KHRoaXMpO1xuICAgICAgICBpZiAocGFuZWxEYXRhKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuY29tcG9uZW50LiRkZXN0cm95KCk7XG4gICAgICAgICAgICBwYW5lbERhdGFNYXAuZGVsZXRlKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxufSk7Il19