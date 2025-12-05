'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExtensionInfoMap = exports.getInfoFromTypeID = exports.unregister = exports.register = exports.defaultDownloadTypeInfoMap = void 0;
// 下载管理器，负责管理注册了几种下载和安装方式
const path_1 = require("path");
const uuid_1 = require("uuid");
const downloadTypeInfoMap = {};
const createExtensionInfoMap = {};
exports.defaultDownloadTypeInfoMap = {
    id: -1,
    name: 'Zip Package',
    module: (0, path_1.join)(__dirname, '../contributions/extension.js'),
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
                module: (0, path_1.join)(root, info.module),
                check: info.check,
                download: info.download,
                install: info.install,
            };
        });
    }
    if (info.template) {
        const templateInfos = info.template.map((templateInfo) => {
            //@ts-ignore
            const path = (0, path_1.join)(root, templateInfo.path);
            const description = templateInfo.description || 'unknown';
            const creator = templateInfo.creator && (0, path_1.join)(root, templateInfo.creator);
            return {
                ...templateInfo,
                id: (0, uuid_1.v4)(),
                rawPath: templateInfo.path,
                // override
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBRWIseUJBQXlCO0FBQ3pCLCtCQUE0QjtBQUM1QiwrQkFBa0M7QUFJbEMsTUFBTSxtQkFBbUIsR0FBMkMsRUFBRSxDQUFDO0FBQ3ZFLE1BQU0sc0JBQXNCLEdBQTRELEVBQUUsQ0FBQztBQUM5RSxRQUFBLDBCQUEwQixHQUFxQjtJQUN4RCxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ04sSUFBSSxFQUFFLGFBQWE7SUFDbkIsTUFBTSxFQUFFLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSwrQkFBK0IsQ0FBQztJQUN4RCxRQUFRLEVBQUUsYUFBYTtJQUN2QixPQUFPLEVBQUUsU0FBUztDQUNyQixDQUFDO0FBRUY7Ozs7R0FJRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxJQUFZLEVBQUUsSUFBWSxFQUFFLElBQWtCO0lBQ25FLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNmLG1CQUFtQixDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDbkQsT0FBTztnQkFDSCxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNmLE1BQU0sRUFBRSxJQUFBLFdBQUksRUFBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDL0IsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO2dCQUNqQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3ZCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTzthQUN4QixDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7S0FDTjtJQUVELElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNmLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsWUFBWSxFQUF5QixFQUFFO1lBQzVFLFlBQVk7WUFDWixNQUFNLElBQUksR0FBRyxJQUFBLFdBQUksRUFBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxXQUFXLElBQUksU0FBUyxDQUFDO1lBQzFELE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLElBQUksSUFBQSxXQUFJLEVBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6RSxPQUFPO2dCQUNILEdBQUcsWUFBWTtnQkFDZixFQUFFLEVBQUUsSUFBQSxTQUFJLEdBQUU7Z0JBQ1YsT0FBTyxFQUFFLFlBQVksQ0FBQyxJQUFJO2dCQUMxQixXQUFXO2dCQUNYLElBQUk7Z0JBQ0osV0FBVztnQkFDWCxPQUFPO2FBQ1YsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUMxQixzQkFBc0IsQ0FBQyxJQUFJLE1BQTNCLHNCQUFzQixDQUFDLElBQUksSUFBTSxFQUFFLEVBQUM7WUFDcEMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLGFBQWEsQ0FBQztTQUMxRDtLQUNKO0FBRUwsQ0FBQztBQXBDRCw0QkFvQ0M7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixVQUFVLENBQUMsSUFBWTtJQUNuQyxPQUFPLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BDLE9BQU8sbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFckMsQ0FBQztBQUpELGdDQUlDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsTUFBYztJQUM1QyxNQUFNLE9BQU8sR0FBdUI7UUFDaEMsa0NBQTBCO0tBQzdCLENBQUM7SUFDRixLQUFLLE1BQU0sSUFBSSxJQUFJLG1CQUFtQixFQUFFO1FBQ3BDLE1BQU0saUJBQWlCLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQ3BCLFNBQVM7U0FDWjtRQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDL0MsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5Qyw4QkFBOEI7WUFDOUIsSUFBSSxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksTUFBTSxFQUFFO2dCQUMvQixPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQzthQUMxQztTQUNKO0tBQ0o7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDO0FBbEJELDhDQWtCQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsbUJBQW1CO0lBQy9CLE9BQU8sc0JBQXNCLENBQUM7QUFDbEMsQ0FBQztBQUZELGtEQUVDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG4vLyDkuIvovb3nrqHnkIblmajvvIzotJ/otKPnrqHnkIbms6jlhozkuoblh6Dnp43kuIvovb3lkozlronoo4XmlrnlvI9cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IHY0IGFzIHV1aWQgfSBmcm9tICd1dWlkJztcblxuaW1wb3J0IHsgQ29udHJpYnV0aW9uLCBEb3dubG9hZFR5cGVJbmZvLCBJbnRlcm5hbEV4dGVuc2lvbkluZm8gfSBmcm9tICcuLi9wdWJsaWMvaW50ZXJmYWNlJztcblxuY29uc3QgZG93bmxvYWRUeXBlSW5mb01hcDogeyBbbmFtZTogc3RyaW5nXTogRG93bmxvYWRUeXBlSW5mb1tdIH0gPSB7fTtcbmNvbnN0IGNyZWF0ZUV4dGVuc2lvbkluZm9NYXA6IFJlY29yZDxzdHJpbmcsIHsgdGVtcGxhdGVzPzogSW50ZXJuYWxFeHRlbnNpb25JbmZvW10gfT4gPSB7fTtcbmV4cG9ydCBjb25zdCBkZWZhdWx0RG93bmxvYWRUeXBlSW5mb01hcDogRG93bmxvYWRUeXBlSW5mbyA9IHtcbiAgICBpZDogLTEsXG4gICAgbmFtZTogJ1ppcCBQYWNrYWdlJyxcbiAgICBtb2R1bGU6IGpvaW4oX19kaXJuYW1lLCAnLi4vY29udHJpYnV0aW9ucy9leHRlbnNpb24uanMnKSxcbiAgICBkb3dubG9hZDogJ2Rvd25sb2FkWmlwJyxcbiAgICBpbnN0YWxsOiAnY29weVppcCcsXG59O1xuXG4vKipcbiAqIOazqOWGjOS4i+i9veOAgeWuieijheaWueazlVxuICogQHBhcmFtIG5hbWUgXG4gKiBAcGFyYW0gaW5mbyBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyKG5hbWU6IHN0cmluZywgcm9vdDogc3RyaW5nLCBpbmZvOiBDb250cmlidXRpb24pIHtcbiAgICBpZiAoaW5mby5kb3dubG9hZCkge1xuICAgICAgICBkb3dubG9hZFR5cGVJbmZvTWFwW25hbWVdID0gaW5mby5kb3dubG9hZC5tYXAoKGluZm8pID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaWQ6IGluZm8uaWQsXG4gICAgICAgICAgICAgICAgbmFtZTogaW5mby5uYW1lLFxuICAgICAgICAgICAgICAgIG1vZHVsZTogam9pbihyb290LCBpbmZvLm1vZHVsZSksXG4gICAgICAgICAgICAgICAgY2hlY2s6IGluZm8uY2hlY2ssXG4gICAgICAgICAgICAgICAgZG93bmxvYWQ6IGluZm8uZG93bmxvYWQsXG4gICAgICAgICAgICAgICAgaW5zdGFsbDogaW5mby5pbnN0YWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGluZm8udGVtcGxhdGUpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVJbmZvcyA9IGluZm8udGVtcGxhdGUubWFwKCh0ZW1wbGF0ZUluZm8pOiBJbnRlcm5hbEV4dGVuc2lvbkluZm8gPT4ge1xuICAgICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gam9pbihyb290LCB0ZW1wbGF0ZUluZm8ucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRlbXBsYXRlSW5mby5kZXNjcmlwdGlvbiB8fCAndW5rbm93bic7XG4gICAgICAgICAgICBjb25zdCBjcmVhdG9yID0gdGVtcGxhdGVJbmZvLmNyZWF0b3IgJiYgam9pbihyb290LCB0ZW1wbGF0ZUluZm8uY3JlYXRvcik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLnRlbXBsYXRlSW5mbyxcbiAgICAgICAgICAgICAgICBpZDogdXVpZCgpLFxuICAgICAgICAgICAgICAgIHJhd1BhdGg6IHRlbXBsYXRlSW5mby5wYXRoLFxuICAgICAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICBjcmVhdG9yLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0ZW1wbGF0ZUluZm9zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNyZWF0ZUV4dGVuc2lvbkluZm9NYXBbbmFtZV0gPz89IHt9O1xuICAgICAgICAgICAgY3JlYXRlRXh0ZW5zaW9uSW5mb01hcFtuYW1lXS50ZW1wbGF0ZXMgPSB0ZW1wbGF0ZUluZm9zO1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cbi8qKlxuICog5Y+N5rOo5YaM5LiL6L295ZKM5a6J6KOF5pa55rOVXG4gKiBAcGFyYW0gbmFtZSBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVucmVnaXN0ZXIobmFtZTogc3RyaW5nKSB7XG4gICAgZGVsZXRlIGNyZWF0ZUV4dGVuc2lvbkluZm9NYXBbbmFtZV07XG4gICAgZGVsZXRlIGRvd25sb2FkVHlwZUluZm9NYXBbbmFtZV07XG5cbn1cblxuLyoqXG4gKiDkvKDlhaXkuIDkuKogdHlwZUlE77yM5p+l5om+5LiA5Liq5rOo5YaM55qE5LiL6L2944CB5a6J6KOF5pa55rOVXG4gKiBAcGFyYW0gdHlwZUlEIFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5mb0Zyb21UeXBlSUQodHlwZUlEOiBudW1iZXIpOiBEb3dubG9hZFR5cGVJbmZvW10ge1xuICAgIGNvbnN0IHJlc3VsdHM6IERvd25sb2FkVHlwZUluZm9bXSA9IFtcbiAgICAgICAgZGVmYXVsdERvd25sb2FkVHlwZUluZm9NYXAsXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IG5hbWUgaW4gZG93bmxvYWRUeXBlSW5mb01hcCkge1xuICAgICAgICBjb25zdCBkb3dubG9hZFR5cGVJbmZvcyA9IGRvd25sb2FkVHlwZUluZm9NYXBbbmFtZV07XG4gICAgICAgIGlmICghZG93bmxvYWRUeXBlSW5mb3MpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZG93bmxvYWRUeXBlSW5mb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGRvd25sb2FkVHlwZUluZm8gPSBkb3dubG9hZFR5cGVJbmZvc1tpXTtcbiAgICAgICAgICAgIC8vIHR5cGUg5Y+v6IO95pivIG51bWJlciDkuZ/lj6/og73mmK8gc3RyaW5nXG4gICAgICAgICAgICBpZiAoZG93bmxvYWRUeXBlSW5mby5pZCA9PSB0eXBlSUQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnNwbGljZSgwLCAwLCBkb3dubG9hZFR5cGVJbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiDojrflvpfmiYDmnInms6jlhoznmoTmj5Lku7bmqKHmnb9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEV4dGVuc2lvbkluZm9NYXAoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUV4dGVuc2lvbkluZm9NYXA7XG59XG4iXX0=