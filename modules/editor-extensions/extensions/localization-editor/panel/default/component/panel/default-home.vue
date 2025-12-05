<template>
    <div ref="rootElement" class="home">
        <div ref="bodyElement" class="body">
            <div v-show="!isLocalizationEditorEnable" class="mask">
                <div>
                    <ui-label i18n :value="PKGName + '.home.turn_on_tip'"></ui-label>
                    <ui-button @confirm="onTurnOnClick()">
                        <ui-label
                            color
                            i18n
                            :value="PKGName +'.home.turn_on'">
                        </ui-label>
                    </ui-button>
                </div>
            </div>
            <div class="main">
                <div class="title">
                    <ui-label class="strongWhite">
                        L10N
                    </ui-label>
                    <m-icon
                        style="margin-left: 5.5px;display: inline-flex;"
                        :value="'help'"
                        @click="onLinkClick('i18n')">
                    </m-icon>
                    <m-icon
                        value="menu"
                        style="margin-left: auto;"
                        @click="onMenuClick()"></m-icon>
                </div>
                <div ref="serviceElement" class="container service">
                    <div class="ball shadow"></div>
                    <ui-label
                        class="strongWhite"
                        i18n
                        :value="PKGName + '.service_provider'"></ui-label>
                </div>
                <div class="gray service">
                    <div class="container">
                        <div class="left container">
                            <ui-label i18n :value="PKGName + '.service_provider'"></ui-label>
                            <span>:</span>
                        </div>
                        <ui-select :value="currentService?.name || 'None'" @confirm="onSetCurrentTranslateProvider">
                            <option v-for="item in supportedServices" :key="item">
                                {{ item }}
                            </option>
                            <option>None</option>
                        </ui-select>
                        <ui-label
                            v-show="!currentService"
                            style="margin-left: 16px"
                            class="weakGray"
                            i18n
                            :value="PKGName + '.unselect_service_tip'">
                        </ui-label>
                    </div>

                    <div v-if="currentService" class="container">
                        <ui-label class="left">
                            AppKey:
                        </ui-label>
                        <m-input
                            no-vertical-padding
                            i18n
                            :model-value="currentService.appKey"
                            @update:modelValue="onAppKeyUpdate($event)"></m-input>
                    </div>
                    <div v-if="currentService" class="container">
                        <ui-label class="left">
                            AppSecret:
                        </ui-label>
                        <m-input
                            no-vertical-padding
                            i18n
                            :model-value="currentService.appSecret"
                            @update:modelValue="onAppSecretUpdate($event)"></m-input>
                    </div>

                    <!-- 提交按钮 -->
                    <div
                        v-if="currentService"
                        class="footer"
                        @confirm="onProviderSummitClick">
                        <m-button
                            :has-border="true"
                            :color="'blue'"
                            :disabled="isCurrentServiceDisabled">
                            <ui-loading v-if="isCurrentServiceLoading" style="margin-top:3px"></ui-loading>
                            <ui-label
                                v-else-if="isCurrentServiceDirty"
                                i18n
                                color
                                :value="PKGName + '.home.save'">
                            </ui-label>
                            <ui-label
                                v-else-if="hasService"
                                i18n
                                :value="PKGName + '.home.complete'"
                                color></ui-label>
                            <ui-label
                                v-else
                                i18n
                                :value="PKGName + '.home.save'"
                                color></ui-label>
                        </m-button>
                    </div>
                </div>
                <div ref="collectionElement" class="container collect">
                    <div class="ball shadow"></div>
                    <ui-label
                        class="strongWhite"
                        i18n
                        :value="PKGName + '.collection'"></ui-label>
                </div>
                <div class="gray collect">
                    <div class="container" style="margin-bottom: 20px">
                        <ui-label class="red" style="margin-right: 0px">
                            *
                        </ui-label>
                        <ui-label i18n :value="PKGName + '.local_language'"></ui-label>
                        <ui-select
                            :placeholder="currentLanguageDisplayName || 'i18n:' + PKGName + '.home.select'"
                            style="margin-right: 17px"
                            @mousedown.prevent="onSelectLocalClick">
                        </ui-select>
                        <ui-label
                            v-show="!currentLanguage"
                            class="red"
                            i18n
                            :value="PKGName + '.home.required'">
                        </ui-label>
                    </div>
                    <div class="container" style="margin-bottom: 5px">
                        <div style="flex: 1" class="container">
                            <ui-label i18n :value="PKGName + '.collected_from_resource_files'"></ui-label>
                            <m-icon :value="'help'" @click="onLinkClick('collection')"></m-icon>
                        </div>
                        <ui-button @click.stop @confirm="onAddCollectionClick()">
                            <ui-label
                                color
                                i18n
                                :value="PKGName + '.home.add'"></ui-label>
                        </ui-button>
                    </div>
                    <m-section
                        v-for="(collection, i) in collections"
                        :key="collection.__key"
                        v-model="collection.value.expanded"
                        class="frame"
                        style="padding-right: 15px">
                        <template #header>
                            <div style="flex: 1">
                                <ui-label i18n :value="PKGName + '.home.collect_group'">
                                </ui-label>
                                <ui-label>{{ i + 1 }}</ui-label>
                            </div>
                            <m-icon value="del" @click.stop="onRemoveCollectionClick(i)"></m-icon>
                        </template>
                        <template #content>
                            <m-section v-model="collection.value.dirs.expanded">
                                <template #header>
                                    <ui-label
                                        style="flex: 1"
                                        i18n
                                        :value="PKGName + '.home.search_dir'">
                                    </ui-label>
                                    <m-icon @click.stop @click="onAddToCollectionClick(i, 'dirs')">
                                        +
                                    </m-icon>
                                </template>
                                <template #content>
                                    <div
                                        v-for="(item, j) in collection.value.dirs.items"
                                        :key="item.__key"
                                        class="container">
                                        <m-file
                                            v-model="item.value"
                                            :check-file-exist="true"
                                            :style="{}">
                                            <template #icon>
                                                <m-icon color="true" value="warn-triangle"></m-icon>
                                            </template>
                                            <template #label>
                                                <span class="parent">
                                                    <span>
                                                        <ui-label
                                                            class="weakWhite"
                                                            i18n
                                                            :value="PKGName + '.home.dir'">
                                                        </ui-label>
                                                        <ui-label class="weakWhite" style="margin-right: 28px">
                                                            {{ j + 1 }}
                                                        </ui-label>
                                                    </span>
                                                    <ui-label class="weakWhite" style="margin-right: 8px">
                                                        {{ projectAssetPath }}
                                                    </ui-label>
                                                </span>
                                            </template>
                                            <template #inputIcon>
                                                <m-icon value="folder-open" @click="onSelectCollectionDirClick(i, j)">
                                                </m-icon>
                                            </template>
                                        </m-file>
                                        <!-- 保留起码一个目录 -->
                                        <m-icon
                                            :style="{
                                                visibility:
                                                    collection.value.dirs.items.length >= 2 ? undefined : 'hidden',
                                            }"
                                            value="del"
                                            @click="onRemoveFromCollectionClick(i, j, 'dirs')">
                                        </m-icon>
                                    </div>
                                </template>
                            </m-section>
                            <m-section v-model="collection.value.exts.expanded">
                                <template #header>
                                    <ui-label
                                        style="flex: 1"
                                        i18n
                                        :value="PKGName + '.home.extname'">
                                    </ui-label>
                                    <m-icon @click.stop @click="onAddToCollectionClick(i, 'exts')">
                                        +
                                    </m-icon>
                                </template>
                                <template #content>
                                    <div
                                        v-for="(item, j) in collection.value.exts.items"
                                        :key="item.__key"
                                        class="container">
                                        <m-file v-model="item.value" :check-empty="true">
                                            <template #icon>
                                                <m-icon
                                                    color="true"
                                                    value="warn-triangle"
                                                    style="margin-right: 2px">
                                                </m-icon>
                                            </template>
                                            <template #label>
                                                <span class="parent">
                                                    <span>
                                                        <ui-label
                                                            class="weakWhite"
                                                            i18n
                                                            :value="PKGName + '.home.extname'">
                                                        </ui-label>
                                                        <ui-label class="weakWhite" style="margin-right: 28px">
                                                            {{ j + 1 }}
                                                        </ui-label>
                                                    </span>
                                                    <ui-label style="margin-right: 8px">
                                                        *.
                                                    </ui-label>
                                                </span>
                                            </template>
                                        </m-file>
                                        <m-icon value="del" @click="onRemoveFromCollectionClick(i, j, 'exts')"></m-icon>
                                    </div>
                                </template>
                            </m-section>
                            <m-section v-model="collection.value.excludes.expanded">
                                <template #header>
                                    <ui-label
                                        style="flex: 1"
                                        i18n
                                        :value="PKGName + '.home.exclude_path'">
                                    </ui-label>
                                    <m-icon @click.stop @click="onAddToCollectionClick(i, 'excludes')">
                                        +
                                    </m-icon>
                                </template>
                                <template #content>
                                    <div
                                        v-for="(item, j) in collection.value.excludes.items"
                                        :key="item.__key"
                                        class="container">
                                        <m-file v-model="item.value" :check-file-exist="true">
                                            <template #icon>
                                                <m-icon color="true" value="warn-triangle"></m-icon>
                                            </template>
                                            <template #label>
                                                <span class="parent">
                                                    <span>
                                                        <ui-label
                                                            class="weakWhite"
                                                            i18n
                                                            :value="PKGName + '.home.exclude_path'">
                                                        </ui-label>
                                                        <ui-label class="weakWhite" style="margin-right: 28px">
                                                            {{ j + 1 }}
                                                        </ui-label>
                                                    </span>
                                                    <ui-label class="weakWhite" style="margin-right: 8px">
                                                        {{ projectAssetPath }}
                                                    </ui-label>
                                                </span>
                                            </template>
                                            <template #inputIcon>
                                                <m-icon value="folder-open" @click="onSelectExcludeDirClick(i, j)">
                                                </m-icon>
                                            </template>
                                        </m-file>
                                        <m-icon value="del" @click="onRemoveFromCollectionClick(i, j, 'excludes')">
                                        </m-icon>
                                    </div>
                                </template>
                            </m-section>
                        </template>
                    </m-section>
                    <div class="container" style="margin-top: 62px">
                        <ui-label
                            class="weakWhite"
                            i18n
                            :value="PKGName + '.home.count'"></ui-label>
                        <m-process v-show="collectionProgress !== -1" :value="collectionProgress"></m-process>
                        <ui-label
                            v-show="currentCollectCount !== -1"
                            style="flex: 1"
                            :value="
                                numberFormat(currentCollectCount)
                            ">
                        </ui-label>
                        <ui-label
                            v-show="currentCollectCount === -1 && currentLanguage?.translateTotal"
                            style="flex: 1"
                            :value="
                                currentLanguage?.translateTotal ? numberFormat(currentLanguage?.translateTotal) : ''
                            ">
                        </ui-label>
                        <ui-label
                            v-show="currentCollectCount === -1 && !currentLanguage?.translateTotal"
                            style="flex: 1"
                            class="weakGray"
                            i18n
                            :value="PKGName + '.home.not_recorded'">
                        </ui-label>
                        <m-button
                            :color="'blue'"
                            :disabled="isCollectionDisabled"
                            :has-border="true"
                            style="min-width: 125px"
                            @confirm="onScanClick">
                            <ui-label
                                v-show="isCollecting"
                                color
                                i18n
                                :value="PKGName + '.home.collecting'"></ui-label>
                            <ui-label
                                v-show="!isCollecting"
                                color
                                i18n
                                :value="PKGName + '.home.collect_and_count'">
                            </ui-label>
                        </m-button>
                    </div>
                </div>
                <div ref="languageElement" class="container language">
                    <div class="ball shadow"></div>
                    <ui-label
                        class="strongWhite"
                        i18n
                        :value="PKGName + '.language_compilation'"></ui-label>
                </div>
                <div class="gray language">
                    <div class="container" style="margin-bottom: 16px">
                        <ui-label
                            i18n
                            :value="PKGName + '.home.language:'"
                            style="margin-right: 8px"></ui-label>
                        <ui-button :disabled="!currentLanguage" @confirm="onSelectNewLanguageClick()">
                            <ui-label
                                color
                                i18n
                                :value="PKGName + '.home.add_new_language'"></ui-label>
                        </ui-button>
                    </div>

                    <table>
                        <tr>
                            <th>
                                <ui-label
                                    class="weakWhite"
                                    i18n
                                    :value="PKGName + '.home.language'">
                                </ui-label>
                            </th>
                            <th>
                                <ui-label
                                    class="weakWhite"
                                    i18n
                                    :value="PKGName + '.home.language_for_service_provider'">
                                </ui-label>
                            </th>
                            <th>
                                <ui-label
                                    class="weakWhite"
                                    i18n
                                    :value="PKGName + '.home.translate_process'">
                                </ui-label>
                            </th>
                            <th>
                                <ui-label
                                    class="weakWhite"
                                    i18n
                                    :value="PKGName + '.home.operation'">
                                </ui-label>
                            </th>
                        </tr>
                        <tr
                            v-for="(item, i) in panelTranslateDataList"
                            v-show="currentLanguage"
                            :key="item.value.bcp47Tag">
                            <td>
                                <ui-label :value="item.value.displayName"></ui-label>
                                <ui-label class="weakWhite" :value="`(${item.value.bcp47Tag})`"></ui-label>
                                <ui-label
                                    v-show="item.value.bcp47Tag === currentLanguage?.bcp47Tag"
                                    style="display: block;"
                                    class="weakWhite"
                                    i18n
                                    :value="PKGName + '.home.local_language'">
                                </ui-label>
                            </td>
                            <td v-if="hasService">
                                <ui-select
                                    :placeholder="providerLanguages[item.value.providerTag] ? '' : 'i18n:' + PKGName + '.home.select'"
                                    :value="providerLanguages[item.value.providerTag]"
                                    @confirm="onProviderLanguageSelect($event, i)">
                                    <option v-for="(value, key) of providerLanguages" :key="key">
                                        {{ value }}
                                    </option>
                                </ui-select>
                            </td>
                            <td v-else>
                                <ui-select disabled></ui-select>
                            </td>
                            <td>
                                <div class="container">
                                    <m-process :value="getTranslateProcess(item)" :color="'blue'">
                                    </m-process>
                                    <ui-label
                                        :tooltip="'i18n:' + PKGName + '.home.combine_tooltip'"
                                        :value="getTranslateProcessDescription(item)">
                                    </ui-label>
                                </div>
                            </td>
                            <td>
                                <m-button :color="'blue'" @confirm="onTranslateClick(i)">
                                    <ui-label
                                        v-show="item.value.bcp47Tag === currentLanguage?.bcp47Tag"
                                        color
                                        i18n
                                        :value="PKGName + '.home.complement'">
                                    </ui-label>
                                    <ui-label
                                        v-show="item.value.bcp47Tag !== currentLanguage?.bcp47Tag"
                                        color
                                        i18n
                                        :value="PKGName + '.home.translate'">
                                    </ui-label>
                                </m-button>

                                <m-button
                                    :color="'blue'"
                                    :disabled="!item.value.translateFinished"
                                    @confirm="onPreviewClick(i)">
                                    <ui-label
                                        color
                                        i18n
                                        :value="PKGName + '.home.preview'">
                                    </ui-label>
                                </m-button>
                                <m-button
                                    :color="'blue'"
                                    :disabled="!item.value.translateFinished"
                                    @confirm="onExportClick(i)">
                                    <ui-label
                                        color
                                        i18n
                                        :value="PKGName + '.home.export'">
                                    </ui-label>
                                </m-button>

                                <m-button
                                    :color="'blue'"
                                    :disabled="item.value.bcp47Tag === currentLanguage?.bcp47Tag"
                                    @confirm="onDeleteClick(i)">
                                    <ui-label
                                        color
                                        i18n
                                        :value="PKGName + '.home.delete'"></ui-label>
                                </m-button>
                            </td>
                        </tr>
                        <tr v-show="!currentLanguage">
                            <td>
                                <ui-label
                                    class="weakGray"
                                    i18n
                                    :value="PKGName + '.home.unselect'"></ui-label>
                            </td>
                            <td>
                                <ui-select
                                    disabled
                                    :placeholder="'i18n:' + PKGName + '.home.select'"></ui-select>
                            </td>
                            <td>
                                <div class="container">
                                    <m-process :value="0">
                                    </m-process>
                                </div>
                            </td>
                            <td>
                                <ui-label style="margin-left: 16px" class="weakGray">
                                    -
                                </ui-label>
                            </td>
                        </tr>
                    </table>
                    <div class="container" style="flex-direction: row-reverse; margin-top: 32px">
                        <m-button
                            :color="'blue'"
                            :transparent="true"
                            :has-border="true"
                            :disabled="!currentLanguage"
                            @confirm="onExportAllClick()">
                            <ui-label
                                color
                                i18n
                                :value="PKGName + '.home.export_all'"></ui-label>
                        </m-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import electron from 'electron';
