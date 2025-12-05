import { singleton } from 'tsyringe';
import TranslateDataSourceService from './TranslateDataSourceService';
import TranslateData from '../../entity/translate/TranslateData';
import type { ResourceBundle } from '../../../../@types/runtime/l10n';

@singleton()
export default class CompileService {
    constructor(
        public translateDataSourceService: TranslateDataSourceService,
    ) {}

    async compile(locales: Intl.BCP47LanguageTag[]): Promise<ResourceBundle> {
        let translateDataArray!: TranslateData[];
        if (locales.length > 0) {
            translateDataArray = locales.map((it) => this.translateDataSourceService.getClonedTranslateData(it)!);
        } else {
            translateDataArray = this.translateDataSourceService.getClonedAllTranslateData().filter(data => data.locale !== TranslateData.INDEX_LOCALE);
        }
        return translateDataArray
            .reduce<ResourceBundle>((resourceBundle, translateData) => {
                resourceBundle[translateData.locale] = translateData.toResourceData();
                return resourceBundle;
            }, {});
    }
}
