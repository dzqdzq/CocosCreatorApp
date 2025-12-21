import XLSX from 'xlsx';
import { writeJsonSync, existsSync } from 'fs-extra';
import { join } from 'path';

/**
 * 该文件用于 google g4 统计，把 create数据需求表.xlsx 中的 数据系统埋点总表 转换成 json
 * 如果 xlsx 字段有更新可以用这个进行更新
 */
(() => {

    function getData(row: number, col: number) {
        const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
        const cell = worksheet[cellAddress];
        return cell ? cell.v : undefined;
    }

    const jsonName = 'googleG4Table.json';
    const xlsxName = 'cocos create数据需求表.xlsx';
    const staticsDir = join(__dirname, '..', 'statics');
    const src = join(staticsDir, xlsxName);
    const dist = join(staticsDir, jsonName);

    if (!existsSync(src)) {
        console.error(new Error(`转换失败，需要把 ${xlsxName} 复制到 ${staticsDir} 文件夹下`));
        return;
    }

    const workbook = XLSX.readFile(src);
    // 数据系统埋点总表（按照功能区分），在 Sheet 为 9 的位置
    const sheetName = workbook.SheetNames[9];
    const worksheet = workbook.Sheets[sheetName];
    // 注意：如果表格的数据修改了，这些数值也要跟着改
    const row = 0;
    const col = 7;
    const totals = 500;
    const eventValueKeyCol = col + 1;
    const ga4ActionCol = col + 4;
    const ga4LabelCol = col + 5;
    const eventMap: { [key: string]: any } = {};
    for (let row = 0; row < totals; row++) {
        const state = getData(row, 1);
        const eventID = getData(row, col);
        const eventValueKey = getData(row, eventValueKeyCol);

        if (!eventID || !eventValueKey || !state ||
            state !== '生效' ||
            eventID === 'dashboard' || eventID === 'other' ||
            eventValueKey === 'projectId'
        ) {
            continue;
        }

        const ga4Action = getData(row, ga4ActionCol);

        if (!ga4Action || ga4Action === '-') continue;

        let ga4Label = getData(row, ga4LabelCol) || '';
        if (ga4Label === '-') {
            ga4Label = '';
        }
        else if (ga4Label === '{0/1}' ||
            ga4Label === '{1/2}' ||
            ga4Label === '{labelName}' ||
            ga4Label === '{processName}' ||
            ga4Label === '{panelName}') {
            ga4Label = '{*}';
        }
        else {
            const labels = ga4Label.split('_{');
            if (labels.length > 1) {
                ga4Label = labels[0] + '_{*}';
            }
        }

        const results = eventValueKey.split('_');
        const eventValueAndKey = results[0];
        if (results.length > 1) {
            const subResults = results[1].split('/');
            if (subResults.length > 1) {
                subResults.forEach((item: string) => {
                    item = item.replace('{', '');
                    item = item.replace('}', '');
                    eventMap[`${eventID}_${eventValueAndKey}_${item}`] = {
                        action: ga4Action,
                        label: ga4Label,
                    };
                });
                continue;
            }
        }
        eventMap[`${eventID}_${eventValueAndKey}`] = {
            action: ga4Action,
            label: ga4Label,
        };
    }
    console.log(eventMap);
    writeJsonSync(dist, eventMap, { encoding: 'utf8', spaces: 4 });
})();