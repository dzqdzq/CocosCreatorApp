<template>
    <div class="translate">
        <head>
            <div class="toolbar container">
                <m-button @confirm="onHomeClick">
                    <ui-icon value="arrow-triangle" style="transform: rotate(90deg)"></ui-icon>
                </m-button>
                <m-button @confirm="onFileInputClick">
                    <ui-icon value="import"></ui-icon>
                    <ui-label
                        color
                        i18n
                        :value="`${MainName}.translate.import_file`">
                    </ui-label>
                </m-button>
                <!-- <m-button>
                    <ui-label color> 检查</ui-label>
                </m-button>
                <m-button>
                    <ui-label color> 修改字体</ui-label>
            </m-button>-->

                <m-button @confirm="onSaveClick">
                    <ui-icon style="display: inline-block; margin-right: 4px" :value="'save'"></ui-icon>
                    <ui-label
                        color
                        i18n
                        :value="MainName + '.translate.save'">
                    </ui-label>
                </m-button>
            </div>
        </head>

        <body>
            <div class="tabs container">
                <div
                    class="tab"
                    :class="{ selected: currentTab === Tab[0] }"
                    @click="onTabClick(0)">
                    <ui-label
                        v-show="isSameLanguage"
                        color
                        i18n
                        :value="MainName + '.translate.unfilled'">
                    </ui-label>
                    <ui-label
                        v-show="!isSameLanguage"
                        color
                        i18n
                        :value="MainName + '.translate.untranslated'">
                    </ui-label>
                </div>
                <div
                    class="tab"
                    :class="{ selected: currentTab === Tab[1] }"
                    @click="onTabClick(1)">
                    <ui-label
                        v-show="isSameLanguage"
                        color
                        i18n
                        :value="MainName + '.translate.filled'">
                    </ui-label>
                    <ui-label
                        v-show="!isSameLanguage"
                        color
                        i18n
                        :value="MainName + '.translate.translate'">
                    </ui-label>
                </div>
                <div
                    class="tab"
                    :class="{ selected: currentTab === Tab[2] }"
                    @click="onTabClick(2)">
                    <ui-label
                        color
                        i18n
                        :value="MainName + '.translate.import_tab_title'">
                    </ui-label>
                </div>
            </div>
            <div class="div">
                <div class="table">
                    <div class="tr head">
                        <div class="th">
                            <div tabindex="0">
                                <div class="container">
                                    <ui-label
                                        v-if="currentTab === 'imported' ||!isSameLanguage"
                                        class="weakWhite"
                                        i18n
                                        :value="localPanelTranslateData.displayName">
                                    </ui-label>
                                    <ui-label
                                        v-else-if="isSameLanguage"   
                                        class="weakWhite"
                                        i18n
                                        :value="MainName + '.translate.key'">
                                    </ui-label>
                                </div>
                            </div>
                        </div>
                        <div class="th">
                            <div tabindex="0">
                                <div class="container">
                                    <ui-label
                                        v-if="currentTab === 'imported' || !isSameLanguage"
                                        class="weakWhite"
                                        i18n
                                        :value="targetPanelTranslateData.displayName">
                                    </ui-label>
                                    <ui-label
                                        v-else-if="isSameLanguage"
                                        class="weakWhite"
                                        i18n
                                        :value="MainName + '.translate.origin'">
                                    </ui-label>
                                </div>
                                <m-button
                                    v-show="!isSameLanguage && currentTab === Tab[0]"
                                    :color="'blue'"
                                    :disabled="!hasTranslateProvider"
                                    @confirm="onTranslateClick">
                                    <ui-label
                                        color
                                        i18n
                                        :value="MainName + '.translate.translate'">
                                    </ui-label>
                                </m-button>
                                <m-button
                                    v-show="currentTab === Tab[0] && !isSameLanguage"
                                    :color="'blue'"
                                    :disabled="!isTargetTranslateDataHasEmptyMedia"
                                    @confirm="onImportAllClick">
                                    <ui-label
                                        color
                                        i18n
                                        :value="MainName + '.translate.import_all'">
                                    </ui-label>
                                </m-button>
                            </div>
                        </div>
                    </div>
                    <!-- 翻译数据 -->
                    <div
                        v-for="item of currentTranslateDataItems"
                        :key="item.key"
                        class="tr">
                        <!-- 翻译原文 -->
                        <div class="td" tabindex="0">
                            <div>
                                <m-input
                                    style="flex: 1"
                                    :is-textarea="true"
                                    :model-value="getDisplayNameOfLocalItem(item.key)"
                                    :readonly="true"
                                    @click="onItemMouseDown(item, true, $event)"
                                    @blur="onItemBlur"></m-input>
                            </div>
                        </div>
                        <!-- 翻译后的文案 -->
                        <div class="td">
                            <div class="container">
                                <m-input
                                    :is-textarea="true"
                                    :model-value="getDisplayNameOfTargetItem(item.key)"
                                    :readonly="isSameLanguage && item.type === TranslateItemType.Media"
                                    @blur="onItemBlur"
                                    @click="onItemMouseDown(item, false, $event)"
                                    @update:modelValue="onInputChanged(item.key, $event)">
                                    <m-button
                                        v-if="item.type === TranslateItemType.Media && !isSameLanguage"
                                        class="import"
                                        :color="'blue'"
                                        @confirm="onImportClick(item.key)">
                                        <ui-label
                                            color
                                            i18n
                                            :value="MainName + '.translate.import'">
                                        </ui-label>
                                    </m-button>
                                    <m-button
                                        v-if="item.type !== TranslateItemType.Media"
                                        :color="'blue'"
                                        :disabled="isVariantsDisable(item.key)"
                                        @confirm="onVariantsClick(item.key)">
                                        <ui-label
                                            color
                                            i18n
                                            :value="MainName + '.translate.variant'">
                                        </ui-label>
                                    </m-button>
                                </m-input>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        <footer>
            <div>
                <ui-label
                    class="weakWhite"
                    :value="MainName + '.translate.key:'"
                    i18n>
                </ui-label>
                <ui-label :value="currentSelectedItem?.key || ''"></ui-label>
            </div>
            <!-- <div class="container" v-if="currentSelectedItem">
                <ui-label>引用的场景的 uuid:</ui-label>
                <ui-label
                    v-for="item of positionOfAssociation(currentSelectedItem, 'sceneUuid')"
                    :key="item.__key"
                    :value="item.value"
                >
                </ui-label>
        </div>-->
            <div>
                <ui-label
                    class="weakWhite"
                    i18n
                    :value="MainName + '.translate.position:'">
                </ui-label>
                <ui-label
                    v-for="item of positionOfAssociation"
                    :key="item.__key"
                    :value="item.value"></ui-label>
            </div>
            <div>
                <ui-label
                    class="weakWhite"
                    i18n
                    :value="MainName + '.translate.reference_uuid'">
                </ui-label>
                <ui-label
                    v-for="item of nodeUuidOfAssociation"
                    :key="item.__key"
                    :value="item.value"></ui-label>
            </div>
        </footer>
        <div v-if="currentVariantsItem" class="variants">
            <div>
                <div class="header">
                    <ui-label i18n :value="MainName + '.translate.variant'"></ui-label>
                </div>

                <div class="body">
                    <div>
                        <div class="table" @click.stop>
                            <div class="tr">
                                <div class="th">
                                    <!-- 源语言 -->
                                    <div tabindex="0">
                                        <ui-label
                                            i18n
                                            :value="MainName + '.translate.standard'"
                                            class="weakWhite">
                                        </ui-label>
                                    </div>
                                </div>
                                <div class="th">
                                    <!-- 目标语言 -->
                                    <div tabindex="0" class="container">
                                        <ui-label
                                            i18n
                                            :value="MainName + '.translate.after_variant'"
                                            class="weakWhite"
                                            style="flex: 1"></ui-label>
                                    </div>
                                </div>
                            </div>
                            <div
                                v-for="(item, index) of currentVariantsItem._variants"
                                :key="item"
                                class="tr">
                                <!-- 变体的左侧 -->
                                <div class="td">
                                    <div>
                                        <m-input :model-value="variantKeys[index]" :readonly="true"></m-input>
                                    </div>
                                </div>
                                <!-- 变体的数据 -->
                                <div class="td">
                                    <div class="container">
                                        <m-input v-model="item.value" :is-textarea="true"></m-input>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <div class="container">
                        <div style="flex: 1">
                            <m-button
                                :color="'blue'"
                                :disabled="isDeleteVariantsDisable"
                                @confirm="onVariantsDelete">
                                <ui-label
                                    color
                                    i18n
                                    :value="MainName + '.translate.delete_variant'">
                                </ui-label>
                            </m-button>
                        </div>
                        <div>
                            <m-button
                                :has-border="true"
                                @confirm="onVariantsCancel">
                                <ui-label
                                    color
                                    i18n
                                    :value="MainName + '.translate.cancel'">
                                </ui-label>
                            </m-button>
                            <m-button
                                :has-border="true"
                                style="margin-left: 16px"
                                @confirm="onVariantsConfirm">
                                <ui-label
                                    color
                                    i18n
                                    :value="MainName + '.translate.confirm'">
                                </ui-label>
                            </m-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-show="conflictItemsBetweenImportedFilesAndTranslatedFiles.length" class="conflict">
            <div class="content">
                <div class="header">
                    <ui-label i18n :value="MainName + '.translate.save'"></ui-label>
                </div>
                <div class="body">
                    <ui-label i18n :value="MainName + '.translate.conflict_dialog_content'"></ui-label>
                    <div>
                        <div class="table">
                            <div class="tr head">
                                <div class="th">
                                    <ui-checkbox
                                        :value="isConflictSelectAll"
                                        @change="onConflictItemSelectAllClick($event.target.value)"></ui-checkbox>
                                </div>
                                <div class="th">
                                    <ui-label
                                        class="weakWhite"
                                        i18n
                                        :value="MainName + '.translate.key'"></ui-label>
                                </div>
                                <div class="th">
                                    <ui-label
                                        i18n
                                        class="weakWhite"
                                        :value="MainName + '.translate.old_value'">
                                    </ui-label>
                                </div>
                                <div class="th">
                                    <ui-label
                                        i18n
                                        class="weakWhite"
                                        :value="MainName + '.translate.new_value'">
                                    </ui-label>
                                </div>
                            </div>
                            <div
                                v-for="(item, index) in conflictItemsBetweenImportedFilesAndTranslatedFiles"
                                :key="item.key"
                                class="tr">
                                <div class="td">
                                    <ui-checkbox
                                        :value="selectedConflictItemIndexSet.has(index)"
                                        @change="onConflictItemClick($event.target.value, index)"></ui-checkbox>
                                </div>
                                <div class="td">
                                    <ui-label :value="item.key"></ui-label>
                                </div>
                                <div class="td">
                                    <ui-label :value="targetPanelTranslateData?.items[item.key]?.value ?? item.value">
                                    </ui-label>
                                </div>
                                <div class="td">
                                    <ui-label :value="importedTranslateItemMap[item.key].value"></ui-label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="footer">
                    <m-button
                        :has-border="true"
                        :transparent="true"
                        :disabled="selectedConflictItemIndexSet.size === 0"
                        @confirm="onConflictConfirmClick">
                        <ui-label
                            color
                            i18n
                            :value="MainName + '.translate.cover'"></ui-label>
                    </m-button>
                    <m-button
                        :has-border="true"
                        :transparent="true"
                        @confirm="onConflictCancelClick">
                        <ui-label
                            color
                            i18n
                            :value="MainName + '.translate.cancel'"></ui-label>
                    </m-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { extname, join, relative } from 'path';
