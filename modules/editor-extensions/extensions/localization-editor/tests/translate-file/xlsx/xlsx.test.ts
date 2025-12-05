import { container } from 'tsyringe';
import XLSXWriter from '../../../src/core/writer/XLSXWriter';
import TranslateData from '../../../src/core/entity/translate/TranslateData';
import UUIDService from '../../../src/core/service/util/UUIDService';
import TranslateItem from '../../../src/core/entity/translate/TranslateItem';
import TranslateItemType from '../../../src/core/entity/translate/TranslateItemType';
import XLSXReader from '../../../src/core/reader/XLSXReader';

describe('Translate File for xlsx', () => {
    test('export', () => {
        const uuidService = container.resolve(UUIDService);
        const local = new TranslateData('zh-Hans-CN');
        for (let i = 0; i < 10; ++i) {
            const key = uuidService.v4();
            const value = uuidService.v4();
            local.items.set(key, new TranslateItem(key, value, TranslateItemType.Text));
        }

        const data = new TranslateData('en-US');
        for (const [key, item] of local.items) {
            data.items.set(key, item.clone().clearValue());
        }

        const xlsxWriter = container.resolve(XLSXWriter);
        xlsxWriter.write(`${data.locale}.xlsx`, data, local);
    });

    test('import', () => {
        const xlsxReader = container.resolve(XLSXReader);
        xlsxReader.read('en-US.xlsx');
    });
});
