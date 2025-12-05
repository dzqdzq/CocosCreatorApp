"use strict";const Vue=require("vue/dist/vue.js"),qrcode=require("qrcode"),basename=require("path")["basename"];let vm=null;exports.style=`
:host {
    display: flex;
}

.preview-info-wrap {
    display: flex;
}

.preview-info {
    display: flex;
    border-radius: calc(var(--size-normal-radius) * 2px);
    border: 1px solid var(--color-default-border);
}

.preview-info > .transparent {
    border-radius: 0;
    height: 22px;
}

.preview-info > .transparent:last-child {
    border-right: none;
    border-top-right-radius: calc(var(--size-normal-radius) * 2px);
    border-bottom-right-radius: calc(var(--size-normal-radius) * 2px);
}

.preview-info ul {
    padding: 0;
    margin: 0;
    position: absolute;
    z-index: 99;
    left: 0;
    top: 26px;
    padding: 4px;
    background: var(--color-normal-fill);
    color: var(--color-default-contrast);
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid var(--color-default-border);
}

.preview-info ul > li {
    list-style: block;
    white-space: nowrap;
    text-align: left;
    box-sizing: border-box;
    cursor: pointer;
    border-radius: 2px;
    padding-right: 4px;
    line-height: 20px;
}

.prefix, .suffix{
    color: var(--color-default-contrast-emphasis);
    background-color: transparent;
}

.prefix {
    padding: 0 4px;
}

.suffix {
    margin-left: 16px;
    color: var(--color-default-fill-weakest);
}

.preview-info ul > li:hover {
    background: var(--color-hover-fill);
    color: var(--color-focus-contrast-emphasis);
}

.preview-info ul > li:active {
    background: var(--color-default-fill-emphasis);
    color: var(--color-focus-contrast-emphasis);
}

.preview-info ul > li > ui-icon {
    font-size: 14px;
}

.preview-info .play,
.preview-info .pause,
.preview-info .step {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    border-right: 1px solid var(--color-default-border);
    padding: 0;
}

.preview-info .step {
    border: none;
}

.preview-info .play[active=true],
.preview-info .pause[active=true],
.preview-info .step[active=true] {
    background: var(--color-info-fill-important);
    color: var(--color-info-contrast-important);
}


.preview-info .platform {
    display: flex;
    position: relative;
    overflow: visible;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 4px 0 8px;
    border-top-left-radius: calc(var(--size-normal-radius) * 2px);
    border-top-right-radius: 0;
    border-bottom-left-radius: calc(var(--size-normal-radius) * 2px);
    border-bottom-right-radius: 0;
    border-right: 1px solid var(--color-default-border);
}

.preview-info .platform:hover {
    color: var(--color-focus-contrast-emphasis);
    background-color: var(--color-default-fill-weaker);
}

.preview-info .platform .browser {
    padding: 0 4px 0 0;
    font-size: 14px;
    line-height: 0;
}

.preview-info .platform > ul {
    max-height: 150px;
    overflow: auto;
}

.preview-info .scene {
    position: relative;
    overflow: visible;
    height: 22px;
    cursor: pointer;
    line-height: 22px;
    padding: 0 4px 0 8px;
    border-right: 1px solid var(--color-default-border);
    border-radius: 0;
    display: flex;
    align-items: center;
}

.preview-info .scene:hover {
    color: var(--color-focus-contrast-emphasis);
    background-color: var(--color-default-fill-weaker);
}

.preview-info .scene .title {
    width: 84px;
    white-space: nowrap;
}

.preview-info .reload ui-icon {
    width: 20px;
    cursor: pointer;
}

.preview-info .scene > ul {
    width: 240px;
    max-height: 200px;
    overflow: auto;
}

.preview-info .scene > ul > li {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
    padding: 2px 4px;
}

.preview-info .scene > ul > li:first-child {
    border-bottom: 1px solid var(--color-hover-fill-weaker);
}

.preview-info .scene > ul > li[active] {
    color: var(--color-focus-contrast-emphasis);
}

.preview-info .scene-url {
    display: flex;
    font-size: 11px;
    line-height: 14px;
    color: var(--color-normal-contrast-emphasis);
    align-items: center;
}

.preview-info .scene-url .location:hover {
    color: var(--color-focus-border-weakest);
}

.preview-info .scene-url .scene-url-name {
    flex: 1;
    direction: rtl;
}

.preview-info .arrow-triangle {
    font-size: 12px;
}

.preview-info .sub-triangle-icon {
    font-size: 12px;
}

.preview-info .reload {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    padding-left: 5px;
    padding-right: 5px;
    border-top-left-radius: 0;
    border-top-right-radius: 3px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 3px;
}

.qr-wrap {
    position: relative;
}

.qr-wrap ui-button {
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid var(--color-default-border-important);
    margin-left: 8px;
    border-radius: calc(var(--size-normal-radius) * 2px);
}

.qr-code {
    width: 24px;
}

.qr {
    display: flex;
    position: absolute;
    background: var(--color-normal-fill-important);
    border: 1px solid var(--color-default-border-important);
    z-index: 999;
    top: 26px;
    left: 8px;
    flex-direction: column;
    padding: 18px 12px 12px 12px;
    border-radius: calc(var(--size-normal-radius) * 2px);
    opacity: 1;
    text-align: center;
}

.qr ui-icon {
    cursor: pointer;
}

.qr ui-label {
    cursor: text;
    user-select: text;
    white-space: nowrap;
    color: var(--color-default-fill-weakest);
    line-height: 20px;
}

.canvas {
    width: 120px;
    height: 120px;
    margin: 0 auto 16px;
    border-radius: calc(var(--size-normal-radius) * 2px);
}

.address {
    font-size: 12px;
    line-height: 22px;
    white-space: nowrap;
}

.address .copy {
    opacity: 0.7;
}

.address .copy:active {
    opacity: 1;
}

`,exports.template=`
<div class="preview-info-wrap" @dblclick.stop>
    <div class="preview-info">
        <div class="platform transparent" 
            @click.stop="visiblePlatformList"
        >
            <ui-icon class="browser"
            :value="platformsIcon[currPlatform].prefix"
            ></ui-icon>
            <ui-icon value="arrow-triangle" class="sub-triangle-icon"></ui-icon>
            <ul v-show="isShowPlatformsList">
                <li v-for="platform in platforms" @click.stop="changePlatform(platform)">
                    <ui-icon 
                        class="prefix" 
                        :value="platformsIcon[platform].prefix"
                    ></ui-icon>
                    <ui-label 
                        :value="'i18n:preview.'+platform"
                    ></ui-label>
                    <ui-icon class="suffix" color
                        v-if="platformsIcon[platform].suffix" 
                        :value="platformsIcon[platform].suffix"
                        :tooltip="'i18n:preview.tips.'+platformsIcon[platform].suffix"
                    ></ui-icon>
                </li>
            </ul>
        </div>
        <div class="scene transparent" 
            @click.stop="visibleSelectList" 
        >
            <ui-label class="title"
                :value="curSelectScene.name===''?'i18n:preview.current_scene':curSelectScene.name"
            ></ui-label>
            <ui-icon value="arrow-triangle" class="arrow-triangle"></ui-icon>
            <ul class="scene_list" 
                v-show="isShowSceneList"
            >
                <li 
                    :title="curSceneUrl" 
                    :active="curSelectScene.name===''"
                    @click.stop="_onSettingsChanged('current_scene', 'general.start_scene', {name: ''})"
                >
                    <ui-label value="i18n:preview.current_scene"></ui-label>
                </li>
                
                <li v-for="scene in scenes"
                    :value="scene.uuid"
                    :title="scene.url"
                    :active="curSelectScene.url===scene.url"
                    @click.stop="_onSettingsChanged(scene.uuid, 'general.start_scene', scene)"
                >
                    <div class="scene-name">{{scene.name}}</div>
                    <div class="scene-url">
                        <ui-icon class="location" value="location" tooltip="i18n:ENGINE.assets.locate_asset"
                            @click.stop="_onLocation(scene.uuid)"
                        ></ui-icon>
                        <ui-label class="scene-url-name">{{scene.url}}</ui-label>
                    </div>
                </li>
            </ul>
        </div>
        <ui-button class="play transparent"
            :active="currPlatform==='gameView' && gameView.isPlay"
            @click="play()"
        >
            <ui-loading v-if="currPlatform ==='browser' && isLoading"></ui-loading>
            <ui-icon v-else
                :value="gameView.isPlay ? 'stop' : 'play'"
            ></ui-icon>
        </ui-button>
        <ui-button :disabled="!gameView.isPlay" class="pause transparent"
            v-if="currPlatform==='gameView'"
            :active="currPlatform==='gameView' && gameView.isPaused"
            @click="gameViewPause()"
        >
            <ui-icon value="pause"></ui-icon>
        </ui-button>
        <ui-button class="step transparent" tooltip="i18n:preview.step"
            v-if="currPlatform==='gameView'" 
            @click="gameViewStep()"
        >
            <ui-icon value="next-step"></ui-icon>
        </ui-button>
        
        <ui-button class="reload transparent" tooltip="i18n:preview.refresh_device"
            v-if="currPlatform ==='browser'"
            @click="reload"
        >
            <ui-icon value="reset"></ui-icon>
        </ui-button>
    </div>
    <div class="qr-wrap">
        <ui-button
            class="transparent" 
            v-if="currPlatform ==='browser' || currPlatform ==='gameView'"
            @click.stop="showQR"
        >
            <ui-icon value="qr-code"></ui-icon>
        </ui-button>
        <div class="qr active" ref="qr" v-show="isShowQR"
            @click.stop
        >
            <canvas ref="qrcanvas" class="canvas"></canvas>
            <div class="address">
                <ui-label :value="address"></ui-label>
                <ui-icon class="copy" value="copy" tooltip="i18n:preview.copy" @click="copyAddress"></ui-icon>
            </div>
            <ui-label value="i18n:preview.scan"></ui-label>
        </div>
    </div>
</div>
`;const collator=new Intl.Collator("en",{numeric:!0,sensitivity:"base"});exports.$={platform:".platform",play:".play",reload:".reload",preview_info:".preview-info",preview_info_wrap:".preview-info-wrap"},exports.ready=function(){const e=this;e.vm?.$destroy();var i=new Vue({el:this.$.preview_info_wrap,data:{scenes:[],platforms:["browser","gameView","simulator"],platformsIcon:{browser:{prefix:"sphere",suffix:""},gameView:{prefix:"scene",suffix:"experiment"},simulator:{prefix:"mini-game",suffix:""}},gameView:{isPlay:!1,isPaused:!1,isStep:!1},currPlatform:"browser",isLoading:!1,isPlaying:!1,isShowSceneList:!1,isShowPlatformsList:!1,curSelectScene:{},curSceneUrl:null,previewIp:"",previewPort:"",address:"",isShowQR:!1},watch:{currPlatform:async function(e){await Editor.Profile.setConfig("scene","console.extend.clearOnPlay.show","gameView"===e,"global"),Editor.Message.send("console","update-extension-visible")}},mounted(){this.curSelectScene={name:""},this._refreshScenes(),Editor.Message.addBroadcastListener("scene:preview-stop",()=>{this.gameView={isPlay:!1,isPaused:!1,isStep:!1}}),this.handleOnPortChange(),this.handleOnIPChange(),Editor.Profile.getConfig("preview","preview.current.platform","local").then(e=>{console.debug("[Preview] change platform: "+e),this.platformsIcon[e]||(e="browser"),this.currPlatform=e,Editor.Message.send("preview","change-platform",e)})},methods:{updateAddress(){this.address=this.previewIp+":"+this.previewPort,qrcode.toCanvas(this.$refs.qrcanvas,`http://${this.address}/`,{errorCorrectionLevel:"H",maskPattern:2,margin:1,width:120,height:120})},copyAddress(){Editor.Clipboard.write("text",this.address),console.info("Finish copying: "+this.address)},async updateIp(){this.previewPort=await Editor.Message.request("server","query-port"),this.previewIp=await Editor.Message.request("preview","get-preview-ip"),this.updateAddress()},showQR(){this.hidePlatformList(),this.hideSelectList(),this.isShowQR=!this.isShowQR,this.isShowQR&&this.updateIp()},hideQR(){this.isShowQR=!1},_onSettingsChanged(e,i,r){this.curSelectScene=r,Editor.Profile.setConfig("preview",i,e,"local"),this.isShowSceneList=!1},_onLocation(e){Editor.Message.request("assets","ui-kit:touch-asset",e)},handleOnPortChange(){Editor.Message.addBroadcastListener("preview:port-change",e=>{this.previewPort=e,this.updateAddress()})},handleOnIPChange(){Editor.Message.addBroadcastListener("preview:ip-change",e=>{this.previewIp=e,this.updateAddress()})},async _playWithGameView(){var e=!this.gameView.isPlay,i=(Editor.Metrics.trackTimeStart("preview:ready-gameView"),await Editor.Message.request("scene","editor-preview-set-play",e));Editor.Metrics.trackTimeEnd("preview:ready-gameView"),this.gameView.isPlay=i?e:!e},async _playWithoutGameView(){if(!this.isLoading){this.isLoading=!0;try{await Editor.Message.request("preview","open-terminal",!1)}finally{this.isLoading=!1}}},async play(){if(!this.isPlaying){this.isPlaying=!0;try{"gameView"===this.currPlatform?await this._playWithGameView():await this._playWithoutGameView()}catch(e){throw e}finally{this.isPlaying=!1,Editor.Metrics.trackEvent({sendToNewCocosAnalyticsOnly:!0,category:"view",value:{A100000:this.currPlatform,A100001:Editor.Project.uuid}})}}},async gameViewPause(){this.isPlaying||!this.gameView.isPlay||this.gameView.isStep&&this.gameView.isPaused||("gameView"===this.currPlatform&&(this.gameView.isPaused=!this.gameView.isPaused),!1===await Editor.Message.request("scene","editor-preview-call-method","pause",this.gameView.isPaused)&&(this.gameView.isPaused=!this.gameView.isPaused))},async gameViewStep(){this.isPlaying||(this.gameView.isPlay?(this.gameView.isStep=!0,await this.gameViewPause(),Editor.Message.request("scene","editor-preview-call-method","step"),this.gameView.isStep=!1):await Editor.Message.request("scene","editor-preview-set-play",!0)&&(this.gameView.isPlay=!0,await this.gameViewPause()))},reload(){Editor.Message.send("preview","reload-terminal")},async changePlatform(e){this.changePlatform!==e&&("gameView"===this.currPlatform&&(this.gameView.isPlay||this.isPlaying)&&"gameView"!==e&&(await this.play(),this.gameView.isPlay=!1,this.gameView.isPaused=!1,this.isPlaying=!1),Editor.Profile.setConfig("preview","preview.current.platform",e,"local"),this.currPlatform=e,Editor.Message.send("preview","change-platform",e),this.isShowPlatformsList=!1)},visibleSelectList(){this._refreshScenes(),this.hidePlatformList(),this.hideQR(),this.isShowSceneList=!this.isShowSceneList},visiblePlatformList(){this.hideSelectList(),this.hideQR(),this.isShowPlatformsList=!this.isShowPlatformsList},hideSelectList(){this.isShowSceneList=!1},hidePlatformList(){this.isShowPlatformsList=!1},async _refreshScenes(){var e=await Editor.Message.request("asset-db","query-assets",{ccType:"cc.SceneAsset",pattern:"!db://internal/default_file_content/**/*"});const i=await Editor.Message.request("scene","query-current-scene");if(e){const t=await Editor.Profile.getConfig("preview","general.start_scene");var r=e.find(e=>e.uuid===t);r&&(this.curSelectScene={name:this.splitName(r.name),uuid:r.uuid,url:r.url}),this.scenes=e.map(e=>(e.uuid===i&&(this.curSceneUrl=e.url),{uuid:e.uuid,name:this.splitName(basename(e.source)),url:e.url})).sort((e,i)=>collator.compare(e.name,i.name))}},splitName(e){return e?((e=e.split(".")).splice(e.length-1,1),1<e.length?e.join("."):e[0]):""}}});e.vm=i,window.xxx=i,this.documentClickEvent=()=>{e.vm&&(e.vm.hidePlatformList(),e.vm.hideSelectList(),e.vm.hideQR())},document.addEventListener("click",e.documentClickEvent)},exports.close=function(){var e=this;document.removeEventListener("click",e.documentClickEvent),e.vm?.$destroy(),e.vm=null,window.xxx=null};