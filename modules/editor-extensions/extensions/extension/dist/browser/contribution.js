'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExtensionInfoMap = exports.getInfoFromTypeID = exports.unregister = exports.register = exports.defaultDownloadTypeInfoMap = void 0;
// 下载管理器，负责管理注册了几种下载和安装方式
const path_1 = require("path");
const downloadTypeInfoMap = {};
const createExtensionInfoMap = {};
exports.defaultDownloadTypeInfoMap = {
    id: -1,
    name: 'Zip Package',
    module: path_1.join(__dirname, '../contributions/extension.js'),
    download: 'downloadZip',
    install: 'copyZip',
};
/**
 * 注册下载、安装方法
 * @param name
 * @param info
 */
function register(name, root, info) {
    if (info.download) {
        downloadTypeInfoMap[name] = info.download.map((info) => {
            return {
                id: info.id,
                name: info.name,
                module: path_1.join(root, info.module),
                check: info.check,
                download: info.download,
                install: info.install,
            };
        });
    }
    if (info.template) {
        const templateInfos = info.template.map((templateInfo) => {
            //@ts-ignore
            const path = path_1.join(root, templateInfo.path);
            const description = templateInfo.description || 'unknown';
            const creator = templateInfo.creator && path_1.join(root, templateInfo.creator);
            return {
                name: templateInfo.name,
                path,
                description,
                creator,
            };
        });
        if (templateInfos.length > 0) {
            createExtensionInfoMap[name] ?? (createExtensionInfoMap[name] = {});
            createExtensionInfoMap[name].templates = templateInfos;
        }
    }
}
exports.register = register;
/**
 * 反注册下载和安装方法
 * @param name
 */
function unregister(name) {
    delete createExtensionInfoMap[name];
    delete downloadTypeInfoMap[name];
}
exports.unregister = unregister;
/**
 * 传入一个 typeID，查找一个注册的下载、安装方法
 * @param typeID
 */
function getInfoFromTypeID(typeID) {
    const results = [
        exports.defaultDownloadTypeInfoMap,
    ];
    for (const name in downloadTypeInfoMap) {
        const downloadTypeInfos = downloadTypeInfoMap[name];
        if (!downloadTypeInfos) {
            continue;
        }
        for (let i = 0; i < downloadTypeInfos.length; i++) {
            const downloadTypeInfo = downloadTypeInfos[i];
            // type 可能是 number 也可能是 string
            if (downloadTypeInfo.id == typeID) {
                results.splice(0, 0, downloadTypeInfo);
            }
        }
    }
    return results;
}
exports.getInfoFromTypeID = getInfoFromTypeID;
/**
 * 获得所有注册的插件模板
 */
