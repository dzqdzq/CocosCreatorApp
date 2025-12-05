/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import 'reflect-metadata';
import { JsonAsset } from 'cc';
import { container } from 'tsyringe';
import TranslateItemType from '../core/entity/translate/TranslateItemType';
import ILanguageInfo from './ILanguageInfo';
import IPolyFillInfo from './IPolyfillInfo';
import { ITaskOptions } from './ITaskOptions';
import builder from './builder';
import WrapperMainIPC from '../core/ipc/WrapperMainIPC';
import { BuilderAssetCache, InternalBuildResult } from '@editor/library-type/packages/builder/@types/protect';
import IWrapperTranslateItem from '../core/entity/translate/IWrapperTranslateItem';
import MainIPC from '../core/ipc/MainIPC';
import type { ResourceList } from '../../@types/runtime/l10n';
import { AssetInfo } from '@editor/library-type/packages/asset-db/@types/public';
import { MainName } from '../core/service/util/global';

const mainIPC = container.resolve(MainIPC);
const wrapper = container.resolve(WrapperMainIPC);

/**
 * 获取记录在 resource-list 并且被构建参数选中的内容
 * @param options
 * @returns
 */
async function getTargetLanguages(options: ITaskOptions) {
    const languageMapFromOptions: Readonly<Record<string, ILanguageInfo | undefined>> = options.packages['localization-editor']?.targetLanguageMap ?? {};
    const localesFormResourceData = await builder.getAllLanguagesInfo();
    // 使用的目标语言
    const targetLanguages = Object.values(languageMapFromOptions)
        .filter((item) => item && item.value)
        .map((item) => item!.locale)
        .filter((locale) => localesFormResourceData.some(item => item.bcp47Tag === locale));
    return targetLanguages;
}

/** 初始化参数，补充默认语言和备选语言 */
async function initOptions(options: ITaskOptions) {
    options.packages['localization-editor'] ??= {};
    let localLanguage = '';
    try {
        localLanguage = await wrapper.getLocalLanguage();
    } catch (error) {

    }
    const targetLanguages = await getTargetLanguages(options);
    if (localLanguage) {
        options.packages['localization-editor'].defaultLanguage ??= localLanguage;
        options.packages['localization-editor'].fallbackLanguage ??= localLanguage;
        // 如果发现语言不存在于勾选得语言中则采用本地开发语言作为兜底
        if (!targetLanguages.includes(options.packages['localization-editor'].defaultLanguage)) {
            options.packages['localization-editor'].defaultLanguage = localLanguage;
        }
        if (!targetLanguages.includes(options.packages['localization-editor'].fallbackLanguage)) {
            options.packages['localization-editor'].fallbackLanguage = localLanguage;
        }

    }
}
/**
 * 在这个方法中为默认的资源增加引用
 * @param options
 * @param result
 */
export async function onAfterInit(options: ITaskOptions, result: InternalBuildResult, cache: BuilderAssetCache) {
    if (!await mainIPC.getEnable()) {
        return;
    }
    const packableUUIDSet = new Set<string>();
    const useCompressTextureMap = new Map<string, string>();
    await initOptions(options);
    const targetLanguages: string[] = await getTargetLanguages(options);
    for (let index = 0; index < targetLanguages.length; index++) {
        const locale = targetLanguages[index];
        console.debug(`[localization-editor]: start add depend of ${locale}`);
        let fileDataList: IWrapperTranslateItem[] = [];
        try {
            fileDataList = (await wrapper.getTranslateData(locale)).filter((item) => item.type === TranslateItemType.Media);
        } catch (error) {
            console.error(error);
            fileDataList = [];
        }

        for (let index = 0; index < fileDataList.length; index++) {
            let originAssetUseCompressTexture = false;
            const data = fileDataList[index];
            const info = cache.getAssetInfo(data.key);
            if (info) {
                checkSpriteFrame(info, cache, packableUUIDSet);
                originAssetUseCompressTexture = await isUseCompressTexture(info, cache);
            }
            if (data.key === data.value) {
                continue;
            }
            const depends = await cache.getDependUuids(data.key) as string[];
            if (!depends.includes(data.value)) {
                const assetInfo = await cache.getAssetInfo(data.value);
                if (assetInfo) {

                    const targetAssetUseCompressTexture = await isUseCompressTexture(assetInfo, cache);
                    if (originAssetUseCompressTexture !== targetAssetUseCompressTexture) {
                        useCompressTextureMap.set(data.key, data.value);
                        continue;
                    }
                    checkSpriteFrame(assetInfo, cache, packableUUIDSet);
                    const subAssets = assetInfo.subAssets ?? {};
                    depends.push(data.value);
                    console.debug(`[localization-editor]: ${data.key} add depends ${data.value}`);
                    for (const key in subAssets) {
                        const asset = subAssets[key];
                        depends.push(asset.uuid);
                        console.debug(`[localization-editor]: ${data.key} add depends ${asset.uuid}`);
                    }
                } else {
                    console.error(`[localization-editor]: failed to add depends of ${data.key}, assetInfo of ${data.value} is not exist `);
                }
            }
        }
    }

    packableUUIDSet.forEach(item => {
        console.error(`[${MainName}]: ${Editor.I18n.t(MainName + '.build.packable_warning').replace('${uuid}', item)}`);
    });
    useCompressTextureMap.forEach((key, value) => {
        console.error(`[${MainName}]: ${Editor.I18n.t(MainName + '.build.compress_warning').replace('${a}', key).replace('${b}', value)}`);
    })
    if (packableUUIDSet.size || useCompressTextureMap.size) {
        throw new Error(`[${MainName}]: build failed`);
    }
}