import remote from '@electron/remote';
import { existsSync } from 'fs';
import { dirname, extname, join, relative } from 'path';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { name as PKGName } from '../../../../package.json';
import MButton from '../../../share/ui/m-button.vue';
import MFile from '../../../share/ui/m-file.vue';
import MIcon from '../../../share/ui/m-icon.vue';
import MInput from '../../../share/ui/m-input.vue';
import MProcess from '../../../share/ui/m-process.vue';
import MSection from '../../../share/ui/m-section.vue';
import Iterator from '../../../share/scripts/Iterator';
import { eventBus, wrapper } from '../../index';
import { SupportedTranslateProvider } from '../../../../src/core/entity/config/ITranslateProviderConfig';
import type IScanOption from '../../../../src/core/entity/messages/IScanOption';
import { ProjectAssetPath } from '../../../../src/core/service/util/global';
import { popupLanguage } from '../../../share/scripts/menu';
import { getTranslateFileType, getFileExtNameOfTranslateFileType } from '../../../share/scripts/utils';
import { TranslateFileType } from '../../../../src/core/type/type';
import { getLanguageDisplayName } from '../../../share/scripts/libs/languageMap';

class Collection {
    constructor(
        public expanded: boolean,
        /** 多个搜索的目录 */
        public dirs: { expanded: boolean; items: Iterator[] },
        public exts: { expanded: boolean; items: Iterator[] },
        public excludes: { expanded: boolean; items: Iterator[] },
    ) { }
}