import { computed, Ref, ref } from 'vue';
import MButton from '../../../share/ui/m-button.vue';
import MInput from '../../../share/ui/m-input.vue';
import { wrapper, WrapperTranslateItem, pluralRules } from '../../index';
import Iterator from '../../../share/scripts/Iterator';
import { AssetInfo } from '@editor/library-type/packages/asset-db/@types/public';
import IAssociation from '../../../../src/core/entity/translate/IAssociation';
import IWrapperTranslateItem from '../../../../src/core/entity/translate/IWrapperTranslateItem';
import TranslateItemType from '../../../../src/core/entity/translate/TranslateItemType';
import { MainName, ProjectAssetPath } from '../../../../src/core/service/util/global';
import { PanelTranslateData } from '../../index';
import { MergeTranslateItemOption, TranslateFileType } from '../../../../src/core/type/type';
import ITranslateItem from '../../../../src/core/entity/translate/ITranslateItem';
import { getTranslateFileType } from '../../../share/scripts/utils';
const Tab = ['untranslated', 'translated', 'imported'] as const;
type SaveOption = { mergeOptions?: MergeTranslateItemOption, force?: boolean };

// 这个组件是配置界面
export default {
    components: {
        'm-button': MButton,
        'm-input': MInput,
    },
    props: {
        /** 目标语言 */
        targetLocale: {
            type: String,
            required: true,
        },
    },
    emits: ['home'],
    async setup(props: { targetLocale: string }, { emit }) {
        const hasTranslateProvider = !!(await wrapper.getCurrentTranslateProvider());
        const isSameLanguage = computed((): boolean => {
            const result = localPanelTranslateData.value?.locale === props.targetLocale;
            return result;
        });
        const currentTranslateDataItems = computed(() => {
            if (currentTab.value === 'untranslated') {
                return untranslatedTranslateDataItems.value;
            }
            if (currentTab.value === 'translated') {
                return translatedTranslateDataItems.value;
            }
            if (currentTab.value === 'imported') {
                return Object.values(importedTranslateItemMap.value);
            }

            return [];
        });
        const indexData = await wrapper.getIndexData();

        /** 未翻译的数据 */
        const untranslatedTranslateDataItems = computed(() => {
            const targetDataItems = targetPanelTranslateData.value?.items ?? {};
            const localDataItems = localPanelTranslateData.value?.items ?? {};
            const targetDataItemsKeys = Object.keys(targetDataItems);
            if (isSameLanguage.value) {
                return Object.values(targetDataItems).filter((item) => item && !item.value);
            }
            return Object.keys(localDataItems)
                .filter((key) => !targetDataItemsKeys.includes(key) && localDataItems[key]?.value)
                .map((key) => localDataItems[key])
                .sort((a, b) => { return a!.index - b!.index; });
        });

        /** 已翻译的数据 */
        const translatedTranslateDataItems = computed(() => {
            const targetDataItems = targetPanelTranslateData.value?.items ?? {};
            const localDataItems = localPanelTranslateData.value?.items ?? {};
            const targetDataItemsKeys = Object.keys(targetDataItems);
            if (isSameLanguage.value) {
                return Object.values(targetDataItems).filter((item) => item?.value);
            }
            return Object.keys(localDataItems)
                .filter((key) => targetDataItemsKeys.includes(key) && localDataItems[key]?.value)
                .map((key) => localDataItems[key])
                .sort((a, b) => { return b!.index - a!.index; });
        });
        // 要记录修改的内容，仅仅发送修改的内容给主进程
        const currentTab = ref('untranslated' as typeof Tab[number]);
        const changedTranslateItemMap = ref({} as Record<string, IWrapperTranslateItem | undefined>);
        function updateChangedTranslateItemMap(
            sourceItem: Readonly<IWrapperTranslateItem>,
            value: string,
            displayName?: string,
            assetInfo?: AssetInfo | null,
            variants?: IWrapperTranslateItem['_variants'],
            associations: IAssociation[] = [],
        ) {
            const item = (changedTranslateItemMap.value[sourceItem.key] ??= new WrapperTranslateItem(
                sourceItem.key,
                value,
                sourceItem.type,
                displayName,
                assetInfo,
                associations,
                variants,
            ));
            item.value = value;
            if (displayName) {
                item.displayName = displayName;
            }
            if (assetInfo) {
                item.assetInfo = assetInfo;
            }
            if (variants) {
                item._variants = variants;
            }
            if (associations) {
                item.associations = associations;
            }
        }
        const currentVariantsItem = ref(null as IWrapperTranslateItem | null);
        /** 本地语言数据集 */
        const localPanelTranslateData = ref(await PanelTranslateData.getPanelTranslateData());
        async function updateLocalPanelTranslateData(){
            localPanelTranslateData.value = await PanelTranslateData.getPanelTranslateData();
        }
        function isDirty() {
            return Object.keys(changedTranslateItemMap.value).length;
        }
        async function onSaveClick() {
            await save();
        }
        /** 通过这个变量控制是否为变体 */
        let replaceVariant = false;
        async function save(items?: IWrapperTranslateItem[], options?: SaveOption) {
            options ??= {};
            options.mergeOptions ??= { replaceVariant };

            if (['untranslated', 'translated'].includes(currentTab.value)) {
                await saveInTranslate(items, options);
            } else {
                // 如果有未保存的部分先保存未保存的部分
                if (isDirty()) {
                    await saveInTranslate();
                }
                await saveInImportedFile(items, options);
            }
        }
        /** 在翻译界面以及未翻译界面点击保存的回调 */
        async function saveInTranslate(items?: IWrapperTranslateItem[] | Record<string, IWrapperTranslateItem | undefined>, options?: SaveOption) {
            items ??= changedTranslateItemMap.value;
            console.debug('onSaveClick', items);
            wrapper.saveTranslateData(props.targetLocale, items, options?.mergeOptions).then((r) => {
                updateTargetTranslateData();
            });
            if (items === changedTranslateItemMap.value) {
                changedTranslateItemMap.value = {};
            } else {
                if (items instanceof Array) {
                    for (let index = 0; index < items.length; index++) {
                        const item = items[index];
                        delete changedTranslateItemMap.value[item.key];
                    }
                }
            }
            replaceVariant = false;
        }
        /**
         * 导入的文件与翻译数据的冲突，这个数组一旦有内容，则会显示弹窗页面
         */
        const conflictItemsBetweenImportedFilesAndTranslatedFiles = ref([] as IWrapperTranslateItem[]);

        const selectedConflictItemIndexSet = ref(new Set<number>());

        function onConflictItemClick(value: boolean, index: number) {

            if (value) {
                selectedConflictItemIndexSet.value.add(index);
            } else {
                selectedConflictItemIndexSet.value.delete(index);
            }

        }
        const isConflictSelectAll = computed({
            get() {
                const length: number = conflictItemsBetweenImportedFilesAndTranslatedFiles.value.length;
                const set = selectedConflictItemIndexSet.value;
                return set.size === length;
            },
            set(value) {
                if (value) {
                    for (let index = 0; index < conflictItemsBetweenImportedFilesAndTranslatedFiles.value.length; index++) {
                        selectedConflictItemIndexSet.value.add(index);
                    }
                } else {
                    selectedConflictItemIndexSet.value.clear();
                }
            },
        });

        function onConflictItemSelectAllClick(value: boolean) {
            isConflictSelectAll.value = value;
        }
        function _saveImportedFile(items: IWrapperTranslateItem[], options?: SaveOption){
            wrapper.saveTranslateData(props.targetLocale, items, options?.mergeOptions).then((r) => {
                updateTargetTranslateData();
                updateLocalPanelTranslateData();
            });
            // 如果是在非本地语言导入则需要额外地往本地语言更新新的条目
            if (!isSameLanguage.value){
                const localTranslateItems = Object.values(localPanelTranslateData.value!.items);
                const newTranslateItems = items.filter(item => !localTranslateItems.some(it => it?.key === item.key));
                if (newTranslateItems.length){
                    wrapper.saveTranslateData(localPanelTranslateData.value!.bcp47Tag, newTranslateItems, options?.mergeOptions).then((r) => {
                        updateLocalPanelTranslateData();
                    });
                }
            }
            for (let index = 0; index < items.length; index++) {
                const item = items[index];
                delete importedTranslateItemMap.value[item.key];
            }
            replaceVariant = false;
        }
        async function saveInImportedFile(items?: IWrapperTranslateItem[], options?: SaveOption) {
            items ??= Object.values(importedTranslateItemMap.value);
            if (items) {
                const targetTranslateItems = Object.values(targetPanelTranslateData.value!.items);
                conflictItemsBetweenImportedFilesAndTranslatedFiles.value = items.filter(item => targetTranslateItems.some(it => it?.key === item!.key));
                const noConflictItems = items.filter(item => !targetTranslateItems.some(it => it?.key === item!.key));
                // 未冲突部分的处理
                if (noConflictItems.length){
                    _saveImportedFile(noConflictItems, options);
                }
                // 冲突部分的处理
                if (options?.force) {
                    _saveImportedFile(items, options);
                    selectedConflictItemIndexSet.value.clear();
                    conflictItemsBetweenImportedFilesAndTranslatedFiles.value = [];
                }
            }
        }
        const targetPanelTranslateData = ref(await PanelTranslateData.getPanelTranslateData(props.targetLocale));
        async function updateTargetTranslateData(translateResult?: readonly IWrapperTranslateItem[]) {
            if (translateResult) {
                console.debug('translateResult', translateResult);
                for (let index = 0; index < translateResult.length; index++) {
                    const item = translateResult[index];

                    const oldItem =
                        changedTranslateItemMap.value[item.key] || targetPanelTranslateData.value!.items[item.key];
                    changedTranslateItemMap.value[item.key] = new WrapperTranslateItem(
                        item.key,
                        item.value,
                        item.type,
                        item.displayName ||
                        WrapperTranslateItem.getDisplayName({
                            item: item,
                            assetInfo: oldItem?.assetInfo || item.assetInfo,
                        }),
                        oldItem?.assetInfo,
                        item.associations,
                    );
                }
            } else {
                console.debug('update target translate data get translate data');
                targetPanelTranslateData.value = await PanelTranslateData.getPanelTranslateData(props.targetLocale);
            }
        }

        const variantKeys: Ref<Intl.LDMLPluralRule[]> = ref(pluralRules[targetPanelTranslateData.value!.bcp47Tag.split('-')[0]] ?? ['other'] as Intl.LDMLPluralRule[]);
        const currentSelectedItem = ref(null as IWrapperTranslateItem | null);
        const isTargetTranslateDataHasEmptyMedia = computed((): boolean => {
            const items = Object.values(localPanelTranslateData.value!.items).filter(
                (item) => item && item.type === TranslateItemType.Media,
            ) as Readonly<IWrapperTranslateItem[]>;
            if (items.length === 0) {
                return false;
            }

            for (const item of items) {
                const tempItem =
                    changedTranslateItemMap.value[item.key] ?? targetPanelTranslateData.value!.items[item.key];
                if (!tempItem?.value) {
                    return true;
                }
            }
            return false;
        });

        const blurTimeout = ref(null as NodeJS.Timeout | null); // eslint-disable-line no-undef
        /** 查询是否愿意清除 */
        async function executeCallbackWithOutDirty(callBack: Function): Promise<boolean> {
            if (isDirty()) {
                const cancel = 0;
                const result = await Editor.Dialog.info(Editor.I18n.t(MainName + '.translate.unsaved_warning'), {
                    buttons: [
                        Editor.I18n.t(MainName + '.translate.cancel'),
                        Editor.I18n.t(MainName + '.translate.confirm'),
                    ],
                    cancel,
                });
                if (result.response === cancel) {
                    return false;
                }
                save(undefined, { force: true });
            }
            await callBack();
            return true;
        }
        function onItemMouseDown(item: InstanceType<typeof WrapperTranslateItem>, isLocalLanguage: boolean, event) {
            if (blurTimeout.value) {
                clearTimeout(blurTimeout.value);
            }
            if (isLocalLanguage) {
                currentSelectedItem.value = item;
            } else {
                if (currentTab.value === 'imported'){
                    currentSelectedItem.value = importedTranslateItemMap.value[item.key] ?? item;
                } else {
                    currentSelectedItem.value = changedTranslateItemMap.value[item.key] ?? targetPanelTranslateData.value?.items[item.key] ?? item;
                }
            }
        }
        function onItemBlur(event) {
            blurTimeout.value = setTimeout(() => {
                currentSelectedItem.value = null;
            }, 400);
        }
        const importedTranslateItemMap = ref({} as Record<string, IWrapperTranslateItem>);
        const panelProfileKey = 'default-translate';
        const importFileProfileKey = `${panelProfileKey}.importFile`;
        async function getLastImportedFileProfile(): Promise<string> {
            return await Editor.Profile.getTemp(MainName, importFileProfileKey) || '';
        }
        function setLastImportedFileProfile(file: string) {
            Editor.Profile.setTemp(MainName, importFileProfileKey, file);
        }
        function onTabClick(index: number) {
            if (currentTab.value !== Tab[index]) {
                switch (index) {
                    case 0:
                    case 1:
                    case 2:
                        currentTab.value = Tab[index];
                        break;

                    default:
                        currentTab.value = Tab[0];
                        break;
                }
            }
        }
        /** 目标语言数据集 */
        return {
            isConflictSelectAll,
            onConflictItemClick,
            onConflictItemSelectAllClick,
            selectedConflictItemIndexSet,
            conflictItemsBetweenImportedFilesAndTranslatedFiles,
            importedTranslateItemMap,
            MainName,
            hasTranslateProvider,
            onItemBlur,
            onItemMouseDown,
            isTargetTranslateDataHasEmptyMedia,
            currentTranslateDataItems,
            currentSelectedItem,
            isSameLanguage,
            untranslatedTranslateDataItems,
            translatedTranslateDataItems,

            /**
             * 获取表格右侧的译文的显示名称
             */
            getDisplayNameOfTargetItem(key: string): string {
                let localItem: IWrapperTranslateItem | undefined;
                if (currentTab.value === 'imported') {
                    localItem = importedTranslateItemMap.value[key];
                } else {
                    const changedItem = changedTranslateItemMap.value[key];
                    const targetItem = targetPanelTranslateData.value?.items[key];
                    localItem = changedItem ?? targetItem;
                }

                if (!localItem) {
                    return '';
                }
                if (localItem.type === TranslateItemType.Media) {
                    return localItem?.displayName ?? key;
                }

                return localItem?.value ?? '';
            },
            /** 获取表格左侧的显示名称 */
            getDisplayNameOfLocalItem(key: string): string {
                let item: IWrapperTranslateItem|undefined;

                if (currentTab.value === 'imported'){
                    item = localPanelTranslateData.value?.items[key] ?? importedTranslateItemMap.value[key];
                    return item.value;
                } else {
                    item = localPanelTranslateData.value?.items[key];
                }

                if (item?.type === TranslateItemType.Media) {
                    return item.displayName || key;
                }
                if (isSameLanguage.value) {
                    return key;
                } else {
                    return item?.displayName || '';
                }
            },
            positionOfAssociation: computed(() => {
                if (!currentSelectedItem.value) {
                    return [];
                }
                const indexDataElement = indexData.find((item) => item.key === currentSelectedItem.value!.key);

                if (!indexDataElement) {
                    return [];
                }

                const items = indexDataElement.associations
                    .filter((it) => it.assetInfo)
                    .map((it) => relative(Editor.Project.path, it.assetInfo!.file));

                return Array.from(new Set(items)).map((it) => new Iterator(it));
            }),
            nodeUuidOfAssociation: computed(() => {
                if (!currentSelectedItem.value) {
                    return [];
                }
                const indexDataElement = indexData.find((item) => item.key === currentSelectedItem.value!.key);
                if (!indexDataElement) {
                    return [];
                }
                return Array.from(
                    new Set(
                        indexDataElement.associations
                            .filter((it) => it.nodeUuid)
                            .map(it => it.nodeUuid),
                    ),
                ).map((it) => new Iterator(it));
            }),
            onSaveClick,
            targetPanelTranslateData,
            localPanelTranslateData,
            currentVariantsItem,
            /** 有修改行为的资源 */
            changedTranslateItemMap,

            TranslateItemType: ref(TranslateItemType),
            onTabClick,

            /** 导入的 po 文件里的数据集 */
            importedTranslateData: ref([]),
            /** 当前选择的标签 */
            currentTab,
            Tab: ref(Tab),
            /** 输入框被写入了内容 */
            async onInputChanged(key: string, value: string) {
                let item: Readonly<IWrapperTranslateItem | undefined>;
                if (currentTab.value === 'imported') {
                    const item: IWrapperTranslateItem = importedTranslateItemMap.value[key];
                    item.value = value;
                    return;
                } else {
                    item =
                        changedTranslateItemMap.value[key] ??
                        targetPanelTranslateData.value?.items[key] ??
                        localPanelTranslateData.value?.items[key];
                }
                if (!item) {
                    console.error(`cannot find item with key ${key}`);
                    return;
                }
                if (item.type === TranslateItemType.Media) {
                    if (value === '') {
                        updateChangedTranslateItemMap(
                            item,
                            '',
                            '',
                            undefined,
                            item._variants,
                            item.associations,
                        );
                    } else {
                        const originItem = localPanelTranslateData.value?.items[key];
                        if (!originItem) {
                            console.error(`cannot find item with key ${key} from local`);
                            return;
                        }
                        const info: AssetInfo | null = await wrapper.getFileInfoByUUIDOrPath(join(ProjectAssetPath, value));
                        if (info && extname(originItem.displayName || '') === extname(value)) {
                            updateChangedTranslateItemMap(
                                item,
                                info.uuid,
                                WrapperTranslateItem.getDisplayName({ item, assetInfo: info }),
                                info,
                                item._variants,
                                item.associations,
                            );
                        }
                    }
                } else {
                    updateChangedTranslateItemMap(
                        item,
                        value,
                        WrapperTranslateItem.getDisplayName({ item, value }),
                        null,
                        item._variants,
                        item.associations,
                    );
                }
            },
            /**  点击翻译按钮 */
            async onTranslateClick() {
                await executeCallbackWithOutDirty(async () => {
                    updateTargetTranslateData(await wrapper.autoTranslate(targetPanelTranslateData.value!.locale));
                });

            },
            variantKeys,
            /** 打开变体 */
            onVariantsClick(key: string) {
                const targetItem = targetPanelTranslateData.value?.['items'][key];
                const changedItem = changedTranslateItemMap.value[key];
                const importedItem = importedTranslateItemMap.value[key];
                if (currentTab.value === 'imported' && importedItem) {
                    currentVariantsItem.value = WrapperTranslateItem.parse(importedItem);
                } else if (changedItem) {
                    currentVariantsItem.value = WrapperTranslateItem.parse(changedItem);
                } else if (targetItem) {
                    currentVariantsItem.value = WrapperTranslateItem.parse(targetItem);
                } else {
                    console.error(
                        'An item that does not have a value should not be able to set variations',
                        `key:${key}`,
                    );
                    return;
                }

                for (let index = 0; index < variantKeys.value.length; index++) {
                    const variantkey = variantKeys.value[index];
                    const itemKey = `${key}_${variantkey}`;
                    const oldItem = targetItem?._variants.find((item) => item.key === itemKey);
                    if (!oldItem) {
                        currentVariantsItem.value._variants.push(
                            new WrapperTranslateItem(
                                itemKey,
                                '',
                                currentVariantsItem.value.type,
                                '',
                                null,
                                undefined,
                                undefined,
                                true,
                            ),
                        );
                    }
                }
                function getIndexFromVariants(key: string): number {
                    const arr = key.split('_');
                    if (arr.length) {
                        const ext = arr[arr.length - 1];
                        return variantKeys.value.findIndex((item) => item === ext);
                    } else {
                        return -1;
                    }
                }
                currentVariantsItem.value._variants = currentVariantsItem.value._variants.sort((a, b): number => {
                    return getIndexFromVariants(a.key) - getIndexFromVariants(b.key);
                });
            },
            /** 保存变体 */
            onVariantsConfirm() {
                if (!currentVariantsItem.value) {
                    console.error(`save variants error: currentVariantsItem.value is ${currentVariantsItem.value}`);
                    return;
                }
                currentVariantsItem.value._variants = currentVariantsItem.value._variants.filter((item) => item.value);
                replaceVariant = true;
                save([currentVariantsItem.value!], { mergeOptions: { replaceVariant: true } });
                currentVariantsItem.value = null;
            },
            /** 取消设置变体 */
            onVariantsCancel() {
                if (!currentVariantsItem.value) {
                    console.error(`save variants error: currentVariantsItem.value is ${currentVariantsItem.value}`);
                    return;
                }
                currentVariantsItem.value = null;
            },
            /** 删除当前变体 */
            async onVariantsDelete() {
                if (!currentVariantsItem.value) {
                    console.error(`save variants error: currentVariantsItem.value is ${currentVariantsItem.value}`);
                    return;
                }
                const result = await Editor.Dialog.info(Editor.I18n.t(MainName + '.translate.delete_warning'), {
                    buttons: [
                        Editor.I18n.t(MainName + '.translate.cancel'),
                        Editor.I18n.t(MainName + '.translate.confirm'),
                    ],
                });
                if (result.response === 1) {
                    currentVariantsItem.value!._variants = [];
                    replaceVariant = true;
                    await save([currentVariantsItem.value!]);
                }
                currentVariantsItem.value = null;
            },

            /** 条目是否禁用变体 */
            isVariantsDisable(key: string): boolean {
                if (currentTab.value === 'imported'){
                    return false;
                } else {
                    const changedItem = changedTranslateItemMap.value[key];
                    const targetItem = targetPanelTranslateData.value?.['items'][key];
                    return changedItem?.value === '' || (!changedItem && !targetItem?.value);
                }
            },

            /** 是否可以点击删除变体 */
            isDeleteVariantsDisable: computed((): boolean => {
                if (currentVariantsItem.value?._variants.some((item) => item.value)) {
                    return false;
                }
                return true;
            }),

            /**
             * 点击导入全部的按钮
             */
            async onImportAllClick() {
                await executeCallbackWithOutDirty(async () => {
                    const localLocale = localPanelTranslateData.value!.locale;
                    const mediaLength = untranslatedTranslateDataItems.value.filter(
                        (item) => item?.type === TranslateItemType.Media,
                    ).length;
                    const title = Editor.I18n.t(MainName + '.translate.auto_import_warning')
                        .replace('{length}', mediaLength.toString())
                        .replace('{localLocale}', localLocale)
                        .replace('{targetLocale}', props.targetLocale);
                    const result = await Editor.Dialog.info(title, {
                        buttons: [
                            Editor.I18n.t(MainName + '.translate.cancel'),
                            Editor.I18n.t(MainName + '.translate.confirm'),
                        ],
                        cancel: 0,
                    });
                    if (result.response) {
                        const items = await wrapper.importFilesFromDirectory(
                            props.targetLocale,
                            localLocale,
                            props.targetLocale,
                        );
                        updateTargetTranslateData(items);
                    }
                });
            },

            /**
             * 点击导入某个外部文件            
             */
            async onFileInputClick() {
                await executeCallbackWithOutDirty(async () => {
                    onTabClick(2);
                    const result = await Editor.Dialog.select({ extensions: 'po,csv,xlsx', multi: false, path: await getLastImportedFileProfile() });
                    if (!result.canceled) {
                        const filePath = result.filePaths[0];
                        setLastImportedFileProfile(filePath);
                        const translateFileType: TranslateFileType = getTranslateFileType(filePath);
                        const locale: string = targetPanelTranslateData.value!.bcp47Tag;

                        let importResult: ITranslateItem[] = await wrapper.importTranslateFile(filePath, translateFileType, locale);
                        /**
                         * 新导入的文件中冲突的内容
                         */
                        const conflictItems: IWrapperTranslateItem[] = importResult.filter(item => importedTranslateItemMap.value[item.key]);
                        if (conflictItems.length) {
                            const cancel = 2;
                            const dialogResult = await Editor.Dialog.warn(Editor.I18n.t(MainName + '.translate.import_file_conflicts_with_file_warning').replace('{num}', conflictItems.length.toString()), {
                                buttons: [
                                    Editor.I18n.t(MainName + '.translate.jump'),
                                    Editor.I18n.t(MainName + '.translate.cover'),
                                    Editor.I18n.t(MainName + '.translate.cancel'),
                                ],
                                cancel,
                            });
                            const response = dialogResult.response;
                            if (response === 0) {
                                importResult = importResult.filter(item => !conflictItems.includes(item)).concat(conflictItems);
                            } else if (response === 1) {
                                const noConflictItems = (Object.values(importedTranslateItemMap.value) as ITranslateItem[]).filter(item => !conflictItems.some(it => it.key === item.key));
                                importResult = importResult.concat(noConflictItems);
                            } else if (response === 2) {
                                return;
                            }
                        }
                        
                        for (let index = 0; index < importResult.length; index++) {
                            const result = importResult[index];
                            importedTranslateItemMap.value[result.key] = result;
                        }
                        
                    }
                });
            },
            /**
             * 点击单个导入，导入某个文件
             */
            async onImportClick(key: string) {
                const item: Readonly<IWrapperTranslateItem> | undefined =
                    localPanelTranslateData.value!.items[key] ??
                    changedTranslateItemMap.value[key] ??
                    targetPanelTranslateData.value?.items[key];

                if (!item?.assetInfo) {
                    console.error(`[${MainName}]: item has not assetInfo`, item);
                    return;
                }
                const extName = extname(item.assetInfo.file).replace('.', '');
                const result = await Editor.Dialog.select({
                    multi: false,
                    path: ProjectAssetPath,
                    type: 'file',
                    extensions: extName,
                });
                if (!result.canceled) {
                    const assetInfo = await wrapper.getFileInfoByUUIDOrPath(result.filePaths[0]);
                    if (assetInfo) {
                        const value = assetInfo.uuid;
                        const displayName = WrapperTranslateItem.getDisplayName({ assetInfo });
                        updateChangedTranslateItemMap(
                            item,
                            value,
                            displayName,
                            assetInfo,
                            item._variants,
                            item.associations,
                        );
                    } else {
                        console.error('A non-project resource was selected,please select another resource.');
                    }
                }
            },
            /** 点击文件与原文冲突的取消按钮 */
            onConflictCancelClick() {
                conflictItemsBetweenImportedFilesAndTranslatedFiles.value = [];
                selectedConflictItemIndexSet.value.clear();
                replaceVariant = false;
            },
            /** 点击文件与原文冲突的覆盖按钮 */
            async onConflictConfirmClick() {
                await save(Array.from(selectedConflictItemIndexSet.value).map(item => conflictItemsBetweenImportedFilesAndTranslatedFiles.value[item]), { force: true });
            },
            async onHomeClick() {
                if (Object.keys(changedTranslateItemMap.value).length > 0) {
                    const result = await Editor.Dialog.warn(Editor.I18n.t(MainName + '.translate.quit_warning'), {
                        buttons: [
                            Editor.I18n.t(MainName + '.translate.cancel'),
                            Editor.I18n.t(MainName + '.translate.confirm'),
                        ],
                        cancel: 0,
                    });
                    if (result.response === 1) {
                        emit('home');
                    }
                } else {
                    emit('home');
                }
            },
        };
    },
};
</script>

