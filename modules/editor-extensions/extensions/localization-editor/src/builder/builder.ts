import 'reflect-metadata';
import { existsSync, readdir } from 'fs-extra';
import { basename, join } from 'path';
import { container, singleton } from 'tsyringe';
import { IInternalBuildPluginConfig } from '@editor/library-type/packages/builder/@types/protect';
import CacheService from '../core/service/util/CacheService';
import { MainName, resourceBundlePath, resourceListPath, RuntimeBundleName } from '../core/service/util/global';
import IBuilder from './IBuilder';
import EditorMessageService from '../core/service/EditorMessageService';
import MainIPC from '../core/ipc/MainIPC';
import ILanguageConfig from '../core/entity/translate/ILanguageConfig';

const editorMessageService = container.resolve(EditorMessageService);

@singleton()
class Builder implements IBuilder {
    constructor(
        public mainIPC: MainIPC,
        public editorMessageService: EditorMessageService,
    ){

    }
    private readonly panelPath = '../../panel-dist/builder/index.js';
    async load() {
        container.resolve(CacheService).clear();
        this.configs['*'].panel = (await this.mainIPC.getLocalLanguage()) ? this.panelPath : undefined;
    }

    /**
     * 构建面板属性配置
     */
    configs: Record<'*', IInternalBuildPluginConfig> = {
        '*': {
            hooks: './hooks',
        },
    };
    /** icu polyfill 的路径 */
    icuDirPath = join(__dirname, '../../static/assets/polyfills').replace('app.asar', 'app.asar.unpacked');

    async getAllLanguagesInfo(): Promise<ILanguageConfig[]>{
        const localLanguage = await this.mainIPC.getLocalLanguage();
        const languageConfigs: ILanguageConfig[] = [];
        if (localLanguage){
            const localConfig = await this.mainIPC.getLanguageConfig(localLanguage);
            const allLanguageConfigs = await this.mainIPC.getAllLanguageConfigs();
            languageConfigs.push( ...allLanguageConfigs);
            if (localConfig){
                languageConfigs.push(localConfig);
            }
        }
        return languageConfigs;
    }

    async getICUlPolyfillFileInfos(): Promise<{ name: string, uuid: string }[]> {
        if (existsSync(this.icuDirPath)) {
            const files = (await readdir(this.icuDirPath)).map(it => join(this.icuDirPath, it)).filter(file => file.endsWith('.ts'));
            const result: { name: string, uuid: string }[] = [];
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                const assetInfo = await editorMessageService.queryAssetInfo(file);
                if (assetInfo?.uuid) {
                    result.push({
                        name: basename(file, '.ts'),
                        uuid: assetInfo.uuid,
                    });
                } else {
                    console.warn(`[${MainName}]: cannot get assetInfo of ${file}`);
                }

            }
            return result;
        } else {
            return [];
        }
    }

    public readonly ResourceListJsonURL = `db://${MainName}/${RuntimeBundleName}/${resourceListPath}.json`
    public readonly ResourceBundleJsonURL = `db://${MainName}/${RuntimeBundleName}/${resourceBundlePath}.json`
    
    public async getResourceListJsonAssetInfo(){
        const info = await this.editorMessageService.queryAssetInfo(this.ResourceListJsonURL);
        if (!info){
            console.warn(`[${MainName}]: cannot get assetInfo of ${this.ResourceListJsonURL}`);
        }
        return info;
    }
    public async getResourceBundleJsonAssetInfo(){

        const info = await this.editorMessageService.queryAssetInfo(this.ResourceBundleJsonURL);
        if (!info){
            console.warn(`[${MainName}]: cannot get assetInfo of ${this.ResourceBundleJsonURL}`);
        }
        return info;
    }
}
const builder = container.resolve(Builder);
module.exports = builder;
export default builder;