export default {
    components: {
        'm-input': MInput,
        'm-file': MFile,
        'm-process': MProcess,
        'm-icon': MIcon,
        'm-button': MButton,
        'm-section': MSection,
    },
    emits: ['translate'],
    async setup(props, { emit }) {
        onMounted(() => {
            eventBus.on('scanProgress', onScanning);
            eventBus.on('updateAllLanguageConfig', updateAllLanguageConfig);
        });

        onUnmounted(() => {
            eventBus.off('scanProgress', onScanning);
            eventBus.off('updateAllLanguageConfig', updateAllLanguageConfig);
        });
        const isLocalizationEditorEnable = ref((await wrapper.getEnable()) as boolean);
        /** 当前语言显示的名称 */
        const currentLanguageDisplayName = computed(() => {
            return getLanguageDisplayName(currentLanguage.value?.bcp47Tag!, 'none') ?? '';
        });

        /** 现在临时收集到的统计数据 */
        const currentCollectCount = ref(-1);
        function onScanning(finish: number, total: number) {
            collectionProgress.value = total && finish / total;
            currentCollectCount.value = finish;
        }

        /** 更新所有语言配置 */
        async function updateAllLanguageConfig() {
            panelTranslateDataList.value = (await wrapper.getAllLanguageConfigs()).map((data) => new Iterator(data));
            currentLanguage.value = await wrapper.getLocalLanguageConfig();
        }
        /** 支持的服务商 */
        const supportedServices = ref(await wrapper.getTranslateProviders());
        /** 是否正在保存服务商 */
        const isCurrentServiceLoading = ref(false);
        /** 服务商是否修改了数据 */
        const isCurrentServiceDirty = ref(false);
        /** 当前选中的服务商 */
        const currentService = ref(await wrapper.getCurrentTranslateProvider());
        function onAppKeyUpdate(value: string) {
            if (currentService.value) {
                isCurrentServiceDirty.value = true;
                currentService.value.appKey = value;
            }
        }
        function onAppSecretUpdate(value: string) {
            if (currentService.value) {
                isCurrentServiceDirty.value = true;
                currentService.value.appSecret = value;
            }
        }
        /** 当服务商被选择后 */
        async function onSetCurrentTranslateProvider(event: {
            target: { value: SupportedTranslateProvider | 'None' };
        }) {
            const name = event. target.value;
            if (name === 'None') {
                await wrapper.clearTranslateProvider();
                currentService.value = undefined;
                hasService.value = false;
            } else {
                currentService.value = await wrapper.getTranslateProvider(name) ?? {
                    appKey: '',
                    appSecret: '',
                    name: name,
                    qps: 0,
                    url: '',
                };
            }
            isCurrentServiceDirty.value = true;

        }
        /** 服务商能接受的所有语言 */
        const providerLanguages = ref(await wrapper.getProviderLanguages(currentService.value?.name));

        /** 为某个语言配置服务商使用的语言 */
        async function onProviderLanguageSelect(event: { target: { value: string } }, index: number) {
            const displayName: string = event.target.value;
            const providerTag = Object.entries(providerLanguages.value).find(
                ([key, value]) => value === displayName,
            )?.[0];

            if (providerTag) {
                const config = panelTranslateDataList.value[index].value;
                config.providerTag = providerTag;
                await wrapper.setLanguageConfig(config);
            }
        }
        const hasService = ref(!!currentService.value);

        const isCurrentServiceDisabled = computed((): boolean => {
            return !currentService.value?.appKey || !currentService.value?.appSecret || !isCurrentServiceDirty.value;
        });
        /** 点击服务商的提交按钮 */
        async function onProviderSummitClick() {
            if (currentService.value) {
                isCurrentServiceLoading.value = true;
                await wrapper.setCurrentTranslateProvider(currentService.value);
                isCurrentServiceLoading.value = false;
                isCurrentServiceDirty.value = false;
                hasService.value = true;
                providerLanguages.value = await wrapper.getProviderLanguages(currentService.value?.name);
                updateAllLanguageConfig();
            }
        }
        const scanOptions = await wrapper.getScanOptions();
        if (scanOptions.length === 0) {
            scanOptions.push({ dirs: [''], excludes: [], extNames: [] });
        }
        /** 数据集 */
        const collections = ref(
            scanOptions.map((item) => {
                return new Iterator(
                    new Collection(
                        true,
                        {
                            expanded: true,
                            items: item.dirs.map((dir) => new Iterator(dir)),
                        },
                        {
                            expanded: true,
                            items: item.extNames.map((ext) => new Iterator(ext)),
                        },
                        {
                            expanded: true,
                            items: item.excludes.map((exclude) => new Iterator(exclude)),
                        },
                    ),
                );
            }),
        );
        /** 移除一个收集组 */
        function onRemoveCollectionClick(collectionIndex: number) {
            collections.value.splice(collectionIndex, 1);
        }
        /** 添加一个收集组 */
        function onAddCollectionClick() {
            collections.value.push(
                new Iterator(
                    new Collection(
                        true,
                        { expanded: true, items: [new Iterator('')] },
                        { expanded: true, items: [] },
                        { expanded: true, items: [] },
                    ),
                ),
            );
        }
        /** 为一个收集组选择某个包含目录 */
        async function onSelectCollectionDirClick(collectionIndex: number, dirIndex: number) {
            const resourcesPath = join(Editor.Project.path, 'assets');
            const result = await Editor.Dialog.select({
                multi: false,
                type: 'directory',
                path: resourcesPath,
            });
            if (!result.canceled) {
                const dir = relative(ProjectAssetPath, result.filePaths[0]);
                // todo 提示别选这个以外的目录
                if (!collections.value[collectionIndex].value.dirs.items.find((item) => item.value === dir)) {
                    collections.value[collectionIndex].value.dirs.items[dirIndex].value = dir;
                }
                return result;
            }
        }
        /** 为一个收集组选择某个排除目录 */
        async function onSelectExcludeDirClick(collectionIndex: number, dirIndex: number) {
            const resourcesPath = join(Editor.Project.path, 'assets');
            const result = await Editor.Dialog.select({
                multi: false,
                type: 'directory',
                path: resourcesPath,
            });
            if (!result.canceled) {
                const dir = relative(ProjectAssetPath, result.filePaths[0]);
                // todo 提示别选这个以外的目录
                if (!collections.value[collectionIndex].value.excludes.items.find((item) => item.value === dir)) {
                    collections.value[collectionIndex].value.excludes.items[dirIndex].value = dir;
                }
                return result;
            }
        }
        /** 添加到收集组的某一项 */
        function onAddToCollectionClick(collectionIndex: number, key: Exclude<keyof Collection, 'expanded'>) {
            collections.value[collectionIndex].value[key].items.push(new Iterator(''));
            collections.value[collectionIndex].value[key].expanded = true;
        }
        /** 移除收集组的某一项 */
        function onRemoveFromCollectionClick(
            collectionIndex: number,
            index: number,
            key: Exclude<keyof Collection, 'expanded'>,
        ) {
            collections.value[collectionIndex].value[key].items.splice(index, 1);
        }
        /** 收集的进度信息 */
        const collectionProgress = ref(-1);
        /** 是否正在扫描 */
        const isCollecting = ref(false);
        const isCollectingHasWrongDir = computed((): boolean => {
            return collections.value.some((item) =>
                item.value.dirs.items.some(
                    (item) =>
                        !Editor.Utils.Path.contains(ProjectAssetPath, join(ProjectAssetPath, item.value)) ||
                        !existsSync(join(ProjectAssetPath, item.value)),
                ),
            );
        });
        /** 是否禁用点击扫描与统计 */
        const isCollectionDisabled = computed((): boolean => {
            return (
                isCollectingHasWrongDir.value ||
                isCollecting.value ||
                !collections.value.length ||
                !currentLanguage.value
            );
        });
        /** 点击扫描并统计 */
        async function onScanClick() {
            isCollecting.value = true;
            currentCollectCount.value = 0;
            collectionProgress.value = 0; 
            await wrapper.scan(
                collections.value.map((item): IScanOption => {
                    return {
                        dirs: item.value.dirs.items.map((item) => item.value),
                        extNames: item.value.exts.items.map((item) => item.value),
                        excludes: item.value.excludes.items.map((item) => item.value),
                    };
                }),
            );
            
            collectionProgress.value = -1;
            
            isCollecting.value = false;
            // 扫描结束后更新语言配置
            return updateAllLanguageConfig();
        }
        /** 导入的 po 文件组 */
        const importedPOfiles = ref([] as Iterator[]);
        /** 点击导入 po 文件 */
        async function onImportPOClick() {
            const result = await Editor.Dialog.select({
                extensions: 'po',
            });
            if (!result.canceled) {
                const files = result.filePaths.filter(
                    (file) => !importedPOfiles.value.find((item) => item.value === file),
                );
                importedPOfiles.value.push(...files.map((file) => new Iterator(file)));
            }
        }
        /** 移除 po 文件 */
        function onRemovePOClick(index: number) {
            importedPOfiles.value.splice(index, 1);
        }

        /** 语言数据 */
        const panelTranslateDataList = ref((await wrapper.getAllLanguageConfigs()).map((data) => new Iterator(data)));
        console.debug('All language data', panelTranslateDataList);
        /** 当前选中的语言 */
        const currentLanguage = ref(await wrapper.getLocalLanguageConfig());
        console.debug('Data for the current language', currentLanguage);

        /** 语言编译面板点击了翻译 */
        function onTranslateClick(index: number) {
            emit('translate', panelTranslateDataList.value[index].value.bcp47Tag);
        }

        /** 语言编译面板点击了预览*/
        async function onPreviewClick(index: number) {
            const locale = panelTranslateDataList.value[index].value.bcp47Tag;
            await wrapper.previewBy(locale);
            await Editor.Panel.focus('scene');
        }

        /** 语言编译面板点击了删除 */
        async function onDeleteClick(index: number) {
            const result = await wrapper.removeLanguage(panelTranslateDataList.value[index].value.bcp47Tag);
            if (result !== false) {
                await updateAllLanguageConfig();
            }
        }

        /** 导出按钮被点击 */
        async function onExportClick(index: number) {
            let filePath: string;
            let translateFileType: TranslateFileType;
            const locale: string = panelTranslateDataList.value[index].value.bcp47Tag;
            const lastFile = await getLastDialogFilePath();
            const lastExt = extname(lastFile);
            const path = join(dirname(lastFile), `${locale}${lastExt || '.po'}`);
            const result = await Editor.Dialog.save({ filters: [{name: Editor.I18n.t(`${PKGName}.home.po_name`), extensions: ['po']}, {name: Editor.I18n.t(`${PKGName}.home.csv_name`), extensions: ['csv']}, {name: Editor.I18n.t(`${PKGName}.home.xlsx_name`), extensions: ['xlsx']}], path });
            if (!result.canceled && result.filePath){
                filePath = result.filePath;
                setLastDialogFilePath(filePath);
                translateFileType = getTranslateFileType(filePath);
                await wrapper.exportTranslateFile(filePath, translateFileType, locale);
                remote.shell.showItemInFolder(filePath);
            }
        }
        const panelProfileKey = 'panel.default-home';
        const lastFileProfileKey = `${panelProfileKey}.lastFile`;
        const lastDirProfileKey = `${panelProfileKey}.lastDir`;

        /** 获取上次保存的文件的路径 */
        async function getLastDialogFilePath(): Promise<string>{
            return await Editor.Profile.getTemp(PKGName, lastFileProfileKey) || '';
        }

        /** 获取上次保存的目录的路径 */
        async function getLastDialogDirPath(): Promise<string>{
            return await Editor.Profile.getTemp(PKGName, lastDirProfileKey) || '';
        }

        /** 设置最后保存的文件的路径 */
        function setLastDialogFilePath(path: string){
            Editor.Profile.setTemp(PKGName, lastFileProfileKey, path);
        }

        /** 设置最后保存的目录的路径 */
        function setLastDialogDirPath(path: string){
            Editor.Profile.setTemp(PKGName, lastDirProfileKey, path);
        }

        async function selectDirectory(): Promise<string>{
            const result = await Editor.Dialog.select({type: 'directory', multi: false, path: await getLastDialogDirPath()});
            if (!result.canceled){
                const path = result.filePaths[0];
                setLastDialogDirPath(path);
                return path;
            }
            return '';
        }

        async function exportAll(dir: string, translateFileType: TranslateFileType){
            let firstFile: string | undefined;
            await Promise.all(
                panelTranslateDataList.value.map(async item => {
                    const ext = getFileExtNameOfTranslateFileType(translateFileType);
                    const filePath = join(dir, `${item.value.bcp47Tag}${ext}`);
                    if (!firstFile){
                        firstFile = filePath;
                    }
                    return await wrapper.exportTranslateFile(filePath, translateFileType, item.value.bcp47Tag);
                }),
            );
            if (firstFile){
                remote.shell.showItemInFolder(firstFile);
            }
        }
        /** 导出全部按钮被点击*/
        async function onExportAllClick(){
            Editor.Menu.popup({
                menu: [
                    {
                        label: 'po',
                        async click(){
                            const dir = await selectDirectory();
                            if (dir){
                                await exportAll(dir, TranslateFileType.PO);
                            }
                        },
                    },
                    {
                        label: 'csv',
                        async click(){
                            const dir = await selectDirectory();
                            if (dir){
                                await exportAll(dir, TranslateFileType.CSV);
                            }
                        },
                    },
                    {
                        label: 'xlsx',
                        async click(){
                            const dir = await selectDirectory();
                            if (dir){
                                await exportAll(dir, TranslateFileType.XLSX);
                            }
                        },
                    },
                ],
            });

        }
        /** 选择了新的语言 */
        function onSelectNewLanguageClick() {
            popupLanguage(
                async (str, displayName) => {
                    await wrapper.addTargetLanguage(str);
                    await updateAllLanguageConfig();
                },
                panelTranslateDataList.value.map((item) => item.value.bcp47Tag),
            );
        }

        /** 选择本地开发使用的语言 */
        function onSelectLocalClick() {
            popupLanguage(
                async (str) => {
                    await wrapper.setLocalLanguage(str);
                    await updateAllLanguageConfig();
                },
                [currentLanguage?.value?.bcp47Tag ?? ''],
            );
        }

        function getTranslateProcess(item: typeof panelTranslateDataList.value[number]): number {
            if (!currentLanguage.value?.translateTotal) {
                return 0;
            }
            return item.value.translateFinished / currentLanguage.value.translateTotal;
        }

        function getTranslateProcessDescription(item: typeof panelTranslateDataList.value[number]): string {
            if (!currentLanguage.value) {
                return '0%';
            }
            return `${currentLanguage.value.translateTotal &&
                Math.floor((item.value.translateFinished * 100) / currentLanguage.value.translateTotal)
            }%(${wrapper.numberFormat(item.value.translateFinished)}/${wrapper.numberFormat(
                currentLanguage.value.translateTotal,
            )})`;
        }

        function onLinkClick(where: 'i18n' | 'collection') {
            electron.shell.openExternal('https://docs.cocos.com/creator/manual/zh/');
        }

        function onMenuClick(){
            Editor.Menu.popup({
                menu: [
                    {
                        label: Editor.I18n.t('localization-editor.home.turn_off'),
                        async click(){
                            const cancel = 1;
                            const result = await Editor.Dialog.warn(Editor.I18n.t('localization-editor.home.turn_off_warning'), {
                                'buttons': [Editor.I18n.t('localization-editor.confirm'), Editor.I18n.t('localization-editor.cancel')],
                            });
                            if (result.response !== cancel){
                                await toggle();
                                await updateAllLanguageConfig();
                            }
                        },
                    },
                    {
                        label: Editor.I18n.t('localization-editor.home.delete_data'),
                        async click(){
                            const cancel = 1;
                            const result = await Editor.Dialog.warn(Editor.I18n.t('localization-editor.home.delete_data_warning'), {
                                'buttons': [Editor.I18n.t('localization-editor.confirm'), Editor.I18n.t('localization-editor.cancel')],
                                cancel,
                            });
                            if (result.response !== cancel){
                                await wrapper.uninstall();
                            }
                        },
                    },
                ],
            });
        }

        async function toggle(){
            isLocalizationEditorEnable.value = await wrapper.toggle();
        }

        async function onTurnOnClick(){
            await toggle();
        }

        return {
            onExportAllClick,
            onTurnOnClick,
            isLocalizationEditorEnable,
            onMenuClick,
            currentCollectCount,
            isCurrentServiceDirty,
            isCurrentServiceLoading,
            onAppKeyUpdate,
            onAppSecretUpdate,
            onLinkClick,
            onSelectNewLanguageClick,
            hasService,
            isCurrentServiceDisabled,
            getTranslateProcessDescription,
            isCollecting,
            isCollectingHasWrongDir,
            isCollectionDisabled,
            collectionProgress,
            projectAssetPath: ref('db://assets/'),
            onSelectExcludeDirClick,
            onSelectLocalClick,
            onScanClick,
            currentService,
            onProviderSummitClick,
            onSetCurrentTranslateProvider,
            currentLanguage,
            onAddCollectionClick,
            onRemoveCollectionClick,
            collections,
            onAddToCollectionClick,
            onSelectCollectionDirClick,
            onRemoveFromCollectionClick,
            PKGName,
            importedPOfiles,
            onImportPOClick,
            onRemovePOClick,
            panelTranslateDataList,
            providerLanguages,
            supportedServices,
            onTranslateClick,
            onPreviewClick,
            onDeleteClick,
            onExportClick,
            onProviderLanguageSelect,
            t: Editor.I18n.t,
            currentLanguageDisplayName,
            numberFormat: wrapper.numberFormat.bind(wrapper),
            getTranslateProcess,
        };
    },
};
</script>

