import { assetManager, AssetManager } from 'cc';
// @ts-ignore
import { EDITOR, PREVIEW } from 'cc/env';
import type { L10nManager } from './l10n-manager';
import { pluginName } from './localization-global';

export default class AMPipeLineManager {
    initialized = false;
    l10n?: L10nManager = undefined;
    _redirectTask: this['redirectTask'];
    initAssetManager(l10n: L10nManager) {
        if (!this.initialized) {
            this.l10n = l10n;
            this._redirectTask = this.redirectTask.bind(this);
            assetManager.transformPipeline.append(this._redirectTask);
            this.initialized = true;
        }
    }

    uninstall() {
        const index = assetManager.transformPipeline.pipes.findIndex(it => it === this._redirectTask);
        if (index >= 0) {
            assetManager.transformPipeline.remove(index);
        }
    }

    redirectTask = (task: { output: AssetManager.RequestItem[]; input: AssetManager.RequestItem[]; }) => {
        const input = (task.output = task.input);
        for (let i = 0; i < input.length; i++) {
            const item = input[i];

            if (!item.url || !item.isNative) {
                continue;
            }

            let newUUID = item.uuid;
            const arr = newUUID.split('@');
            const translatedUUID = this.l10n?.t(arr[0]) ?? arr[0];
            arr[0] = translatedUUID;
            newUUID = arr.join('@');
            const oldUUID = item.uuid;
            const newURL = item.url.replace(`${oldUUID.slice(0, 2)}/${oldUUID}`, `${newUUID.slice(0, 2)}/${newUUID}`);
            const redirectLog = `[${pluginName}]: Change URL "${item.url}" for asset with UUID "${oldUUID}" to "${newURL}"`;
            if (oldUUID === newUUID) {
                return;
            }
            if (EDITOR || PREVIEW) {
                console.debug(redirectLog);
                item.url = newURL;
            } else {
                if (!item.config) {
                    return;
                }
                const newAsset = item.config.getAssetInfo(newUUID);
                if (newAsset && !newAsset.redirect) {
                    item.url = newURL;
                    console.debug(redirectLog);
                } else {
                    console.warn(`[${pluginName}]: Failed to redirect an asset with UUID "${oldUUID}" because the asset with UUID "${newUUID}" could not be found in the bundle named ${item.config.name}`);
                }
            }
        }
        return;
    }
}
