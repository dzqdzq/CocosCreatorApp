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
                ...templateInfo,
                id: uuid_1.v4(),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBRWIseUJBQXlCO0FBQ3pCLCtCQUE0QjtBQUM1QiwrQkFBa0M7QUFJbEMsTUFBTSxtQkFBbUIsR0FBMkMsRUFBRSxDQUFDO0FBQ3ZFLE1BQU0sc0JBQXNCLEdBQTRELEVBQUUsQ0FBQztBQUM5RSxRQUFBLDBCQUEwQixHQUFxQjtJQUN4RCxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ04sSUFBSSxFQUFFLGFBQWE7SUFDbkIsTUFBTSxFQUFFLFdBQUksQ0FBQyxTQUFTLEVBQUUsK0JBQStCLENBQUM7SUFDeEQsUUFBUSxFQUFFLGFBQWE7SUFDdkIsT0FBTyxFQUFFLFNBQVM7Q0FDckIsQ0FBQztBQUVGOzs7O0dBSUc7QUFDSCxTQUFnQixRQUFRLENBQUMsSUFBWSxFQUFFLElBQVksRUFBRSxJQUFrQjtJQUNuRSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDZixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ25ELE9BQU87Z0JBQ0gsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUNYLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixNQUFNLEVBQUUsV0FBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtnQkFDdkIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO2FBQ3hCLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztLQUNOO0lBRUQsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2YsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxZQUFZLEVBQXlCLEVBQUU7WUFDNUUsWUFBWTtZQUNaLE1BQU0sSUFBSSxHQUFHLFdBQUksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxXQUFXLElBQUksU0FBUyxDQUFDO1lBQzFELE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLElBQUksV0FBSSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekUsT0FBTztnQkFDSCxHQUFHLFlBQVk7Z0JBQ2YsRUFBRSxFQUFFLFNBQUksRUFBRTtnQkFDVixPQUFPLEVBQUUsWUFBWSxDQUFDLElBQUk7Z0JBQzFCLFdBQVc7Z0JBQ1gsSUFBSTtnQkFDSixXQUFXO2dCQUNYLE9BQU87YUFDVixDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLHNCQUFzQixDQUFDLElBQUksTUFBM0Isc0JBQXNCLENBQUMsSUFBSSxJQUFNLEVBQUUsRUFBQztZQUNwQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUcsYUFBYSxDQUFDO1NBQzFEO0tBQ0o7QUFFTCxDQUFDO0FBcENELDRCQW9DQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxJQUFZO0lBQ25DLE9BQU8sc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsT0FBTyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUVyQyxDQUFDO0FBSkQsZ0NBSUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxNQUFjO0lBQzVDLE1BQU0sT0FBTyxHQUF1QjtRQUNoQyxrQ0FBMEI7S0FDN0IsQ0FBQztJQUNGLEtBQUssTUFBTSxJQUFJLElBQUksbUJBQW1CLEVBQUU7UUFDcEMsTUFBTSxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDcEIsU0FBUztTQUNaO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMvQyxNQUFNLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLDhCQUE4QjtZQUM5QixJQUFJLGdCQUFnQixDQUFDLEVBQUUsSUFBSSxNQUFNLEVBQUU7Z0JBQy9CLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2FBQzFDO1NBQ0o7S0FDSjtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUM7QUFsQkQsOENBa0JDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixtQkFBbUI7SUFDL0IsT0FBTyxzQkFBc0IsQ0FBQztBQUNsQyxDQUFDO0FBRkQsa0RBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbi8vIOS4i+i9veeuoeeQhuWZqO+8jOi0n+i0o+euoeeQhuazqOWGjOS6huWHoOenjeS4i+i9veWSjOWuieijheaWueW8j1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdjQgYXMgdXVpZCB9IGZyb20gJ3V1aWQnO1xuXG5pbXBvcnQgeyBDb250cmlidXRpb24sIERvd25sb2FkVHlwZUluZm8sIEludGVybmFsRXh0ZW5zaW9uSW5mbyB9IGZyb20gJy4uL3B1YmxpYy9pbnRlcmZhY2UnO1xuXG5jb25zdCBkb3dubG9hZFR5cGVJbmZvTWFwOiB7IFtuYW1lOiBzdHJpbmddOiBEb3dubG9hZFR5cGVJbmZvW10gfSA9IHt9O1xuY29uc3QgY3JlYXRlRXh0ZW5zaW9uSW5mb01hcDogUmVjb3JkPHN0cmluZywgeyB0ZW1wbGF0ZXM/OiBJbnRlcm5hbEV4dGVuc2lvbkluZm9bXSB9PiA9IHt9O1xuZXhwb3J0IGNvbnN0IGRlZmF1bHREb3dubG9hZFR5cGVJbmZvTWFwOiBEb3dubG9hZFR5cGVJbmZvID0ge1xuICAgIGlkOiAtMSxcbiAgICBuYW1lOiAnWmlwIFBhY2thZ2UnLFxuICAgIG1vZHVsZTogam9pbihfX2Rpcm5hbWUsICcuLi9jb250cmlidXRpb25zL2V4dGVuc2lvbi5qcycpLFxuICAgIGRvd25sb2FkOiAnZG93bmxvYWRaaXAnLFxuICAgIGluc3RhbGw6ICdjb3B5WmlwJyxcbn07XG5cbi8qKlxuICog5rOo5YaM5LiL6L2944CB5a6J6KOF5pa55rOVXG4gKiBAcGFyYW0gbmFtZSBcbiAqIEBwYXJhbSBpbmZvIFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXIobmFtZTogc3RyaW5nLCByb290OiBzdHJpbmcsIGluZm86IENvbnRyaWJ1dGlvbikge1xuICAgIGlmIChpbmZvLmRvd25sb2FkKSB7XG4gICAgICAgIGRvd25sb2FkVHlwZUluZm9NYXBbbmFtZV0gPSBpbmZvLmRvd25sb2FkLm1hcCgoaW5mbykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogaW5mby5pZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBpbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgbW9kdWxlOiBqb2luKHJvb3QsIGluZm8ubW9kdWxlKSxcbiAgICAgICAgICAgICAgICBjaGVjazogaW5mby5jaGVjayxcbiAgICAgICAgICAgICAgICBkb3dubG9hZDogaW5mby5kb3dubG9hZCxcbiAgICAgICAgICAgICAgICBpbnN0YWxsOiBpbmZvLmluc3RhbGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoaW5mby50ZW1wbGF0ZSkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZUluZm9zID0gaW5mby50ZW1wbGF0ZS5tYXAoKHRlbXBsYXRlSW5mbyk6IEludGVybmFsRXh0ZW5zaW9uSW5mbyA9PiB7XG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBqb2luKHJvb3QsIHRlbXBsYXRlSW5mby5wYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGVtcGxhdGVJbmZvLmRlc2NyaXB0aW9uIHx8ICd1bmtub3duJztcbiAgICAgICAgICAgIGNvbnN0IGNyZWF0b3IgPSB0ZW1wbGF0ZUluZm8uY3JlYXRvciAmJiBqb2luKHJvb3QsIHRlbXBsYXRlSW5mby5jcmVhdG9yKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLi4udGVtcGxhdGVJbmZvLFxuICAgICAgICAgICAgICAgIGlkOiB1dWlkKCksXG4gICAgICAgICAgICAgICAgcmF3UGF0aDogdGVtcGxhdGVJbmZvLnBhdGgsXG4gICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgIGNyZWF0b3IsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRlbXBsYXRlSW5mb3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY3JlYXRlRXh0ZW5zaW9uSW5mb01hcFtuYW1lXSA/Pz0ge307XG4gICAgICAgICAgICBjcmVhdGVFeHRlbnNpb25JbmZvTWFwW25hbWVdLnRlbXBsYXRlcyA9IHRlbXBsYXRlSW5mb3M7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxuLyoqXG4gKiDlj43ms6jlhozkuIvovb3lkozlronoo4Xmlrnms5VcbiAqIEBwYXJhbSBuYW1lIFxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5yZWdpc3RlcihuYW1lOiBzdHJpbmcpIHtcbiAgICBkZWxldGUgY3JlYXRlRXh0ZW5zaW9uSW5mb01hcFtuYW1lXTtcbiAgICBkZWxldGUgZG93bmxvYWRUeXBlSW5mb01hcFtuYW1lXTtcblxufVxuXG4vKipcbiAqIOS8oOWFpeS4gOS4qiB0eXBlSUTvvIzmn6Xmib7kuIDkuKrms6jlhoznmoTkuIvovb3jgIHlronoo4Xmlrnms5VcbiAqIEBwYXJhbSB0eXBlSUQgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmZvRnJvbVR5cGVJRCh0eXBlSUQ6IG51bWJlcik6IERvd25sb2FkVHlwZUluZm9bXSB7XG4gICAgY29uc3QgcmVzdWx0czogRG93bmxvYWRUeXBlSW5mb1tdID0gW1xuICAgICAgICBkZWZhdWx0RG93bmxvYWRUeXBlSW5mb01hcCxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgbmFtZSBpbiBkb3dubG9hZFR5cGVJbmZvTWFwKSB7XG4gICAgICAgIGNvbnN0IGRvd25sb2FkVHlwZUluZm9zID0gZG93bmxvYWRUeXBlSW5mb01hcFtuYW1lXTtcbiAgICAgICAgaWYgKCFkb3dubG9hZFR5cGVJbmZvcykge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkb3dubG9hZFR5cGVJbmZvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZG93bmxvYWRUeXBlSW5mbyA9IGRvd25sb2FkVHlwZUluZm9zW2ldO1xuICAgICAgICAgICAgLy8gdHlwZSDlj6/og73mmK8gbnVtYmVyIOS5n+WPr+iDveaYryBzdHJpbmdcbiAgICAgICAgICAgIGlmIChkb3dubG9hZFR5cGVJbmZvLmlkID09IHR5cGVJRCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMuc3BsaWNlKDAsIDAsIGRvd25sb2FkVHlwZUluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xufVxuXG4vKipcbiAqIOiOt+W+l+aJgOacieazqOWGjOeahOaPkuS7tuaooeadv1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uSW5mb01hcCgpIHtcbiAgICByZXR1cm4gY3JlYXRlRXh0ZW5zaW9uSW5mb01hcDtcbn1cbiJdfQ==