<style scoped lang="less">
.home {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: @dark-color;
    overflow-y: auto;
    overflow-x: auto;

    ui-input {
        line-height: 20px;
    }

    &>.body {
        display: flex;
        margin: auto;

        ui-select {
            line-height: 20px;
        }

        @import url('../../../share/less/ui-label.less');

        ui-label {
            white-space: nowrap;
        }

        .mProcess {
            width: 200px;
        }

        m-section {
            &> :not(*[slot='header']) {
                margin-top: -10px;
            }
        }

        * {
            &.ball {
                height: 7px;
                width: 7px;
                border-radius: 50%;
                background-color: @white-color;

                &.shadow {
                    box-shadow: 1px 0 4px 0 rgba(255, 255, 255, 0.8);
                }
            }

            // 横向布局的容器
            &.container {
                display: flex;
                flex-direction: row;
                align-items: center;
                padding-top: 2px;
                padding-bottom: 2px;

                &>.mFile {
                    flex: 1;
                    &>.label {
                        &>span.parent {
                            display: flex;
                            justify-content: space-between;
                        }
                    }
                }
            }

            // 灰色背景
            &.gray {
                border-radius: 2px;
                background-color: @strong-gray-color;
                padding: 16px;
            }

            // 线框
            &.frame {
                padding: 10px 16px;
                border: 1px solid @gray-color;

                &:hover {
                    border-color: @weak-gray-color;
                }

                &.mSection {
                    padding: 8px 16px;
                }
            }
        }
        &>div.mask {
            position: fixed;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            z-index: 999;
            display: flex;
            align-items: center;

            &> div {
                margin-left: auto;
                margin-right: auto;
                display: flex;
                flex-direction: column;
                align-items: center;

                &> ui-label {
                    margin-bottom: 20px;
                    line-height: 22px;
                    font-size: 14px;
                    font-weight: 400;
                    color: @white-color;
                    display: block;
                    font-family: "Source Han Sans CN";
                }
                &> ui-button{
                    padding-top: 4px 24px 4px 24px; 
                    border-radius: 4px;

                    &> ui-label {
                        font-weight: 400;
                        font-size: 12px;
                        font-family: "PingFang SC";
                        text-align: center;
                        line-height: 20px;
                    }
                }
            }
        }
        &>div.main {

            &>div.title {
                display: flex;
                align-items: center;
                margin-bottom: 36px;
                margin-top: 32px;

                &>ui-label {
                    font-family: @ping-fang-font;
                    text-align: left;
                    font-size: 20px;
                    font-weight: 700;
                    line-height: 26px;
                    letter-spacing: 2px;
                }
            }

            left: 0px;
            right: 0px;
            margin-left: auto;
            margin-right: auto;
            div.container {
                min-height: 24px;

                &>*:not(:last-child) {
                    margin-right: 8px;
                }
            }

            &>div {
                &.container {
                    &>div.ball {
                        margin-right: 8px;
                    }
                }

                &.gray {

                    div.container {
                        &>.left {
                            min-width: 70px;
                        }
                    }

                    &.service {
                        padding: 16px;
                        margin-top: 8px;
                        margin-bottom: 32px;

                        &>div.container {
                            &>.left {
                                &>ui-label {
                                    margin: 0;
                                }
                            }

                            &>.mInput {
                                width: 360px;
                                height: 20px;
                                line-height: 20px;
                            }

                            &>ui-select {
                                width: 262px;
                            }
                        }

                        &>div.footer {
                            display: flex;
                            flex-direction: row-reverse;
                        }
                    }

                    &.collect {
                        margin-top: 8px;
                        margin-bottom: 32px;

                        &>div.mSection {
                            &>.header {
                                &:hover {
                                    &>.mIcon {
                                        visibility: visible;
                                    }
                                }

                                &>.mIcon {
                                    visibility: hidden;
                                }
                            }
                        }

                        &>div.mSection:first {
                            margin-top: 4px;
                        }

                        div.content>.mSection {
                            margin-top: 4px;

                            &>.header {
                                &>ui-button {
                                    padding: 0px;
                                }

                                &>*:last-child {
                                    width: 16px;
                                }
                            }

                            &>.content {
                                &>div.container {
                                    height: 24px;
                                    position: relative;
                                    padding-left: 6px;

                                    &>.mFile {
                                        &>ui-prop {
                                            &>.mIcon {
                                                position: absolute;
                                                top: 0px;
                                                left: -15px;
                                            }
                                        }
                                    }

                                    &:hover,
                                    :focus-within {
                                        &>.mIcon {
                                            visibility: visible;
                                        }
                                    }

                                    &>.mIcon {
                                        visibility: hidden;
                                    }
                                }
                            }
                        }

                        &>div.container {
                            &>ui-select {
                                width: 243px;
                            }
                        }
                    }

                    &.language {
                        margin-top: 8px;
                        margin-bottom: 300px;

                        &>div.container {
                            &>ui-select {
                                width: 258px;
                            }
                        }

                        &>table,
                        &>table>tr,
                        &>table>tr>td,
                        &>table>tr>th {
                            border: 1px solid @gray-color;
                            border-collapse: collapse;

                            ui-select {
                                min-width: 140px;
                            }
                        }

                        // 表头
                        &>table>tr>th {
                            padding-left: 16px;
                            padding-right: 16px;
                            text-align: left;
                            height: 30px;
                        }

                        &>table>tr>td {
                            width: 198px;
                            padding: 8px 16px;

                            &:last-child {
                                padding-left: 4px;
                                white-space: nowrap;
            
                                &>ui-button {
                                    padding-left: 12px;
                                    padding-right: 12px;
                                }
                            }

                            &>div>.mProcess {
                                width: 88px;
                            }

                            &>ui-select {
                                margin-top: 8px;
                            }

                            &>.mButton {
                                width: 36px;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>