function getExtensionInfoMap() {
    return createExtensionInfoMap;
}
exports.getExtensionInfoMap = getExtensionInfoMap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBRWIseUJBQXlCO0FBQ3pCLCtCQUE0QjtBQUc1QixNQUFNLG1CQUFtQixHQUEyQyxFQUFFLENBQUM7QUFDdkUsTUFBTSxzQkFBc0IsR0FBb0QsRUFBRSxDQUFDO0FBQ3RFLFFBQUEsMEJBQTBCLEdBQXFCO0lBQ3hELEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDTixJQUFJLEVBQUUsYUFBYTtJQUNuQixNQUFNLEVBQUUsV0FBSSxDQUFDLFNBQVMsRUFBRSwrQkFBK0IsQ0FBQztJQUN4RCxRQUFRLEVBQUUsYUFBYTtJQUN2QixPQUFPLEVBQUUsU0FBUztDQUNyQixDQUFDO0FBRUY7Ozs7R0FJRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxJQUFZLEVBQUUsSUFBWSxFQUFFLElBQWtCO0lBQ25FLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNmLG1CQUFtQixDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDbkQsT0FBTztnQkFDSCxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNmLE1BQU0sRUFBRSxXQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQy9CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87YUFDeEIsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO0tBQ047SUFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDZixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFlBQVksRUFBaUIsRUFBRTtZQUNwRSxZQUFZO1lBQ1osTUFBTSxJQUFJLEdBQUcsV0FBSSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLFdBQVcsSUFBSSxTQUFTLENBQUM7WUFDMUQsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sSUFBSSxXQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6RSxPQUFPO2dCQUNILElBQUksRUFBRSxZQUFZLENBQUMsSUFBSTtnQkFDdkIsSUFBSTtnQkFDSixXQUFXO2dCQUNYLE9BQU87YUFDVixDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLHNCQUFzQixDQUFDLElBQUksTUFBM0Isc0JBQXNCLENBQUMsSUFBSSxJQUFNLEVBQUUsRUFBQztZQUNwQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUcsYUFBYSxDQUFDO1NBQzFEO0tBQ0o7QUFFTCxDQUFDO0FBakNELDRCQWlDQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxJQUFZO0lBQ25DLE9BQU8sc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsT0FBTyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUVyQyxDQUFDO0FBSkQsZ0NBSUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxNQUFjO0lBQzVDLE1BQU0sT0FBTyxHQUF1QjtRQUNoQyxrQ0FBMEI7S0FDN0IsQ0FBQztJQUNGLEtBQUssTUFBTSxJQUFJLElBQUksbUJBQW1CLEVBQUU7UUFDcEMsTUFBTSxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDcEIsU0FBUztTQUNaO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMvQyxNQUFNLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLDhCQUE4QjtZQUM5QixJQUFJLGdCQUFnQixDQUFDLEVBQUUsSUFBSSxNQUFNLEVBQUU7Z0JBQy9CLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2FBQzFDO1NBQ0o7S0FDSjtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUM7QUFsQkQsOENBa0JDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixtQkFBbUI7SUFDL0IsT0FBTyxzQkFBc0IsQ0FBQztBQUNsQyxDQUFDO0FBRkQsa0RBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbi8vIOS4i+i9veeuoeeQhuWZqO+8jOi0n+i0o+euoeeQhuazqOWGjOS6huWHoOenjeS4i+i9veWSjOWuieijheaWueW8j1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQ29udHJpYnV0aW9uLCBEb3dubG9hZFR5cGVJbmZvLCBFeHRlbnNpb25JbmZvIH0gZnJvbSAnLi4vcHVibGljL2ludGVyZmFjZSc7XG5cbmNvbnN0IGRvd25sb2FkVHlwZUluZm9NYXA6IHsgW25hbWU6IHN0cmluZ106IERvd25sb2FkVHlwZUluZm9bXSB9ID0ge307XG5jb25zdCBjcmVhdGVFeHRlbnNpb25JbmZvTWFwOiBSZWNvcmQ8c3RyaW5nLCB7IHRlbXBsYXRlcz86IEV4dGVuc2lvbkluZm9bXSB9PiA9IHt9O1xuZXhwb3J0IGNvbnN0IGRlZmF1bHREb3dubG9hZFR5cGVJbmZvTWFwOiBEb3dubG9hZFR5cGVJbmZvID0ge1xuICAgIGlkOiAtMSxcbiAgICBuYW1lOiAnWmlwIFBhY2thZ2UnLFxuICAgIG1vZHVsZTogam9pbihfX2Rpcm5hbWUsICcuLi9jb250cmlidXRpb25zL2V4dGVuc2lvbi5qcycpLFxuICAgIGRvd25sb2FkOiAnZG93bmxvYWRaaXAnLFxuICAgIGluc3RhbGw6ICdjb3B5WmlwJyxcbn07XG5cbi8qKlxuICog5rOo5YaM5LiL6L2944CB5a6J6KOF5pa55rOVXG4gKiBAcGFyYW0gbmFtZSBcbiAqIEBwYXJhbSBpbmZvIFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXIobmFtZTogc3RyaW5nLCByb290OiBzdHJpbmcsIGluZm86IENvbnRyaWJ1dGlvbikge1xuICAgIGlmIChpbmZvLmRvd25sb2FkKSB7XG4gICAgICAgIGRvd25sb2FkVHlwZUluZm9NYXBbbmFtZV0gPSBpbmZvLmRvd25sb2FkLm1hcCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogaW5mby5pZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBpbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgbW9kdWxlOiBqb2luKHJvb3QsIGluZm8ubW9kdWxlKSxcbiAgICAgICAgICAgICAgICBjaGVjazogaW5mby5jaGVjayxcbiAgICAgICAgICAgICAgICBkb3dubG9hZDogaW5mby5kb3dubG9hZCxcbiAgICAgICAgICAgICAgICBpbnN0YWxsOiBpbmZvLmluc3RhbGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoaW5mby50ZW1wbGF0ZSkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZUluZm9zID0gaW5mby50ZW1wbGF0ZS5tYXAoKHRlbXBsYXRlSW5mbyk6IEV4dGVuc2lvbkluZm8gPT4ge1xuICAgICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gam9pbihyb290LCB0ZW1wbGF0ZUluZm8ucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRlbXBsYXRlSW5mby5kZXNjcmlwdGlvbiB8fCAndW5rbm93bic7XG4gICAgICAgICAgICBjb25zdCBjcmVhdG9yID0gdGVtcGxhdGVJbmZvLmNyZWF0b3IgJiYgam9pbihyb290LCB0ZW1wbGF0ZUluZm8uY3JlYXRvcik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IHRlbXBsYXRlSW5mby5uYW1lLFxuICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgY3JlYXRvcixcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGVtcGxhdGVJbmZvcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjcmVhdGVFeHRlbnNpb25JbmZvTWFwW25hbWVdID8/PSB7fTtcbiAgICAgICAgICAgIGNyZWF0ZUV4dGVuc2lvbkluZm9NYXBbbmFtZV0udGVtcGxhdGVzID0gdGVtcGxhdGVJbmZvcztcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG4vKipcbiAqIOWPjeazqOWGjOS4i+i9veWSjOWuieijheaWueazlVxuICogQHBhcmFtIG5hbWUgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bnJlZ2lzdGVyKG5hbWU6IHN0cmluZykge1xuICAgIGRlbGV0ZSBjcmVhdGVFeHRlbnNpb25JbmZvTWFwW25hbWVdO1xuICAgIGRlbGV0ZSBkb3dubG9hZFR5cGVJbmZvTWFwW25hbWVdO1xuXG59XG5cbi8qKlxuICog5Lyg5YWl5LiA5LiqIHR5cGVJRO+8jOafpeaJvuS4gOS4quazqOWGjOeahOS4i+i9veOAgeWuieijheaWueazlVxuICogQHBhcmFtIHR5cGVJRCBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluZm9Gcm9tVHlwZUlEKHR5cGVJRDogbnVtYmVyKTogRG93bmxvYWRUeXBlSW5mb1tdIHtcbiAgICBjb25zdCByZXN1bHRzOiBEb3dubG9hZFR5cGVJbmZvW10gPSBbXG4gICAgICAgIGRlZmF1bHREb3dubG9hZFR5cGVJbmZvTWFwLFxuICAgIF07XG4gICAgZm9yIChjb25zdCBuYW1lIGluIGRvd25sb2FkVHlwZUluZm9NYXApIHtcbiAgICAgICAgY29uc3QgZG93bmxvYWRUeXBlSW5mb3MgPSBkb3dubG9hZFR5cGVJbmZvTWFwW25hbWVdO1xuICAgICAgICBpZiAoIWRvd25sb2FkVHlwZUluZm9zKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRvd25sb2FkVHlwZUluZm9zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBkb3dubG9hZFR5cGVJbmZvID0gZG93bmxvYWRUeXBlSW5mb3NbaV07XG4gICAgICAgICAgICAvLyB0eXBlIOWPr+iDveaYryBudW1iZXIg5Lmf5Y+v6IO95pivIHN0cmluZ1xuICAgICAgICAgICAgaWYgKGRvd25sb2FkVHlwZUluZm8uaWQgPT0gdHlwZUlEKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5zcGxpY2UoMCwgMCwgZG93bmxvYWRUeXBlSW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKlxuICog6I635b6X5omA5pyJ5rOo5YaM55qE5o+S5Lu25qih5p2/XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlbnNpb25JbmZvTWFwKCkge1xuICAgIHJldHVybiBjcmVhdGVFeHRlbnNpb25JbmZvTWFwO1xufVxuIl19