import TranslateItem from './TranslateItem';
import LanguageConfig from './LanguageConfig';
import { TranslateItemValue } from '../../type/type';
import TranslateItemType from './TranslateItemType';
import type { ResourceData } from '../../../../@types/runtime/l10n';
import ITranslateData from './ITranslateData';
import ILanguageConfig from './ILanguageConfig';
import ITranslateItem from './ITranslateItem';

export default class TranslateData implements ITranslateData {
    static INDEX_LOCALE = 'index';

    items: Map<string, TranslateItem> = new Map<string, TranslateItem>();
    languageConfig: LanguageConfig;

    constructor(
        public locale: Intl.BCP47LanguageTag = TranslateData.INDEX_LOCALE,
    ) {
        this.languageConfig = new LanguageConfig(locale);
    }

    clone(): TranslateData {
        const result = new TranslateData(this.locale);
        result.languageConfig = this.languageConfig.clone();
        for (const [key, value] of this.items.entries()) {
            result.items.set(key, value.clone());
        }
        return result;
    }

    static parse(data: TranslateData): TranslateData {
        const result = new TranslateData(data.locale);
        if (data.languageConfig) {
            result.languageConfig = LanguageConfig.parse(data.languageConfig);
        }
        for (const key in data.items) {
            // @ts-ignore
            const value = data.items[key];
            result.items.set(key, TranslateItem.parse(value));
        }
        return result;
    }

    toObject(): TranslateDataObject {
        return {
            locale: this.locale,
            languageConfig: this.languageConfig,
            items: Object.fromEntries(this.items),
        };
    }

    static fromObject(data: TranslateDataObject): TranslateData {
        return TranslateData.parse(data as any);
    }

    toResourceData(): ResourceData {
        const resourceData: ResourceData = {
            translation: {},
        };
        for (const [key, item] of this.items.entries()) {
            resourceData.translation[item.key] = item.value;
            for (const v of item.variants) {
                resourceData.translation[v.key] = v.value;
            }
        }
        return resourceData;
    }

    transformToValueMap(): Map<TranslateItemValue, TranslateItem> {
        const valueMap: Map<TranslateItemValue, TranslateItem> = new Map<TranslateItemValue, TranslateItem>();
        for (const item of this.items.values()) {
            if (item.type !== TranslateItemType.Media && item.value.length > 0) {
                valueMap.set(item.value, item);
            }
        }
        return valueMap;
    }

    statisticsFinished(localLanguageData: TranslateData): number {
        let translateFinished = 0;
        for (const [key, value] of localLanguageData.items.entries()) {
            if (this.items.has(key)) {
                translateFinished += value.length;
            }
        }
        (this.languageConfig)!.translateFinished = translateFinished;
        return translateFinished;
    }

    statisticsTotal() {
        let translateTotal = 0;
        this.items.forEach((item) => {
            translateTotal += item.length;
        });
        (this.languageConfig)!.compileTotal = this.items.size;
        (this.languageConfig)!.translateTotal = translateTotal;
    }
}

export interface TranslateDataObject {
    locale: Intl.BCP47LanguageTag;
    languageConfig?: ILanguageConfig;
    items: { [key: string]: ITranslateItem };
}
