<template>
    <div class="i18nComponent" @blur="onBlur">
        <div
            v-show="isShow"
            class="search"
            tabindex="0">
            <m-input
                ref="input"
                v-model="search"
                @focus="onFocus"
                @blur="onBlur"></m-input>
            <div class="parent">
                <ui-prop
                    v-for="item of filterList"
                    :key="item.key"
                    class="item"
                    tabindex="0"
                    @click="onCommit(item)">
                    <div class="container" style="height: 22px">
                        <ui-label
                            class="weakerWhite"
                            value="value:"
                            style="line-height: 16px"></ui-label>
                        <ui-label
                            v-show="item.value"
                            :value="item.value"
                            style="line-height: 22px; font-size: 14px">
                        </ui-label>
                        <ui-label
                            v-show="!item.value"
                            class="bitWeakWhite"
                            i18n
                            :value="MainName + '.label_inspector.no_origin'"
                            style="line-height: 22px; font-size: 14px"></ui-label>
                    </div>
                    <div class="container">
                        <ui-label
                            class="weakerWhite"
                            style="line-height: 16px"
                            i18n
                            :value="MainName + '.label_inspector.key:'"></ui-label>
                        <ui-label
                            class="weakWhite"
                            style="line-height: 16px"
                            :value="item.key"></ui-label>
                    </div>
                </ui-prop>
            </div>
        </div>
        <div ref="uiProps" @focus="onBlur"></div>

        <ui-prop
            v-show="!isMulti"
            id="keyProp"
            :tooltip="errorTooltip"
            @focus="onBlur">
            <ui-label slot="label" value="Key"></ui-label>
            <div slot="content">
                <m-input
                    :model-value="refNewKey"
                    :error="!!errorTooltip"
                    @update:modelValue="onUpdateKey">
                    <div class="container">
                        <m-icon value="select" @click="onClick"></m-icon>
                        <m-icon value="reset" @click="onChangeKeyClick"></m-icon>
                    </div>
                </m-input>
                <ui-button :disabled="isButtonDisabled" @confirm="confirmResetKey">
                    <ui-label
                        color
                        i18n
                        :value="MainName + '.label_inspector.save'"></ui-label>
                </ui-button>
            </div>
        </ui-prop>
        <ui-prop v-show="isMulti">
            <ui-label slot="label" value="Key"></ui-label>
            <ui-input slot="content" disabled="true"></ui-input>
        </ui-prop>
    </div>
</template>

<script lang="ts">
import mInput from '../../share/ui/m-input.vue';
import mIcon from '../../share/ui/m-icon.vue';
import { wrapper, eventBus } from '../index';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type IAssociation from '../../../src/core/entity/translate/IAssociation';
import type IWrapperTranslateItem from '../../../src/core/entity/translate/IWrapperTranslateItem';
import TranslateItemType from '../../../src/core/entity/translate/TranslateItemType';
import { MainName } from '../../../src/core/service/util/global';

