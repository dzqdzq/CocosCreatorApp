/**
 * 在此文件内调整 settings 里记录的场景 url 后缀，以及 bundle config 里的场景后缀
 */
import { IInternalBuildOptions, InternalBuildResult, BuilderAssetCache, IBundle} from '@cocos/creator-types/editor/packages/builder/@types/protected';

export const throwError = true;

export function onBeforeCompressSettings(options: IInternalBuildOptions, result: InternalBuildResult, cache: BuilderAssetCache) {
    result.settings.launch.launchScene = changeSceneUrl(result.settings.launch.launchScene);
}

export function onAfterBundleDataTask(options: IInternalBuildOptions, bundles: IBundle[], cache: BuilderAssetCache) {
    bundles.forEach((bundle) => {
        bundle.scenes.forEach((scene) => {
            scene.url = changeSceneUrl(scene.url);
        });
    });
}

function changeSceneUrl(url: string) {
    if (url.endsWith('.hmi-scene')) {
        return url.replace('.hmi-scene', '.scene');
    }
    return url;
}