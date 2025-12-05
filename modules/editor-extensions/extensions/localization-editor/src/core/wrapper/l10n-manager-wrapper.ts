import { join } from 'path';
import { assetManager } from 'cc';

import IL10nManagerWrapper from './il10n-manager-wrapper';
import { MainName } from '../service/util/global';
import { singleton } from 'tsyringe';
import { i18n } from 'i18next';
import EditorMessageService from '../service/EditorMessageService';
import { TranslateDataObject } from '../entity/translate/TranslateData';
import TranslateItemType from '../entity/translate/TranslateItemType';
import MainIPC from '../ipc/MainIPC';
import type { L10nManager, ResourceBundle } from '../../../@types/runtime/l10n';

module.paths.push(join(Editor.App.path, 'node_modules'));

@singleton()
export default class L10nManagerWrapper implements IL10nManagerWrapper {
    static DEFAULT_NAMESPACE = 'translation';

    constructor(
        public editorMessageService: EditorMessageService,
        public mainIpc: MainIPC,
    ) {}

    async l10nManager(): Promise<L10nManager> {
        return ((await Editor.Module.importProjectModule(`db://${MainName}/core/l10n-manager.ts`)) as { default: L10nManager }).default;
    }

    async preview(locale: Intl.BCP47LanguageTag, indexData: TranslateDataObject): Promise<void> {
        const l10nManager = await this.l10nManager();
        if (!l10nManager.isInitialized()) {
            await l10nManager.createIntl({});
        }
        await (await this.l10nManager()).changeLanguage(locale);
        await this.releaseAsset(indexData);
        this.editorMessageService.softReload();
    }

    async reloadResourceData(): Promise<boolean> {
        const l10nManager = (await this.l10nManager());
        const result = l10nManager.reloadResourceData();
        await this.releaseAsset();
        await this.editorMessageService.softReload();
        return result;
    }

    async addResourceBundle(language: Intl.BCP47LanguageTag, resourceBundle: ResourceBundle): Promise<void> {
        const l10nManager = (await this.l10nManager());
        const _intl: i18n | undefined = l10nManager['_intl'];
        if (_intl?.hasResourceBundle(language, L10nManagerWrapper.DEFAULT_NAMESPACE)) {
            _intl?.removeResourceBundle(language, L10nManagerWrapper.DEFAULT_NAMESPACE);
        }
        const resourceItem = resourceBundle[language][L10nManagerWrapper.DEFAULT_NAMESPACE];
        _intl?.addResourceBundle(language, L10nManagerWrapper.DEFAULT_NAMESPACE, resourceItem, true, true);
        this.editorMessageService.softReload();
    }

    async removeResourceBundle(language: Intl.BCP47LanguageTag, indexData: TranslateDataObject): Promise<void> {
        const l10nManager = (await this.l10nManager());
        const _intl: i18n | undefined = l10nManager['_intl'];
        _intl?.removeResourceBundle(language, L10nManagerWrapper.DEFAULT_NAMESPACE);
        delete l10nManager['resourceBundle'][language];
        await this.releaseAsset(indexData);
        this.editorMessageService.softReload();
    }

    async uninstall(): Promise<void> {
        const l10nManager = (await this.l10nManager());
        l10nManager['_intl'] = undefined;
        l10nManager['resourceList'] = undefined;
        l10nManager['resourceBundle'] = {};
        const amPipeLineManager = l10nManager.amPipeLineManager;
        amPipeLineManager.uninstall();
    }

    /**
     * 释放 assetManager 中原文使用的的资源，使得该资源重新加载
     */
    async releaseAsset(indexData?: TranslateDataObject) {
        let assetsId: string[];
        if (indexData) {
            assetsId = Object.entries(indexData.items)
                .filter(entry => entry[1].type === TranslateItemType.Media)
                .map(entry => entry[0]);
        } else {
            assetsId = (await this.mainIpc.getIndexData())
                .filter(item => item.type === TranslateItemType.Media)
                .map(item => item.key);
        }
        // 释放所有原文的资源
        for (const id of assetsId) {
            assetManager.assets.forEach((asset) => {
                if (asset._uuid.startsWith(id)) {
                    assetManager.releaseAsset(asset);
                    console.debug('[localization-editor]: release asset', asset);
                }
            });
        }
    }
}
