"use strict";const Vue=require("vue/dist/vue.js"),ipc=(Vue.config.productionTip=!1,Vue.config.devtools=!1,require("@base/electron-base-ipc"));exports.style=`
:host {
    padding-left: 8px;
}

.footer-notice {
    display: flex;
    align-items: center;
    height: 24px
}

.footer-notice .bell {
    padding: 0;
    cursor: pointer;
    user-select: none;
    background: none;
    border: none;
    color: var(--color-normal-contrast);
}

.footer-notice .bell:hover {
    color: var(--color-active-contrast-weakest);
}

.footer-notice .bell:active {
    transform: scale(1.1);
}

.footer-notice .bell-content {
    display: none;
    position: absolute;
    bottom: 30px;
    right: 5px;
    z-index: 500;
    min-width: 250px;
    max-width: 400px;
    border: 1px solid var(--color-normal-border);
    border-radius: 3px;
    background-color: var(--color-normal-fill-emphasis);
}

.footer-notice .bell-content[active="true"] {
    display: block;
}

.footer-notice .bell-content .close {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
}

.footer-notice .bell-content .close:hover {
    color: var(--color-danger-fill);
}

.footer-notice .bell-content .title {
    display: flex;
    align-items: center;
    color: var(--color-normal-contrast);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding-right: 12px;
}

.footer-notice .bell-content .title .notify {
    display: flex;
    flex: 1;
    padding: 4px 12px;
}

.footer-notice .bell-content .title .hide {
    margin-right: 16px;
    cursor: pointer;
    font-size: 9px;
    transform: rotate(90deg);
}

.footer-notice .bell-content .title .clear {
    cursor: pointer;
    font-size: 10px;
}

.footer-notice .bell-content .title .hide:active {
    color: var(--color-active-contrast-weakest);
    transform: rotate(90deg) scale(1.2);
}
.footer-notice .bell-content .title .clear:active {
    color: var(--color-active-contrast-weakest);
    transform: scale(1.2);
}

.footer-notice .bell-content .content {
    display: block;
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: 200px;
    text-align: left;
    overflow: auto;
    background-color: var(--color-normal-fill);
}

.footer-notice .bell-content .content .item {
    position: relative;
    padding: 5px 20px 5px 15px;
    margin-top: 5px;
    margin-bottom: 5px;
}

.footer-notice .bell-content .content .item:before {
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 100%;
    content: '';
    background-color: var(--color-normal-contrast);
}

.footer-notice .bell-content .content .item[type="error"]>.title {
    color: var(--color-danger-fill-weaker);
}

.footer-notice .bell-content .content .item[type="error"]:before {
    background-color: var(--color-danger-fill);
}

.footer-notice .bell-content .content .item[type="warn"]>.title {
    color: var(--color-warn-fill);
}

.footer-notice .bell-content .content .item[type="warn"]:before {
    background-color: var(--color-warn-fill);
}

.footer-notice .bell-content .content .item[type="success"]>.title {
    color: var(--color-success-fill);
}

.footer-notice .bell-content .content .item[type="success"]:before {
    background-color: var(--color-success-fill);
}

.footer-notice .bell-content .content .item:hover {
    background-color: var(--color-hover-fill);
}

.footer-notice .bell-content .content .item:hover .clear {
    display: block;
}

.footer-notice .bell-content .content .clear {
    position: absolute;
    top: 2px;
    right: 12px;
    color: var(--color-normal-contrast);
    cursor: pointer;
    display: none;
}

.footer-notice .bell-content .content .clear:active {
    color: var(--color-normal-contrast-emphasis);
    transform: scale(1.2);
}

.footer-notice .bell-content .content .source {
    font-size: 0.9em;
    color: var(--color-normal-contrast-weakest);
    line-height: 10px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin: 5px 0;
}

.footer-notice .bell-content .content .message {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 30;
    overflow: hidden;
}

.footer-notice .bell-content .content .button {
    padding-top: 4px;
}

.footer-notice .bell-content .content .button ui-button {
    margin-right: 6px;
}
`,exports.template=`
<div class="footer-notice">
    <ui-button class="bell transparent"
        @click="notify.active=!notify.active"
    >
        <ui-icon value="bell"></ui-icon>
        <span class="notify">{{notify.list.length}}</span>
    </ui-button>

    <div class="bell-content"
        :active="notify.active"
    >
        <div class="title">
            <ui-label class="notify" value="i18n:startup.notify"></ui-label>
            <ui-icon class="hide" value="arrow-right" tooltip="i18n:utils.info.notice.hide"
                @click="notify.active=false"
            ></ui-icon>
            <ui-icon class="clear" value="close" tooltip="i18n:utils.info.notice.clear"
                @click="removeAllNotices()"
            ></ui-icon>
        </div>

        <ul class="content" ref="content">
            <li class="item" 
                v-for="item in notify.list"
                :type="item.type"
                @mouseenter="keepNotice(item.id, true, item.timeout)"
                @mouseleave="keepNotice(item.id, false, item.timeout)"
            >
                <div class="title" >{{item.title}}</div>
                <div class="message">{{item.message}}</div>
                <div class="source"
                    v-if="item.source"
                    :title="item.message"
                >
                    <ui-label value="i18n:startup.notify_source"></ui-label>
                    <ui-label 
                        :value="item.source"
                    ></ui-label>
                </div>
                <div class="button"
                    v-if="item.buttons && item.buttons.length > 0"
                >
                    <ui-button
                        v-for="(button, index) in item.buttons"
                        :key="index"
                        @confirm="onButtonClick(button)"
                    >
                        <ui-label>{{button.label || 'i18n:utils.notice.default.button_name'}}</ui-label>
                    </ui-button>
                </div>
                <span class="clear" title="Clear"
                    @click="removeNotice(item.id)"
                >
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path fill="currentColor" d="m630.47 511.29l297.94-297.94c32.911-32.911 32.911-86.27.0001-119.18-32.909-32.909-86.27-32.911-119.18 0l-297.94 297.94-297.94-297.94c-32.911-32.911-86.27-32.911-119.18 0-32.909 32.909-32.911 86.27 0 119.18l297.94 297.94-297.94 297.94c-32.911 32.911-32.911 86.27 0 119.18 32.909 32.911 86.27 32.911 119.18 0l297.94-297.94 297.94 297.94c32.912 32.911 86.27 32.909 119.18 0 32.911-32.911 32.911-86.27 0-119.18l-297.94-297.95"/></svg>
                </span>
            </li>
        </ul>
    </div>
</div>
`,exports.$={footerNotice:".footer-notice"},exports.methods={noticeMessage(e,t,o){const i=this;if(i.vm&&t&&o)if("add-notice"===t)i.vm.notify.list.push(o),i.vm.notify.active=!0,i.vm.$nextTick(()=>{var e=i.vm.$refs.content;e&&(e.scrollTop=e.scrollHeight)});else{for(let e=0;e<i.vm.notify.list.length;e++)if(i.vm.notify.list[e].id===o.id){i.vm.notify.list.splice(e,1);break}0===i.vm.notify.list.length&&(i.vm.notify.active=!1)}}},exports.ready=function(){var e=this,t=(e.vm?.$destroy(),new Vue({el:e.$.footerNotice,data:{notify:{active:!1,list:[]}},methods:{removeAllNotices(){this.notify.list.forEach(e=>{this.removeNotice(e.id)}),this.notify.list=[],this.notify.active=!1},removeNotice(e){ipc.sendSync("editor-lib-task:call","removeNotice",e)},keepNotice(e,t,o){ipc.sendSync("editor-lib-task:call","changeNoticeTimeout",e,t?-1:o)},onButtonClick(e){var t,o;if(e.message)return"string"==typeof e.message?e.target?void Editor.Message.send(e.target,e.message,...e.params||[]):void console.warn(Editor.I18n.t("utils.notice.missing.target")):({name:e,target:t,params:o}=e.message,void Editor.Message.send(t,e,...o||[]));console.warn(Editor.I18n.t("utils.notice.missing.message"))}}})),o=(e.vm=t,e._noticeMessage=e.noticeMessage.bind(e),Editor.Task.queryNotices());(t.notify.list=o).length&&(t.notify.active=!0),ipc.on("editor-lib-task:emit",e._noticeMessage)},exports.close=function(){var e=this;ipc.removeListener("editor-lib-task:emit",e._noticeMessage),e.vm?.$destroy(),e.vm=null};