/**
 * 用于创建 iframe 并与 iframe 交互，让 iframe 向 google g4 发送事件
 */
import { IGoogleG4Data, IGoogleG4Event } from '../../@types/private';

let onReportBind: OmitThisParameter<() => Promise<void>> | null = null;

let lastOnline = false;
module.exports = Editor.Panel.define({
    template: `<webview class="view"></webview>`,

    // 不能设置 display: none, width: 0.1 height: 0.1，
    // 防止浏览器进入节流状态，导致 setTimeout，setInterval 越来越慢
    style: `
        .view {
            opacity: 0;
            width: 1px;
            height: 1px;
            display: block;
        }
    `,

    $: {
        iframe: '.view',
    },

    methods: {
        async postMessage(events: IGoogleG4Event[]) {
            const webview = this.$.iframe as HTMLIFrameElement;
            if (webview && webview.contentWindow) {
                webview.contentWindow.postMessage({ tag: 'g4', events }, '*');
            }
        },

        async report(reportEvents?: IGoogleG4Event[]) {
            const data: IGoogleG4Data = await Editor.Message.request('metrics', 'query-google-v4-data');
            const events = reportEvents || data.reportEvents;
            if (events.length > 0) {
                void this.postMessage(events);
            }
        },
    },

    async ready() {
        const googleG4Data: IGoogleG4Data = await Editor.Message.request('metrics', 'query-google-v4-data');
        const webview = this.$.iframe as HTMLIFrameElement;
        webview.src = googleG4Data.htmlUrl;
        webview.addEventListener('dom-ready', async () => {
            this.postMessage([{
                name: 'init',
                params: googleG4Data.firstTimestamp,
            }]).then(async () => {
                await this.report(googleG4Data.reportEvents);
            });
        });

        const openDevTools = false;//await Editor.Profile.getConfig('metrics', 'googleG4.openDevTools');
        webview.addEventListener('devtools-opened', () => {
            if (!openDevTools) {
                // @ts-expect-error
                webview.closeDevTools();
            }
        });

        if (openDevTools) {
            // @ts-expect-error
            webview.openDevTools();
        }

        // 联网了，就重启
        lastOnline = window.navigator.onLine;
        window.addEventListener('online', function() {
            if (!lastOnline) {
                lastOnline = window.navigator.onLine;
                // @ts-expect-error
                webview.reload();
            }
        });
        window.addEventListener('offline', function() {
            lastOnline = window.navigator.onLine;
        });

        onReportBind = this.report.bind(this);
        Editor.Message.__protected__.addBroadcastListener('metrics:google-v4-report-change', onReportBind);
    },

    async close() {
        if (onReportBind) {
            Editor.Message.__protected__.removeBroadcastListener('metrics:google-v4-report-change', onReportBind);
        }
    },
});
