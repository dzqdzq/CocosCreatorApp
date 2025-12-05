import { join } from 'path';

module.paths.push(join(Editor.App.path, 'node_modules'));
import * as cc from 'cc';
import { autoInjectable } from 'tsyringe';
import AssetSerializeService from '../serialize/AssetSerializeService';
import { AssetInfo, QueryAssetsOption } from '@editor/library-type/packages/asset-db/@types/public';
import SceneProcessor from './SceneProcessor';

@autoInjectable()
export default class ComponentUnLoader {
    constructor(
        public assetSerializeService: AssetSerializeService,
    ) {
    }

    process(assetInfo: AssetInfo) {
        let baseNode: cc.BaseNode | null = null;
        let asset!: cc.Asset;
        if (assetInfo.type.includes('Scene')) {
            const sceneAsset = this.assetSerializeService.deserializeFile<cc.SceneAsset>(assetInfo.file);
            asset = sceneAsset;
            baseNode = sceneAsset.scene;
        } else if (assetInfo.type.includes('Prefab')) {
            const prefabAsset = this.assetSerializeService.deserializeFile<cc.Prefab>(assetInfo.file);
            asset = prefabAsset;
            baseNode = prefabAsset.data;
        }
        if (!baseNode) return;
        const destroyCount = this.unloadComponent(baseNode);
        if (destroyCount > 0) {
            this.assetSerializeService.serialize(assetInfo.file, asset);
        }
    }

    unloadComponent(baseNode: cc.BaseNode): number {
        let destroyCount = 0;
        baseNode.walk((node: cc.BaseNode) => {
            if (node instanceof cc.Node) {
                const i18nLabel = node.getComponent(SceneProcessor.L10nLabelComponentName);
                if (i18nLabel) {
                    i18nLabel.destroy();
                    destroyCount += 1;
                }
                const icuComponent = node.getComponent(SceneProcessor.ICUComponentName);
                if (icuComponent) {
                    icuComponent.destroy();
                    destroyCount += 1;
                }
            }
        });
        cc.CCObject._deferredDestroy();
        return destroyCount;
    }
}