<style lang="less">
div.translate {
    @import url('../../../share/less/ui-label.less');
    overflow-x: auto;

    .table {
        flex: 1;
        overflow-y: scroll;
    }

    .table>.tr {
        display: flex;
        align-items: center;

        &.head {
            position: sticky;
            background-color: @strong-gray-color;
            top: 0px;
            z-index: 2;
        }

        &:not(:first-child) {

            &:hover,
            &:focus,
            &:focus-within {
                background-color: @gray-color  !important;
            }
        }

        &:last-child {
            border-bottom: 1px solid @gray-color;
        }
    }

    // 表头
    .table>.tr>.th {
        &>div {
            display: flex;
            justify-content: left;
            padding: 4px 16px;

            &>div.container {
                padding: 2px 0px;

                &>ui-label {
                    height: 20px;
                    margin-right: 8px;
                }
            }
        }

        border: 1px solid @gray-color;
    }

    // 下面的表
    .table>.tr>.td {
        border-right: 1px solid @gray-color;
        border-left: 1px solid @gray-color;
        border-top: 1px solid transparent;
        border-bottom: 1px solid transparent;

        &:focus-within,
        &:focus {
            & div>.mInput[isediting='true']>.icon>ui-button {
                visibility: hidden;
            }

            border-color: @black-blue-color;
        }

        &>div {
            &:not(:hover)>.mInput>.icon>ui-button.import {
                visibility: hidden;
            }

            &>.mInput>textarea,
            &>.mInput>.icon {
                line-height: 24px;
                height: 24px;
            }
        }
    }

    // 表头和下面的表
    .table>.tr>.td,
    .table>.tr>.th {
        flex: 1;

        &>div {
            &> :first-child {
                flex: 1;
            }

            &>.mInput>.icon>ui-button {
                height: 24px;
                line-height: 24px;

                &>ui-label {
                    line-height: 20px;
                }
            }
        }
    }

    // 表的偶数行
    .table>.tr:nth-child(2n) {
        background-color: @weak-dark-color;
    }

    // 将 m-input 默认样式修改
    div.mInput {
        background-color: transparent;
        border-radius: 0px;
        border: transparent;
        padding: 4px 16px;
    }

    background-color: @dark-color;
    display: flex;
    position: absolute;
    width: 100%;
    height: 100%;
    flex-direction: column;

    ui-label {
        font: @normal-font;

        &::selection {
            background-color: rgba(63, 170, 201, 1);
        }
    }

    head {
        display: block;
        min-width: 1000px;
        overflow: hidden;

        &>div.toolbar {
            padding: 2px 16px;
            background-color: @strong-gray-color;
        }
    }

    body {
        min-width: 1000px;
        overflow: hidden;
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px 16px 0px 16px;
        background-color: @dark-color;
        overflow: hidden;

        &>div.tabs {
            &>div.tab {
                padding: 4px 16px;
                cursor: pointer;
                color: @bit-weak-white-color;

                &:hover {
                    background-color: @weak-gray-color;
                }

                &:active {
                    background-color: @weaker-white-color;
                }

                &.selected {
                    background-color: @strong-gray-color;
                    color: @white-color;
                }
            }
        }

        &>div.div {
            background-color: @strong-gray-color;
            padding: 16px 8px 0px 16px;
            overflow-y: hidden;
            flex: 1;
            display: flex;
            flex-direction: column;
        }
    }

    footer {
        min-width: 1000px;
        overflow: hidden;
        padding: 16px 48px;
        overflow-y: auto;
        min-height: 76px;
        height: 76px;
        background-color: @weak-dark-color;

        &>div>ui-label {
            margin-right: 16px;
        }
    }

    div.container {
        display: flex;
    }

    &>div.conflict {
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4;
        overflow: hidden;

        &>div.content {
            box-shadow: 0 0 30px 0 rgba(0, 0, 0, 0.8);
            width: 933px;
            min-width: 933px;
            overflow: hidden;
            min-height: 366px;
            max-height: 686px;
            background-color: @dark-color;
            display: flex;
            flex-direction: column;

            &>div.header {
                background-color: @strong-gray-color;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 40px;
                flex-shrink: 0;
            }

            &>div.body {
                padding: 16px 16px 0 16px;
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                margin-bottom: 8px;
                
                &>ui-label {
                    flex-shrink: 0;
                }

                &>div {
                    margin-top: 16px;
                    padding: 16px calc((16 - var(--size-normal-font)) * 1px) 16px 16px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background-color: @strong-gray-color;
                    overflow: hidden;

                    &>div.table {
                        flex: 1;
                        overflow-y: scroll;

                        &>div.tr {

                            &>div.th,
                            &>div.td {
                                &:first-child {
                                    max-width: 48px;
                                    justify-content: center;
                                    padding-left: 0px;
                                }

                                padding-left: 16px;
                                display: flex;
                                align-items: center;
                                height: 32px;

                            }
                        }
                    }
                }

            }

            &>div.footer {
                flex-shrink: 0;
                height: 72px;
                display: flex;
                flex-direction: row-reverse;
                align-items: center;

                &>ui-button {
                    margin-right: 16px;
                }
            }

        }
    }

    &>div.variants {
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        &>div {
            background-color: @weak-dark-color;
            width: 465px;
            min-width: 465px;
            overflow: hidden;
            box-shadow: 0 0 30px 0 rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;

            &>.header {
                display: flex;
                justify-content: center;
                height: 40px;

                &>ui-label {
                    line-height: 40px;
                }
            }

            &>.body {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                padding: 16px;
                background-color: @strong-gray-color;
                background-color: @dark-color;

                &>div {
                    padding: 16px 4px 16px 16px;
                    background-color: @strong-gray-color;
                }
            }

            &>.footer {
                height: 80px;
                background-color: @dark-color;
                padding: 0px 16px;

                &>div {
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    height: 100%;
                }
            }

            &>.table {
                left: 0;
                right: 0;
                margin: auto;
                width: 400px;
            }
        }
    }
}
</style>