type Dump = {
    value: Record<string, { value: Dump | any; values?: any | Dump[]; visible: boolean; readonly: boolean }>;
};
type UIProp = HTMLElement & {
    render(dump: any): void;
    dump: Dump;
};
export default {
    components: { mInput, mIcon },
    setup() {
        const isMulti = computed((): boolean => {
            return refDump.value?.value.node?.values?.length > 1;
        });
        const sceneUuid = ref('');
        async function updateSceneUUID(){
            sceneUuid.value = await Editor.Message.request('scene', 'query-current-scene');
        }

        const association = computed((): IAssociation => {
            return {
                sceneUuid: sceneUuid.value,
                nodeUuid: refDump.value?.value.node.value.uuid,
                reference: sceneUuid.value,
            };
        });
        const search = ref('');
        /** 文本列表 */
        const list = ref([] as IWrapperTranslateItem[]);
        /** 资源列表 */
        const fileList = ref([] as IWrapperTranslateItem[]);

        /** 获取错误的提示 */
        function getErrorTip(key: string) {
            if (!key) {
                return Editor.I18n.t(MainName + '.label_inspector.cannot_empty');
            }
            if (!key.match(/^[0-9a-zA-Z_@/+-|.]{1,}$/g)) {
                return Editor.I18n.t(MainName + '.label_inspector.error_tooltip');
            }
            if (fileList.value.some((it) => it.key === key)) {
                return Editor.I18n.t(MainName + '.label_inspector.exist_media_tooltip');
            }
            return '';
        }
        const isShow = ref(false);
        /** 提示框 */
        const errorTooltip = computed(() => {
            return getErrorTip(refNewKey.value);
        });
        const input = ref(null as null | HTMLInputElement);
        /** 隐藏元素的计时器 */
        let hideTimeout: null | NodeJS.Timeout = null; // eslint-disable-line no-undef

        /** 更新渲染的数据 */
        async function updateList() {
            const translateData = await wrapper.getTranslateData();
            list.value = translateData.filter((item) => item.type !== TranslateItemType.Media);
            fileList.value = translateData.filter((item) => item.type === TranslateItemType.Media);
        }
        async function onClick() {
            isShow.value = true;
            search.value = '';
            await updateList();
            requestAnimationFrame(() => {
                input.value?.focus();
            });
        }
        const refDump = ref(null as null | Dump);
        const filterList = computed(() => {
            return Object.values(list.value).filter((item: IWrapperTranslateItem) => {
                return search.value === '' || item.key.includes(search.value) || item.value.includes(search.value);
            });
        });
        const uiProps = ref(null as null | UIProp);
        function emitChangeDump() {
            const event = new Event('change-dump', { bubbles: true, cancelable: true });
            uiProps.value?.dispatchEvent(event);
        }
        function onCommit(item: IWrapperTranslateItem) {
            resetKey(item.key);
        }
        const refNewKey = ref('');
        async function confirmResetKey() {
            await updateSceneUUID();
            const original = refDump.value?.value.key.value;
            if (original) {
                await wrapper.removeAssociation(original, association.value);
            }
            await wrapper.addAssociation(refNewKey.value, association.value);
            refDump.value!.value.key.value = refNewKey.value;
            emitChangeDump();
        }

        /**
         * 重新设置 Key
         * 如果 key 不存在则调用编辑器接口重新建一个
         */
        async function resetKey(newKey?: string) {
            let tempUUID = '';
            if (newKey === undefined) {
                while (getErrorTip(tempUUID)) {
                    tempUUID = Editor.Utils.UUID.generate();
                }
            }
            newKey ??= tempUUID;
            refNewKey.value = newKey;
        }

        /** 修改这个 key */
        function onChangeKeyClick() {
            resetKey();
        }
        async function onUpdate(dump: Dump) {
            refDump.value = dump;
            refNewKey.value = dump.value.key.value;
            await updateList();
            if (uiProps.value) {
                uiProps.value.dump = dump;
                for (const [key, value] of Object.entries(dump.value)) {
                    let element: UIProp | null = uiProps.value.querySelector(`ui-prop[key=${key}]`);
                    if (element) {
                        element.hidden = !value.visible;
                    }
                    if (value.visible) {
                        if (key === 'key') {
                            continue;
                        } else {
                            if (!element) {
                                element = document.createElement('ui-prop') as UIProp;
                                element.setAttribute('key', key);
                                element.setAttribute('type', 'dump');
                                uiProps.value.appendChild(element);
                            }
                            element.render(value);
                        }
                    }
                }
            }
        }
        function onError(error: Error) {
            console.error(error);
        }
        onMounted(() => {
            eventBus.on('onCustomError', onError);
            eventBus.on('onDumpUpdated', onUpdate);
        });
        onUnmounted(() => {
            eventBus.off('onCustomError', onError);
            eventBus.off('onDumpUpdated', onUpdate);
        });
        function onFocus() {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
            }
        }
        function onBlur() {
            hideTimeout = setTimeout(() => {
                isShow.value = false;
            }, 200);
        }

        function onUpdateKey(key: string) {
            refNewKey.value = key;
            resetKey(key);
        }
        const isButtonDisabled = computed(() => {
            const isDisabled = refNewKey.value === refDump.value?.value.key.value || errorTooltip.value !== '';
            return isDisabled;
        });
        return {
            isButtonDisabled,
            MainName,
            isShow,
            errorTooltip,
            refNewKey,
            isMulti,
            onFocus,
            onUpdateKey,
            input,
            refDump,
            uiProps,
            list,
            onCommit,
            search,
            onClick,
            onBlur,
            filterList,
            onChangeKeyClick,
            confirmResetKey,
        };
    },
};
</script>

<style lang="less">
@import url('../../share/less/ui-label.less');

.i18nComponent {
    position: relative;
    text-align: center;

    *.container {
        display: flex;
        align-items: center;
    }

    ui-prop#keyProp {
        & > [slot='content'] {
            display: flex;

            & > .mInput {
                flex: 1;
                margin-right: 8px;
            }
        }
    }

    div.search {
        position: absolute;
        width: 80%;
        right: 0%;
        bottom: 26px;
        background-color: @gray-color;
        margin-top: 4px;
        padding: 6px 4px;
        border-radius: 4px;
        border: 1px solid @weak-gray-color;
        background: @weak-dark-color;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.25);
        z-index: 2;

        & > .mInput {
            margin-bottom: 8px;
        }

        & > div.parent {
            height: 200px;
            overflow-y: auto;

            & > ui-prop.item {
                padding: 6px;
                margin-top: 0px;
                border-bottom: solid 1px @gray-color;
                cursor: pointer;

                &:hover {
                    background-color: @gray-color;
                }

                & > div {
                    & > ui-label {
                        margin-right: 8px;
                    }
                }
            }
        }
    }
}
</style>
