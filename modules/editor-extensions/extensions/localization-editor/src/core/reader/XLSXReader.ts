import CSVReader from './CSVReader';
import { singleton } from 'tsyringe';
import TranslateData from '../entity/translate/TranslateData';
import { readFile, utils } from 'xlsx';
import { CustomError } from '../error/Errors';
import { MessageCode } from '../entity/messages/MainMessage';
import ICSVTranslateItem from '../entity/csv/ICSVTranslateItem';
import { TranslateFileType } from '../type/type';

@singleton()
export default class XLSXReader extends CSVReader {
    type: TranslateFileType = TranslateFileType.XLSX

    async read(filePath: string): Promise<TranslateData> {
        const workbook = readFile(filePath);
        if (workbook.SheetNames.length < 1) {
            throw new CustomError(MessageCode.UNAVAILABLE_XLSX_FILE, 'no worksheets');
        }
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const csvTranslateItems: ICSVTranslateItem[] = utils.sheet_to_json<ICSVTranslateItem>(worksheet);
        return this.generateTranslateData(csvTranslateItems);
    }
}