export async function onBeforeBuildAssets(options: ITaskOptions, result: InternalBuildResult, cache: BuilderAssetCache) {
    try {
        if (!await mainIPC.getEnable()) {
            return;
        }
        // 1、剔除 icu
        const polyfillMapFromOptions: Readonly<Record<string, IPolyFillInfo>> = options.packages['localization-editor']?.polyfillMap ?? {};
        const polyfillFileInfos = (await builder.getICUlPolyfillFileInfos());
        const targetLanguages = await getTargetLanguages(options);
        /** 没记录在 resource-list 或者不是需要的语言的语言表 */
        const necessaryPolyfillNames: string[] = ['Intl.PluralRules'];
        result.bundles.forEach((bd) => {
            // 1、剔除 icu
            for (let index = 0; index < polyfillFileInfos.length; index++) {
                const info = polyfillFileInfos[index];
                const uuid = info.uuid;
                if (!targetLanguages.length) {
                    // 没有使用任何语言，全部剔除这些模块，防止打入游戏内
                    bd.removeAsset(uuid);
                } else if (!necessaryPolyfillNames.includes(info.name)) {
                    // 如果使用了任意一个语言，则仅仅剔除非必要的 polyfill
                    bd.removeAsset(uuid);
                }
            }
        });

        const resourceListJsonAssetInfo = await builder.getResourceListJsonAssetInfo();
        if (!resourceListJsonAssetInfo) {
            return;
        }
        const resourceListJsonInstance = await cache.getInstance(resourceListJsonAssetInfo.uuid) as JsonAsset;
        const resourceListJson: ResourceList = (resourceListJsonInstance.json ?? {}) as ResourceList;
        resourceListJsonInstance.json = resourceListJson;
        resourceListJson.defaultLanguage = options.packages['localization-editor']?.defaultLanguage!;
        resourceListJson.fallbackLanguage = options.packages['localization-editor']?.fallbackLanguage!;
        resourceListJson.languages = targetLanguages;

        cache.addInstance(resourceListJsonInstance);
        const resourceBundleJsonAssetInfo = await builder.getResourceBundleJsonAssetInfo();
        if (!resourceBundleJsonAssetInfo) {
            return;
        }
        const resourceBundleJsonAssetInstance = await cache.getInstance(resourceBundleJsonAssetInfo.uuid) as JsonAsset;
        resourceBundleJsonAssetInstance.json = await mainIPC.getResourceBundle(targetLanguages);
        cache.addInstance(resourceBundleJsonAssetInstance);
    } catch (error) {
        console.warn(error);
    }
}

async function checkSpriteFrame(info: AssetInfo | null, cache: BuilderAssetCache, warningUUIDSet: Set<string>) {
    if (!info || info.type !== 'cc.ImageAsset') {
        return;
    }

    for (const key in info?.subAssets) {
        const subAsset = info.subAssets[key];
        if (subAsset?.type === 'cc.SpriteFrame' && (await cache.getMeta(subAsset.uuid))?.userData?.packable) {
            warningUUIDSet.add(subAsset.uuid);
        }
    }
}

async function isUseCompressTexture(info: AssetInfo | null, cache: BuilderAssetCache): Promise<boolean> {
    if (!info || info.type !== 'cc.ImageAsset') {
        return false;
    }
    const meta = (await cache.getMeta(info.uuid));
    if (meta?.userData?.compressSettings?.useCompressTexture) {
        return true;
    }

    return false;
}