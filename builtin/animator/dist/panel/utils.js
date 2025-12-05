"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiplyTrackWithTimer = exports.calcEmbeddedPlayerKey = exports.T = exports.propDataToCurveDump = exports.changeParentToPart = exports.pickTargetCurveDump = exports.checkCtrlOrCommand = exports.removeEventListener = exports.addEventListenerOnce = exports.isMenuItem = exports.sortPropertyMenu = exports.checkPropertyInMenu = exports.calcParamPath = exports.sortKeysToTreeMap = exports.sortSelectParams = exports.transFrameByType = exports.transFrameByTypeInGrid = exports.frameToTime = exports.timeToFrame = exports.formatClipDump = exports.transformCurveKeyToDump = exports.transformCtrlKeyToDump = exports.mockDumpToCtrl = exports.transCurveKeyToDumpKey = exports.transDumpKeyToCurveKey = exports.transKeyFrames = exports.calcKeyFrameKey = exports.formatNodeDump = exports.EmbeddedPlayerMenuMap = exports.smoothScale = void 0;
function smoothScale(delta, scale) {
    scale = Math.pow(2, delta * 0.002) * scale;
    return scale;
}
exports.smoothScale = smoothScale;
function initNode(obj) {
    obj.uuid2path = {};
    obj.path2uuid = {};
    obj.nodes = [];
}
exports.EmbeddedPlayerMenuMap = {
    'animation-clip': {
        label: 'i18n:animator.embeddedPlayer.AnimationPlayer',
        trackLabel: 'i18n:animator.embeddedPlayer.AnimationTrack',
        value: {
            type: 'animation-clip',
        },
        icon: 'animation',
        pathPlaceholder: 'i18n:animator.embeddedPlayer.nodePathTip',
    },
    'particle-system': {
        label: 'i18n:animator.embeddedPlayer.ParticlePlayer',
        trackLabel: 'i18n:animator.embeddedPlayer.ParticleTrack',
        value: {
            type: 'particle-system',
        },
        icon: 'particle',
        pathPlaceholder: 'i18n:animator.embeddedPlayer.particlePathTip',
    },
};
/**
 * 整理 dump 数据
 * @param {*} dump
 * @param {*} path
 * @param {*} indent
 * @param {*} obj
 */
function formatNodeDump(dump, path = '', indent = 0, obj = {}) {
    if (!path) {
        initNode(obj);
        obj.uuid2path[dump.uuid] = '/';
        obj.path2uuid['/'] = [dump.uuid];
        obj.nodes.push({
            path: '/',
            uuid: dump.uuid,
            name: dump.name,
            indent,
        });
    }
    else {
        obj.uuid2path[dump.uuid] = path;
        const nodeDump = {
            path,
            uuid: dump.uuid,
            name: dump.name,
            indent,
            disabled: false,
        };
        // 同名节点只取第一个节点的 uuid 数据
        if (!obj.path2uuid[path]) {
            obj.path2uuid[path] = [dump.uuid];
        }
        else {
            obj.path2uuid[path].push(dump.uuid);
            nodeDump.disabled = true;
        }
        obj.nodes.push(nodeDump);
    }
    const result = {
        name: dump.name,
        children: [],
        uuid: dump.uuid,
        indent,
        path,
    };
    for (const item of dump.children) {
        const childDump = formatNodeDump(item, `${path}/${item.name}`, indent + 2, obj);
        result.children.push(childDump);
    }
    if (!path) {
        result.uuid2path = obj.uuid2path;
        result.path2uuid = obj.path2uuid;
        result.nodes = obj.nodes;
        result.path = '/';
        result.rawPath = dump.path;
    }
    return result;
}
exports.formatNodeDump = formatNodeDump;
const animCompRE = /Animation/;
function calcKeyFrameKey(keyInfo) {
    let key = keyInfo.frame + keyInfo.prop + keyInfo.x;
    // @ts-ignore
    if (keyInfo.nodePath) {
        // @ts-ignore
        key += keyInfo.nodePath;
    }
    if (keyInfo.value) {
        key += keyInfo.value;
    }
    return key;
}
exports.calcKeyFrameKey = calcKeyFrameKey;
function transKeyFrames(keyFrames, key, isCurveSupport) {
    return keyFrames.map((item) => {
        const keyData = {
            frame: item.frame,
            prop: key,
            // nodePath,
            dump: {
                type: item.dump.type,
                value: item.dump.value,
            },
            // 偏移量，初始化为 0
            x: 0,
            curve: isCurveSupport ? transDumpKeyToCurveKey(item) : null,
        };
        return {
            ...keyData,
            key: calcKeyFrameKey(keyData),
        };
    });
}
exports.transKeyFrames = transKeyFrames;
/**
 * 场景关键帧数据格式界面转换为使用的带 curve 的关键帧数据
 * @param dump
 * @returns
 */
function transDumpKeyToCurveKey(dump) {
    if (!dump.dump || typeof dump.dump.value !== 'number') {
        return null;
    }
    return {
        inTangent: dump.inTangent,
        outTangent: dump.outTangent,
        inTangentWeight: dump.inTangentWeight,
        outTangentWeight: dump.outTangentWeight,
        interpMode: dump.interpMode,
        tangentWeightMode: dump.tangentWeightMode,
        easingMethod: dump.easingMethod,
        point: {
            x: dump.frame,
            y: Number(dump.dump.value),
        },
    };
}
exports.transDumpKeyToCurveKey = transDumpKeyToCurveKey;
/**
 * 将界面使用的带 curve 的关键帧数据转换为场景需要的数据格式
 * @param curve 关键帧数据
 * @param type 属性轨道的 type 类型数据
 * @returns
 */
function transCurveKeyToDumpKey(curve, type) {
    return {
        inTangent: curve.inTangent,
        outTangent: curve.outTangent,
        interpMode: curve.interpMode,
        tangentWeightMode: curve.tangentWeightMode,
        inTangentWeight: curve.inTangentWeight,
        outTangentWeight: curve.outTangentWeight,
        frame: Math.round(curve.point.x),
        easingMethod: curve.easingMethod,
        broken: curve.broken,
        dump: {
            value: curve.point.y,
            type,
        },
    };
}
exports.transCurveKeyToDumpKey = transCurveKeyToDumpKey;
/**
 * 将场景关键帧数据格式模拟为 ui-curve 组件需要的 ctrl 关键帧数据格式
 * @param dump
 * @returns
 */
function mockDumpToCtrl(dump) {
    return {
        // @ts-ignore
        key: transDumpKeyToCurveKey(dump),
    };
}
exports.mockDumpToCtrl = mockDumpToCtrl;
function transformCtrlKeyToDump(keyInfos, type) {
    return keyInfos.map((info) => {
        return transCurveKeyToDumpKey(info.key, type);
    });
}
exports.transformCtrlKeyToDump = transformCtrlKeyToDump;
function transformCurveKeyToDump(keyInfos, type) {
    return keyInfos.map((info) => {
        return transCurveKeyToDumpKey(info, type);
    });
}
exports.transformCurveKeyToDump = transformCurveKeyToDump;
function formatClipDump(dump) {
    // make a copy
    const outDump = { ...dump };
    const pathsDump = {};
    outDump.curves.forEach((curve) => {
        if (!pathsDump[curve.nodePath]) {
            pathsDump[curve.nodePath] = {};
        }
        const data = JSON.parse(JSON.stringify(curve));
        // 精简数据
        data.keyFrames = transKeyFrames(data.keyframes, data.key, data.isCurveSupport);
        // 兼容写法，接口如果改正后可以删除 opts 的获取 TODO
        data.propOpts = data.opts;
        data.prop = data.key;
        data.curve = data.isCurveSupport;
        delete data.opts;
        delete data.keyframes;
        delete data.key;
        pathsDump[curve.nodePath][curve.key] = data;
    });
    outDump.pathsDump = pathsDump;
    if (!outDump.embeddedPlayers) {
        outDump.embeddedPlayers = [];
    }
    if (!outDump.embeddedPlayerGroups) {
        outDump.embeddedPlayerGroups = [];
    }
    const groupToEmbeddedPlayers = {};
    outDump.embeddedPlayers.forEach((embeddedPlayer) => {
        if (!groupToEmbeddedPlayers[embeddedPlayer.group]) {
            groupToEmbeddedPlayers[embeddedPlayer.group] = [];
        }
        if (!embeddedPlayer.playable) {
            console.error('no playable in animation clip');
            embeddedPlayer.playable = {
                type: 'animation-clip',
            };
        }
        groupToEmbeddedPlayers[embeddedPlayer.group].push(embeddedPlayer);
    });
    outDump.groupToEmbeddedPlayers = groupToEmbeddedPlayers;
    outDump.displayAuxiliaryCurves = Object.values(dump.auxiliaryCurves).map((curveDump) => {
        const transformedKeyframe = transKeyFrames(curveDump.keyframes, curveDump.displayName, true);
        return {
            ...curveDump,
            keyframes: transformedKeyframe,
        };
    });
    return outDump;
}
exports.formatClipDump = formatClipDump;
function timeToFrame(time, sample) {
    return Math.round(time * sample);
}
exports.timeToFrame = timeToFrame;
function frameToTime(frame, sample) {
    return frame / sample;
}
exports.frameToTime = frameToTime;
/**
 * 将关键帧数转换为对应的时间（用于显示文字）
 * @param frame
 * @param showType
 * @param sample
 */
function transFrameByTypeInGrid(frame, showType = 'frame', sample = 60) {
    if (showType === 'frame') {
        return frame + '';
    }
    switch (showType) {
        case 'time_s': {
            const num = getRightNum(frame / sample);
            if (num > 60) {
                const m = Math.floor(num / 60);
                const s = getRightNum(num % 60);
                return `${m}m${s}s`;
            }
            return `${num}s`;
        }
        case 'time': {
            return frame % sample;
        }
        default:
            return frame + '';
    }
}
exports.transFrameByTypeInGrid = transFrameByTypeInGrid;
/**
 * 将关键帧数转换为对应的时间（用于显示文字）
 * @param frame
 * @param showType
 * @param sample
 */
function transFrameByType(frame, showType = 'frame', sample = 60) {
    if (showType === 'frame') {
        return frame + '';
    }
    switch (showType) {
        case 'time': {
            let text = '';
            let decimals = Math.floor(Math.log10(sample)) + 1;
            if (frame < 0) {
                text = '-';
                frame = -frame;
            }
            let temp = (frame % sample).toString();
            decimals -= temp.length;
            if (decimals > 0) {
                temp = new Array(decimals + 1).join('0') + temp;
            }
            return text + Math.floor(frame / sample) + '-' + temp;
        }
        case 'time_s': {
            const num = getRightNum(frame / sample);
            if (num > 60) {
                const m = Math.floor(num / 60);
                const s = getRightNum(num % 60);
                return `${m}m${s}s`;
            }
            return `${num}s`;
        }
        default:
            return frame + '';
    }
}
exports.transFrameByType = transFrameByType;
function getRightNum(num) {
    return Number(num.toFixed(2));
}
/**
 * 整理选中关键帧数据为以路径为索引的数据
 * @param params
 * @param properties 传递 properties 时，将会整合分量主轨道和分量轨道之间的关键帧数据
 */
function sortSelectParams(params, properties) {
    const result = {};
    for (const param of params) {
        if (!param) {
            continue;
        }
        // 剔除主轨道
        const propData = properties && properties[param.prop];
        if (propData) {
            if (propData.partKeys) {
                propData.partKeys.forEach((prop) => {
                    addInfoToProp(result, {
                        ...param,
                        prop,
                    });
                });
            }
            if (propData.parentPropKey) {
                addInfoToProp(result, {
                    ...param,
                    prop: propData.parentPropKey,
                });
            }
        }
        addInfoToProp(result, param);
    }
    return result;
}
exports.sortSelectParams = sortSelectParams;
/**
 * 整理选中关键帧数据为以路径为索引的数据
 * @param keys
 */
function sortKeysToTreeMap(keys) {
    const result = {};
    for (const keyInfo of keys) {
        if (!keyInfo) {
            continue;
        }
        // 剔除主轨道
        const path = keyInfo.nodePath + keyInfo.prop;
        if (!result[path]) {
            result[path] = {
                prop: keyInfo.prop,
                nodePath: keyInfo.nodePath,
                frames: [keyInfo.rawFrame],
                keyFrames: [keyInfo],
                offsetFrame: keyInfo.offsetFrame,
            };
            continue;
        }
        result[path].frames.push(keyInfo.rawFrame);
        result[path].keyFrames.push(keyInfo);
    }
    return result;
}
exports.sortKeysToTreeMap = sortKeysToTreeMap;
function addInfoToProp(target, param) {
    const path = param.nodePath + param.prop;
    if (!target[path]) {
        target[path] = {
            prop: param.prop,
            nodePath: param.nodePath,
            frames: [param.rawFrame],
            keyFrames: [param],
            offsetFrame: param.offsetFrame,
        };
        return;
    }
    if (target[path].frames.includes(param.rawFrame)) {
        return;
    }
    target[path].frames.push(param.rawFrame);
    target[path].keyFrames.push(param);
}
function calcParamPath(param) {
    let path;
    if (param[1]) {
        path = `path_${param[0]}${param[1]}`;
    }
    else {
        path = `path_${param[0]}`;
    }
    return path;
}
exports.calcParamPath = calcParamPath;
/**
 * 检查指定的属性轨道是否存在在当前支持的属性菜单内
 * @param target
 * @param menuArr
 * @returns
 */
function checkPropertyInMenu(target, menuArr) {
    if (!target) {
        return false;
    }
    const index = menuArr.findIndex((menuItem) => {
        // TODO 需要用 key 来判断
        return target.prop === menuItem.key;
    });
    return index !== -1;
}
exports.checkPropertyInMenu = checkPropertyInMenu;
/**
 * 根据已添加属性轨道信息，对属性菜单做分类、禁用标记
 * @param {*} menu 属性菜单
 * @param {*} properties 已添加的属性
 */
function sortPropertyMenu(menu, properties) {
    const result = Object.create(null);
    properties = properties || [];
    const customKeys = Object.keys(properties);
    menu = JSON.parse(JSON.stringify(menu));
    menu.forEach((item) => {
        // 互斥属性禁用
        if ((item.key === 'eulerAngles' || item.key === 'rotation') &&
            (customKeys.includes('eulerAngles') || customKeys.includes('rotation'))) {
            item.disable = true;
            // 重复属性禁用
        }
        else if (customKeys.includes(item.key)) {
            item.disable = true;
        }
        else {
            item.disable = false;
        }
        if (!item.category) {
            result[item.name] = item;
            return;
        }
        const menuName = item.menuName ? item.menuName : item.displayName;
        setMenuItem(result, item.category + `/${menuName}`, item);
    });
    return result;
}
exports.sortPropertyMenu = sortPropertyMenu;
/**
 * 判断是否是叶子节点的菜单数据。
 */
function isMenuItem(input) {
    // 避免子菜单菜单中存在子菜单名为 `key` 的情况，判断 key 需要为字符串
    return input.key && typeof input.key === 'string';
}
exports.isMenuItem = isMenuItem;
function setMenuItem(obj, path, value) {
    const paths = path.split('/');
    let srcObj = obj;
    paths.forEach((key, index) => {
        if (index === paths.length - 1) {
            // 如果本身是一个菜单数据对象，要将自身对象存储在 _self 属性内
            if (isMenuItem(srcObj)) {
                const temp = JSON.parse(JSON.stringify(srcObj));
                srcObj._self = temp;
                Object.keys(srcObj).forEach((key) => {
                    if (key === '_self') {
                        return;
                    }
                    delete srcObj[key];
                });
            }
            srcObj[key] = value;
            return;
        }
        if (srcObj[key] !== null && srcObj[key] !== undefined) {
            srcObj = srcObj[key];
            return;
        }
        srcObj[key] = Object.create(null);
        srcObj = srcObj[key];
    });
}
function addEventListenerOnce($dom, eventName, handle) {
    if (!$dom || handle.hasBind || !eventName) {
        return;
    }
    $dom.addEventListener(eventName, handle);
    handle.hasBind = true;
}
exports.addEventListenerOnce = addEventListenerOnce;
function removeEventListener($dom, eventName, handle) {
    if (!$dom || !eventName) {
        return;
    }
    $dom.removeEventListener(eventName, handle);
    handle.hasBind = false;
}
exports.removeEventListener = removeEventListener;
/**
 * 根据 event 判断当前平台下是否按下了 ctrl 或者 command
 * TODO 处理方法可优化
 * @param event
 */
function checkCtrlOrCommand(event) {
    if (!event) {
        return false;
    }
    if (process.platform === 'win32') {
        return event.ctrlKey;
    }
    return event.metaKey;
}
exports.checkCtrlOrCommand = checkCtrlOrCommand;
function pickTargetCurveDump(targetInfo, curvesDump, pathsDump) {
    if (!curvesDump || !pathsDump[targetInfo.nodePath][targetInfo.prop]) {
        return [];
    }
    const propData = pathsDump[targetInfo.nodePath][targetInfo.prop];
    const type = propData.type;
    let resCurveDump = [];
    if (propData.partKeys) {
        // 当粘贴轨道是带有分量轨道的父轨道时，需要找出其分量轨道数据信息作为实际粘贴的目标属性轨道
        // 并且筛选出复制数据的父轨道数据类型与粘贴轨道一致的复制数据
        const partPropDatas = propData.partKeys.map((key) => pathsDump[targetInfo.nodePath][key]);
        curvesDump.forEach((dump) => {
            // @ts-ignore 复制数据父轨道类型不一致不作处理
            if (!dump._parentType || dump._parentType.value !== type.value) {
                return;
            }
            // HACK 筛选出目标轨道数据中 displayName 与复制轨道数据一样的作为实际粘贴数据，目前只有这个值可以作为判断，因为 key 带上了主轨道的名称
            const targetProp = partPropDatas.find((item) => item.displayName === dump.displayName);
            if (!targetProp || !dump.keyframes.length) {
                return;
            }
            resCurveDump.push(dump);
        });
    }
    else {
        // 单独轨道的复制粘贴，筛选找到第一个和目标轨道数据类型以及属性名称完全一样或者最后一个数据类型一样的复制数据粘贴即可
        for (const dump of curvesDump) {
            if (type && dump.type && dump.type.value !== type.value || !dump.keyframes.length) {
                continue;
            }
            resCurveDump = [dump];
            if (dump.key === propData.prop) {
                break;
            }
        }
    }
    return resCurveDump;
}
exports.pickTargetCurveDump = pickTargetCurveDump;
/**
 * 将关键帧数据里的主轨道的数据都转为分量轨道数据(将会丢失必要的 dump 数据，因为本方法仅在发送操作方法到场景时使用)
 */
function changeParentToPart(keyFrames, pathsDump) {
    if (!keyFrames.length) {
        return {};
    }
    if (keyFrames.length === 1) {
        return sortKeysToTreeMap(keyFrames);
    }
    const allKeys = {};
    keyFrames.forEach((item) => {
        const propData = pathsDump[item.nodePath][item.prop];
        if (propData && propData.partKeys) {
            propData.partKeys.forEach((key) => {
                const propData = pathsDump[item.nodePath][key];
                if (propData.keyFrames.find((keyframe) => keyframe.frame === item.rawFrame)) {
                    const cacheData = allKeys[propData.prop + item.frame];
                    const offsetFrame = item.offsetFrame || cacheData && cacheData.offsetFrame || item.frame - item.rawFrame;
                    allKeys[item.key] = {
                        ...item,
                        offsetFrame,
                    };
                }
            });
        }
        else {
            const cacheData = allKeys[propData.prop + item.frame];
            const offsetFrame = item.offsetFrame || cacheData && cacheData.offsetFrame || item.frame - item.rawFrame;
            allKeys[item.key] = {
                ...item,
                offsetFrame,
            };
        }
    });
    return sortKeysToTreeMap(Object.values(allKeys));
}
exports.changeParentToPart = changeParentToPart;
/**
 * 将属性轨道数据转为场景需要的曲线数据
 * @param propData
 * @returns
 */
function propDataToCurveDump(propData) {
    const keyframes = propData.keyFrames.map((item) => {
        return item.curve && transCurveKeyToDumpKey(item.curve, propData.type) || item;
    });
    return {
        nodePath: propData.nodePath,
        keyframes,
        displayName: propData.displayName,
        key: propData.prop,
        type: propData.type,
        postExtrap: propData.postExtrap,
        preExtrap: propData.preExtrap,
        isCurveSupport: propData.isCurveSupport,
    };
}
exports.propDataToCurveDump = propDataToCurveDump;
function T(key, type = '') {
    return Editor.I18n.t(`animator.${type}${key}`);
}
exports.T = T;
function calcEmbeddedPlayerKey(embeddedPlayerDump) {
    return `begin:${embeddedPlayerDump.begin},end:${embeddedPlayerDump.end},player:${embeddedPlayerDump.playable?.type},group:${embeddedPlayerDump.group},displayName:${embeddedPlayerDump.displayName}`;
}
exports.calcEmbeddedPlayerKey = calcEmbeddedPlayerKey;
function multiplyTrackWithTimer(category, object) {
    for (const key in object) {
        Editor.Metrics._trackEventWithTimer({
            category,
            id: key,
            // @ts-ignore
            value: object[key],
        });
    }
}
exports.multiplyTrackWithTimer = multiplyTrackWithTimer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvcGFuZWwvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBdUJBLFNBQWdCLFdBQVcsQ0FBQyxLQUFhLEVBQUUsS0FBYTtJQUNwRCxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUMzQyxPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBSEQsa0NBR0M7QUFVRCxTQUFTLFFBQVEsQ0FBQyxHQUFRO0lBQ3RCLEdBQUcsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ25CLEdBQUcsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ25CLEdBQUcsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ25CLENBQUM7QUFFWSxRQUFBLHFCQUFxQixHQUE0QztJQUMxRSxnQkFBZ0IsRUFBRTtRQUNkLEtBQUssRUFBRSw4Q0FBOEM7UUFDckQsVUFBVSxFQUFFLDZDQUE2QztRQUN6RCxLQUFLLEVBQUU7WUFDSCxJQUFJLEVBQUUsZ0JBQWdCO1NBQ3pCO1FBQ0QsSUFBSSxFQUFFLFdBQVc7UUFDakIsZUFBZSxFQUFFLDBDQUEwQztLQUM5RDtJQUNELGlCQUFpQixFQUFFO1FBQ2YsS0FBSyxFQUFFLDZDQUE2QztRQUNwRCxVQUFVLEVBQUUsNENBQTRDO1FBQ3hELEtBQUssRUFBRTtZQUNILElBQUksRUFBRSxpQkFBaUI7U0FDMUI7UUFDRCxJQUFJLEVBQUUsVUFBVTtRQUNoQixlQUFlLEVBQUUsOENBQThDO0tBQ2xFO0NBQ0osQ0FBQztBQUVGOzs7Ozs7R0FNRztBQUNILFNBQWdCLGNBQWMsQ0FBQyxJQUFTLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQVcsRUFBRTtJQUUxRSxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1AsUUFBUSxDQUFD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LGtCQUFvQztJQUN0RSxPQUFPLFNBQVMsa0JBQWtCLENBQUMsS0FBSyxRQUFRLGtCQUFrQixDQUFDLEdBQUcsV0FBVyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxVQUFVLGtCQUFrQixDQUFDLEtBQUssZ0JBQWdCLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3pNLENBQUM7QUFGRCxzREFFQztBQUVELFNBQWdCLHNCQUFzQixDQUFDLFFBQWdCLEVBQUUsTUFBcUM7SUFDMUYsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUM7UUFDckIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztZQUNoQyxRQUFRO1lBQ1IsRUFBRSxFQUFFLEdBQUc7WUFDUCxhQUFhO1lBQ2IsS0FBSyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUM7U0FDckIsQ0FBQyxDQUFDO0tBQ047QUFDTCxDQUFDO0FBVEQsd0RBU0MiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IElLZXlEdW1wRGF0YSwgSVByb3BDdXJ2ZUR1bXBEYXRhLCBJRW1iZWRkZWRQbGF5ZXJzIH0gZnJvbSAnLi4vLi4vLi4vc2NlbmUvQHR5cGVzL3B1YmxpYyc7XG5pbXBvcnQge1xuICAgIElTZWxlY3RQYXJhbSxcbiAgICBJS2V5RnJhbWUsXG4gICAgSU5vZGVzRHVtcCxcbiAgICBJU29ydER1bXBzLFxuICAgIElTaG93VHlwZSxcbiAgICBJUmF3S2V5RnJhbWUsXG4gICAgSUN0cmxLZXlmcmFtZSxcbiAgICBJQ3VydmVLZXlmcmFtZUNhbnZhcyxcbiAgICBJQ3VydmVLZXlmcmFtZSxcbiAgICBJS2V5RnJhbWVEYXRhLFxuICAgIElQcm9wRGF0YSxcbiAgICBJU2VsZWN0S2V5LFxuICAgIHByb3BlcnR5TWVudUl0ZW0sXG4gICAgSUNsaXBEdW1wcyxcbiAgICBJRW1iZWRkZWRQbGF5ZXJJbmZvLFxuICAgIElFbWJlZGRlZFBsYXllck1lbnVJdGVtLFxuICAgIElFbWJlZGRlZFBsYXllckdyb3VwLFxuICAgIEVkaXRvckFuaW1hdGlvbkNsaXBEdW1wLFxufSBmcm9tICcuLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBzbW9vdGhTY2FsZShkZWx0YTogbnVtYmVyLCBzY2FsZTogbnVtYmVyKSB7XG4gICAgc2NhbGUgPSBNYXRoLnBvdygyLCBkZWx0YSAqIDAuMDAyKSAqIHNjYWxlO1xuICAgIHJldHVybiBzY2FsZTtcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gRXZlbnRCdXR0b24ge1xuICAgIExFRlQgPSAwLFxuICAgIENFTlRFUixcbiAgICBSSUdIVCxcbiAgICBQQUdFX0RPV04sXG4gICAgUEFHRV9VUCxcbn1cblxuZnVuY3Rpb24gaW5pdE5vZGUob2JqOiBhbnkpIHtcbiAgICBvYmoudXVpZDJwYXRoID0ge307XG4gICAgb2JqLnBhdGgydXVpZCA9IHt9O1xuICAgIG9iai5ub2RlcyA9IFtdO1xufVxuXG5leHBvcnQgY29uc3QgRW1iZWRkZWRQbGF5ZXJNZW51TWFwOiBSZWNvcmQ8c3RyaW5nLCBJRW1iZWRkZWRQbGF5ZXJNZW51SXRlbT4gPSB7XG4gICAgJ2FuaW1hdGlvbi1jbGlwJzoge1xuICAgICAgICBsYWJlbDogJ2kxOG46YW5pbWF0b3IuZW1iZWRkZWRQbGF5ZXIuQW5pbWF0aW9uUGxheWVyJyxcbiAgICAgICAgdHJhY2tMYWJlbDogJ2kxOG46YW5pbWF0b3IuZW1iZWRkZWRQbGF5ZXIuQW5pbWF0aW9uVHJhY2snLFxuICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgdHlwZTogJ2FuaW1hdGlvbi1jbGlwJyxcbiAgICAgICAgfSxcbiAgICAgICAgaWNvbjogJ2FuaW1hdGlvbicsXG4gICAgICAgIHBhdGhQbGFjZWhvbGRlcjogJ2kxOG46YW5pbWF0b3IuZW1iZWRkZWRQbGF5ZXIubm9kZVBhdGhUaXAnLFxuICAgIH0sXG4gICAgJ3BhcnRpY2xlLXN5c3RlbSc6IHtcbiAgICAgICAgbGFiZWw6ICdpMThuOmFuaW1hdG9yLmVtYmVkZGVkUGxheWVyLlBhcnRpY2xlUGxheWVyJyxcbiAgICAgICAgdHJhY2tMYWJlbDogJ2kxOG46YW5pbWF0b3IuZW1iZWRkZWRQbGF5ZXIuUGFydGljbGVUcmFjaycsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICB0eXBlOiAncGFydGljbGUtc3lzdGVtJyxcbiAgICAgICAgfSxcbiAgICAgICAgaWNvbjogJ3BhcnRpY2xlJyxcbiAgICAgICAgcGF0aFBsYWNlaG9sZGVyOiAnaTE4bjphbmltYXRvci5lbWJlZGRlZFBsYXllci5wYXJ0aWNsZVBhdGhUaXAnLFxuICAgIH0sXG59O1xuXG4vKipcbiAqIOaVtOeQhiBkdW1wIOaVsOaNrlxuICogQHBhcmFtIHsqfSBkdW1wXG4gKiBAcGFyYW0geyp9IHBhdGhcbiAqIEBwYXJhbSB7Kn0gaW5kZW50XG4gKiBAcGFyYW0geyp9IG9ialxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Tm9kZUR1bXAoZHVtcDogYW55LCBwYXRoID0gJycsIGluZGVudCA9IDAsIG9iajogYW55ID0ge30pOiBJTm9kZXNEdW1wIHtcblxuICAgIGlmICghcGF0aCkge1xuICAgICAgICBpbml0Tm9kZShvYmopO1xuICAgICAgICBvYmoudXVpZDJwYXRoW2R1bXAudXVpZF0gPSAnLyc7XG4gICAgICAgIG9iai5wYXRoMnV1aWRbJy8nXSA9IFtkdW1wLnV1aWRdO1xuICAgICAgICBvYmoubm9kZXMucHVzaCh7XG4gICAgICAgICAgICBwYXRoOiAnLycsXG4gICAgICAgICAgICB1dWlkOiBkdW1wLnV1aWQsXG4gICAgICAgICAgICBuYW1lOiBkdW1wLm5hbWUsXG4gICAgICAgICAgICBpbmRlbnQsXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG9iai51dWlkMnBhdGhbZHVtcC51dWlkXSA9IHBhdGg7XG4gICAgICAgIGNvbnN0IG5vZGVEdW1wID0ge1xuICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgIHV1aWQ6IGR1bXAudXVpZCxcbiAgICAgICAgICAgIG5hbWU6IGR1bXAubmFtZSxcbiAgICAgICAgICAgIGluZGVudCxcbiAgICAgICAgICAgIGRpc2FibGVkOiBmYWxzZSxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyDlkIzlkI3oioLngrnlj6rlj5bnrKzkuIDkuKroioLngrnnmoQgdXVpZCDmlbDmja5cbiAgICAgICAgaWYgKCFvYmoucGF0aDJ1dWlkW3BhdGhdKSB7XG4gICAgICAgICAgICBvYmoucGF0aDJ1dWlkW3BhdGhdID0gW2R1bXAudXVpZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvYmoucGF0aDJ1dWlkW3BhdGhdLnB1c2goZHVtcC51dWlkKTtcbiAgICAgICAgICAgIG5vZGVEdW1wLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBvYmoubm9kZXMucHVzaChub2RlRHVtcCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7XG4gICAgICAgIG5hbWU6IGR1bXAubmFtZSxcbiAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICB1dWlkOiBkdW1wLnV1aWQsXG4gICAgICAgIGluZGVudCxcbiAgICAgICAgcGF0aCxcbiAgICB9O1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBkdW1wLmNoaWxkcmVuKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkRHVtcCA9IGZvcm1hdE5vZGVEdW1wKGl0ZW0sIGAke3BhdGh9LyR7aXRlbS5uYW1lfWAsIGluZGVudCArIDIsIG9iaik7XG4gICAgICAgIHJlc3VsdC5jaGlsZHJlbi5wdXNoKGNoaWxkRHVtcCk7XG4gICAgfVxuICAgIGlmICghcGF0aCkge1xuICAgICAgICByZXN1bHQudXVpZDJwYXRoID0gb2JqLnV1aWQycGF0aDtcbiAgICAgICAgcmVzdWx0LnBhdGgydXVpZCA9IG9iai5wYXRoMnV1aWQ7XG4gICAgICAgIHJlc3VsdC5ub2RlcyA9IG9iai5ub2RlcztcbiAgICAgICAgcmVzdWx0LnBhdGggPSAnLyc7XG4gICAgICAgIHJlc3VsdC5yYXdQYXRoID0gZHVtcC5wYXRoO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5jb25zdCBhbmltQ29tcFJFID0gL0FuaW1hdGlvbi87XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjS2V5RnJhbWVLZXkoa2V5SW5mbzogSUtleUZyYW1lKSB7XG4gICAgbGV0IGtleSA9IGtleUluZm8uZnJhbWUgKyBrZXlJbmZvLnByb3AgKyBrZXlJbmZvLng7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGlmIChrZXlJbmZvLm5vZGVQYXRoKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAga2V5ICs9IGtleUluZm8ubm9kZVBhdGg7XG4gICAgfVxuICAgIGlmIChrZXlJbmZvLnZhbHVlKSB7XG4gICAgICAgIGtleSArPSBrZXlJbmZvLnZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4ga2V5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNLZXlGcmFtZXMoa2V5RnJhbWVzOiBhbnksIGtleTogc3RyaW5nLCBpc0N1cnZlU3VwcG9ydDogYm9vbGVhbik6IElSYXdLZXlGcmFtZVtdIHtcbiAgICByZXR1cm4ga2V5RnJhbWVzLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIGNvbnN0IGtleURhdGEgPSB7XG4gICAgICAgICAgICBmcmFtZTogaXRlbS5mcmFtZSxcbiAgICAgICAgICAgIHByb3A6IGtleSxcbiAgICAgICAgICAgIC8vIG5vZGVQYXRoLFxuICAgICAgICAgICAgZHVtcDoge1xuICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW0uZHVtcC50eXBlLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpdGVtLmR1bXAudmFsdWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8g5YGP56e76YeP77yM5Yid5aeL5YyW5Li6IDBcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICBjdXJ2ZTogaXNDdXJ2ZVN1cHBvcnQgPyB0cmFuc0R1bXBLZXlUb0N1cnZlS2V5KGl0ZW0pIDogbnVsbCxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLmtleURhdGEsXG4gICAgICAgICAgICBrZXk6IGNhbGNLZXlGcmFtZUtleShrZXlEYXRhKSxcbiAgICAgICAgfTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiDlnLrmma/lhbPplK7luKfmlbDmja7moLzlvI/nlYzpnaLovazmjaLkuLrkvb/nlKjnmoTluKYgY3VydmUg55qE5YWz6ZSu5bin5pWw5o2uXG4gKiBAcGFyYW0gZHVtcCBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNEdW1wS2V5VG9DdXJ2ZUtleShkdW1wOiBJS2V5RHVtcERhdGEpIHtcbiAgICBpZiAoIWR1bXAuZHVtcCB8fCB0eXBlb2YgZHVtcC5kdW1wLnZhbHVlICE9PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5UYW5nZW50OiBkdW1wLmluVGFuZ2VudCxcbiAgICAgICAgb3V0VGFuZ2VudDogZHVtcC5vdXRUYW5nZW50LFxuXG4gICAgICAgIGluVGFuZ2VudFdlaWdodDogZHVtcC5pblRhbmdlbnRXZWlnaHQsXG4gICAgICAgIG91dFRhbmdlbnRXZWlnaHQ6IGR1bXAub3V0VGFuZ2VudFdlaWdodCxcblxuICAgICAgICBpbnRlcnBNb2RlOiBkdW1wLmludGVycE1vZGUsXG4gICAgICAgIHRhbmdlbnRXZWlnaHRNb2RlOiBkdW1wLnRhbmdlbnRXZWlnaHRNb2RlLFxuICAgICAgICBlYXNpbmdNZXRob2Q6IGR1bXAuZWFzaW5nTWV0aG9kLFxuXG4gICAgICAgIHBvaW50OiB7XG4gICAgICAgICAgICB4OiBkdW1wLmZyYW1lLFxuICAgICAgICAgICAgeTogTnVtYmVyKGR1bXAuZHVtcC52YWx1ZSksXG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuLyoqXG4gKiDlsIbnlYzpnaLkvb/nlKjnmoTluKYgY3VydmUg55qE5YWz6ZSu5bin5pWw5o2u6L2s5o2i5Li65Zy65pmv6ZyA6KaB55qE5pWw5o2u5qC85byPXG4gKiBAcGFyYW0gY3VydmUg5YWz6ZSu5bin5pWw5o2uXG4gKiBAcGFyYW0gdHlwZSDlsZ7mgKfovajpgZPnmoQgdHlwZSDnsbvlnovmlbDmja5cbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNDdXJ2ZUtleVRvRHVtcEtleShjdXJ2ZTogSUN1cnZlS2V5ZnJhbWUsIHR5cGU6IGFueSk6IElLZXlEdW1wRGF0YSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5UYW5nZW50OiBjdXJ2ZS5pblRhbmdlbnQsXG4gICAgICAgIG91dFRhbmdlbnQ6IGN1cnZlLm91dFRhbmdlbnQsXG5cbiAgICAgICAgaW50ZXJwTW9kZTogY3VydmUuaW50ZXJwTW9kZSxcbiAgICAgICAgdGFuZ2VudFdlaWdodE1vZGU6IGN1cnZlLnRhbmdlbnRXZWlnaHRNb2RlLFxuXG4gICAgICAgIGluVGFuZ2VudFdlaWdodDogY3VydmUuaW5UYW5nZW50V2VpZ2h0LFxuICAgICAgICBvdXRUYW5nZW50V2VpZ2h0OiBjdXJ2ZS5vdXRUYW5nZW50V2VpZ2h0LFxuICAgICAgICBmcmFtZTogTWF0aC5yb3VuZChjdXJ2ZS5wb2ludC54KSxcbiAgICAgICAgZWFzaW5nTWV0aG9kOiBjdXJ2ZS5lYXNpbmdNZXRob2QsXG4gICAgICAgIGJyb2tlbjogY3VydmUuYnJva2VuLFxuICAgICAgICBkdW1wOiB7XG4gICAgICAgICAgICB2YWx1ZTogY3VydmUucG9pbnQueSxcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuLyoqXG4gKiDlsIblnLrmma/lhbPplK7luKfmlbDmja7moLzlvI/mqKHmi5/kuLogdWktY3VydmUg57uE5Lu26ZyA6KaB55qEIGN0cmwg5YWz6ZSu5bin5pWw5o2u5qC85byPXG4gKiBAcGFyYW0gZHVtcCBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgZnVuY3Rpb24gbW9ja0R1bXBUb0N0cmwoZHVtcDogSUtleUR1bXBEYXRhKTogSUN0cmxLZXlmcmFtZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBrZXk6IHRyYW5zRHVtcEtleVRvQ3VydmVLZXkoZHVtcCkhLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zOiBJQ3RybEtleWZyYW1lW10sIHR5cGU6IGFueSk6IElLZXlEdW1wRGF0YVtdIHtcbiAgICByZXR1cm4ga2V5SW5mb3MubWFwKChpbmZvKSA9PiB7XG4gICAgICAgIHJldHVybiB0cmFuc0N1cnZlS2V5VG9EdW1wS2V5KGluZm8ua2V5LCB0eXBlKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUN1cnZlS2V5VG9EdW1wKGtleUluZm9zOiBJQ3VydmVLZXlmcmFtZVtdLCB0eXBlOiBhbnkpIHtcbiAgICByZXR1cm4ga2V5SW5mb3MubWFwKChpbmZvKSA9PiB7XG4gICAgICAgIHJldHVybiB0cmFuc0N1cnZlS2V5VG9EdW1wS2V5KGluZm8sIHR5cGUpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q2xpcER1bXAoZHVtcDogRWRpdG9yQW5pbWF0aW9uQ2xpcER1bXApOiBJQ2xpcER1bXBzIHtcbiAgICAvLyBtYWtlIGEgY29weVxuICAgIGNvbnN0IG91dER1bXAgPSB7IC4uLmR1bXAgfSBhcyBJQ2xpcER1bXBzO1xuICAgIGNvbnN0IHBhdGhzRHVtcDogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgSVByb3BEYXRhPj4gPSB7fTtcbiAgICBvdXREdW1wLmN1cnZlcy5mb3JFYWNoKChjdXJ2ZTogYW55KSA9PiB7XG4gICAgICAgIGlmICghcGF0aHNEdW1wW2N1cnZlLm5vZGVQYXRoXSkge1xuICAgICAgICAgICAgcGF0aHNEdW1wW2N1cnZlLm5vZGVQYXRoXSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRhdGE6IGFueSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY3VydmUpKTtcbiAgICAgICAgLy8g57K+566A5pWw5o2uXG4gICAgICAgIGRhdGEua2V5RnJhbWVzID0gdHJhbnNLZXlGcmFtZXMoZGF0YS5rZXlmcmFtZXMsIGRhdGEua2V5LCBkYXRhLmlzQ3VydmVTdXBwb3J0KTtcbiAgICAgICAgLy8g5YW85a655YaZ5rOV77yM5o6l5Y+j5aaC5p6c5pS55q2j5ZCO5Y+v5Lul5Yig6ZmkIG9wdHMg55qE6I635Y+WIFRPRE9cbiAgICAgICAgZGF0YS5wcm9wT3B0cyA9IGRhdGEub3B0cztcbiAgICAgICAgZGF0YS5wcm9wID0gZGF0YS5rZXk7XG4gICAgICAgIGRhdGEuY3VydmUgPSBkYXRhLmlzQ3VydmVTdXBwb3J0O1xuICAgICAgICBkZWxldGUgZGF0YS5vcHRzO1xuICAgICAgICBkZWxldGUgZGF0YS5rZXlmcmFtZXM7XG4gICAgICAgIGRlbGV0ZSBkYXRhLmtleTtcbiAgICAgICAgcGF0aHNEdW1wW2N1cnZlLm5vZGVQYXRoXVtjdXJ2ZS5rZXldID0gZGF0YTtcbiAgICB9KTtcbiAgICBvdXREdW1wLnBhdGhzRHVtcCA9IHBhdGhzRHVtcDtcbiAgICBpZiAoIW91dER1bXAuZW1iZWRkZWRQbGF5ZXJzKSB7XG4gICAgICAgIG91dER1bXAuZW1iZWRkZWRQbGF5ZXJzID0gW107XG4gICAgfVxuICAgIGlmICghb3V0RHVtcC5lbWJlZGRlZFBsYXllckdyb3Vwcykge1xuICAgICAgICBvdXREdW1wLmVtYmVkZGVkUGxheWVyR3JvdXBzID0gW107XG4gICAgfVxuICAgIGNvbnN0IGdyb3VwVG9FbWJlZGRlZFBsYXllcnM6IFJlY29yZDxzdHJpbmcsIElFbWJlZGRlZFBsYXllcnNbXT4gPSB7fTtcbiAgICBvdXREdW1wLmVtYmVkZGVkUGxheWVycy5mb3JFYWNoKChlbWJlZGRlZFBsYXllcikgPT4ge1xuICAgICAgICBpZiAoIWdyb3VwVG9FbWJlZGRlZFBsYXllcnNbZW1iZWRkZWRQbGF5ZXIuZ3JvdXBdKSB7XG4gICAgICAgICAgICBncm91cFRvRW1iZWRkZWRQbGF5ZXJzW2VtYmVkZGVkUGxheWVyLmdyb3VwXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZW1iZWRkZWRQbGF5ZXIucGxheWFibGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ25vIHBsYXlhYmxlIGluIGFuaW1hdGlvbiBjbGlwJyk7XG4gICAgICAgICAgICBlbWJlZGRlZFBsYXllci5wbGF5YWJsZSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYW5pbWF0aW9uLWNsaXAnLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBncm91cFRvRW1iZWRkZWRQbGF5ZXJzW2VtYmVkZGVkUGxheWVyLmdyb3VwXS5wdXNoKGVtYmVkZGVkUGxheWVyKTtcbiAgICB9KTtcbiAgICBvdXREdW1wLmdyb3VwVG9FbWJlZGRlZFBsYXllcnMgPSBncm91cFRvRW1iZWRkZWRQbGF5ZXJzO1xuXG4gICAgb3V0RHVtcC5kaXNwbGF5QXV4aWxpYXJ5Q3VydmVzID0gT2JqZWN0LnZhbHVlcyhkdW1wLmF1eGlsaWFyeUN1cnZlcykubWFwKChjdXJ2ZUR1bXApID0+IHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtZWRLZXlmcmFtZSA9IHRyYW5zS2V5RnJhbWVzKGN1cnZlRHVtcC5rZXlmcmFtZXMsIGN1cnZlRHVtcC5kaXNwbGF5TmFtZSwgdHJ1ZSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5jdXJ2ZUR1bXAsXG4gICAgICAgICAgICBrZXlmcmFtZXM6IHRyYW5zZm9ybWVkS2V5ZnJhbWUsXG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gb3V0RHVtcDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVUb0ZyYW1lKHRpbWU6IG51bWJlciwgc2FtcGxlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCh0aW1lICogc2FtcGxlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyYW1lVG9UaW1lKGZyYW1lOiBudW1iZXIsIHNhbXBsZTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIGZyYW1lIC8gc2FtcGxlO1xufVxuXG4vKipcbiAqIOWwhuWFs+mUruW4p+aVsOi9rOaNouS4uuWvueW6lOeahOaXtumXtO+8iOeUqOS6juaYvuekuuaWh+Wtl++8iVxuICogQHBhcmFtIGZyYW1lIFxuICogQHBhcmFtIHNob3dUeXBlIFxuICogQHBhcmFtIHNhbXBsZSBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zRnJhbWVCeVR5cGVJbkdyaWQoZnJhbWU6IG51bWJlciwgc2hvd1R5cGU6IElTaG93VHlwZSA9ICdmcmFtZScsIHNhbXBsZSA9IDYwKSB7XG4gICAgaWYgKHNob3dUeXBlID09PSAnZnJhbWUnKSB7XG4gICAgICAgIHJldHVybiBmcmFtZSArICcnO1xuICAgIH1cblxuICAgIHN3aXRjaCAoc2hvd1R5cGUpIHtcbiAgICAgICAgY2FzZSAndGltZV9zJzoge1xuICAgICAgICAgICAgY29uc3QgbnVtID0gZ2V0UmlnaHROdW0oZnJhbWUgLyBzYW1wbGUpO1xuICAgICAgICAgICAgaWYgKG51bSA+IDYwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbSA9IE1hdGguZmxvb3IobnVtIC8gNjApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBnZXRSaWdodE51bShudW0gJSA2MCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke219bSR7c31zYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBgJHtudW19c2A7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAndGltZSc6IHtcbiAgICAgICAgICAgIHJldHVybiBmcmFtZSAlIHNhbXBsZTtcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIGZyYW1lICsgJyc7XG4gICAgfVxufVxuXG4vKipcbiAqIOWwhuWFs+mUruW4p+aVsOi9rOaNouS4uuWvueW6lOeahOaXtumXtO+8iOeUqOS6juaYvuekuuaWh+Wtl++8iVxuICogQHBhcmFtIGZyYW1lIFxuICogQHBhcmFtIHNob3dUeXBlIFxuICogQHBhcmFtIHNhbXBsZSBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zRnJhbWVCeVR5cGUoZnJhbWU6IG51bWJlciwgc2hvd1R5cGU6IElTaG93VHlwZSA9ICdmcmFtZScsIHNhbXBsZSA9IDYwKTogc3RyaW5nIHtcbiAgICBpZiAoc2hvd1R5cGUgPT09ICdmcmFtZScpIHtcbiAgICAgICAgcmV0dXJuIGZyYW1lICsgJyc7XG4gICAgfVxuXG4gICAgc3dpdGNoIChzaG93VHlwZSkge1xuICAgICAgICBjYXNlICd0aW1lJzoge1xuICAgICAgICAgICAgbGV0IHRleHQgPSAnJztcbiAgICAgICAgICAgIGxldCBkZWNpbWFscyA9IE1hdGguZmxvb3IoTWF0aC5sb2cxMChzYW1wbGUpKSArIDE7XG4gICAgICAgICAgICBpZiAoZnJhbWUgPCAwKSB7XG4gICAgICAgICAgICAgICAgdGV4dCA9ICctJztcbiAgICAgICAgICAgICAgICBmcmFtZSA9IC1mcmFtZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHRlbXAgPSAoZnJhbWUgJSBzYW1wbGUpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBkZWNpbWFscyAtPSB0ZW1wLmxlbmd0aDtcbiAgICAgICAgICAgIGlmIChkZWNpbWFscyA+IDApIHtcbiAgICAgICAgICAgICAgICB0ZW1wID0gbmV3IEFycmF5KGRlY2ltYWxzICsgMSkuam9pbignMCcpICsgdGVtcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXh0ICsgTWF0aC5mbG9vcihmcmFtZSAvIHNhbXBsZSkgKyAnLScgKyB0ZW1wO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ3RpbWVfcyc6IHtcbiAgICAgICAgICAgIGNvbnN0IG51bSA9IGdldFJpZ2h0TnVtKGZyYW1lIC8gc2FtcGxlKTtcbiAgICAgICAgICAgIGlmIChudW0gPiA2MCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG0gPSBNYXRoLmZsb29yKG51bSAvIDYwKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gZ2V0UmlnaHROdW0obnVtICUgNjApO1xuICAgICAgICAgICAgICAgIHJldHVybiBgJHttfW0ke3N9c2A7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYCR7bnVtfXNgO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZnJhbWUgKyAnJztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFJpZ2h0TnVtKG51bTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIE51bWJlcihudW0udG9GaXhlZCgyKSk7XG59XG5cbi8qKlxuICog5pW055CG6YCJ5Lit5YWz6ZSu5bin5pWw5o2u5Li65Lul6Lev5b6E5Li657Si5byV55qE5pWw5o2uXG4gKiBAcGFyYW0gcGFyYW1zXG4gKiBAcGFyYW0gcHJvcGVydGllcyDkvKDpgJIgcHJvcGVydGllcyDml7bvvIzlsIbkvJrmlbTlkIjliIbph4/kuLvovajpgZPlkozliIbph4/ovajpgZPkuYvpl7TnmoTlhbPplK7luKfmlbDmja5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNvcnRTZWxlY3RQYXJhbXMocGFyYW1zOiBJS2V5RnJhbWVEYXRhW10sIHByb3BlcnRpZXM/OiBSZWNvcmQ8c3RyaW5nLCBJUHJvcERhdGE+KTogSVNvcnREdW1wcyB7XG4gICAgY29uc3QgcmVzdWx0OiBJU29ydER1bXBzID0ge307XG4gICAgZm9yIChjb25zdCBwYXJhbSBvZiBwYXJhbXMpIHtcbiAgICAgICAgaWYgKCFwYXJhbSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8g5YmU6Zmk5Li76L2o6YGTXG4gICAgICAgIGNvbnN0IHByb3BEYXRhID0gcHJvcGVydGllcyAmJiBwcm9wZXJ0aWVzW3BhcmFtLnByb3BdO1xuICAgICAgICBpZiAocHJvcERhdGEpIHtcbiAgICAgICAgICAgIGlmIChwcm9wRGF0YS5wYXJ0S2V5cykge1xuICAgICAgICAgICAgICAgIHByb3BEYXRhLnBhcnRLZXlzLmZvckVhY2goKHByb3ApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWRkSW5mb1RvUHJvcChyZXN1bHQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnBhcmFtLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcm9wRGF0YS5wYXJlbnRQcm9wS2V5KSB7XG4gICAgICAgICAgICAgICAgYWRkSW5mb1RvUHJvcChyZXN1bHQsIHtcbiAgICAgICAgICAgICAgICAgICAgLi4ucGFyYW0sXG4gICAgICAgICAgICAgICAgICAgIHByb3A6IHByb3BEYXRhLnBhcmVudFByb3BLZXksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYWRkSW5mb1RvUHJvcChyZXN1bHQsIHBhcmFtKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiDmlbTnkIbpgInkuK3lhbPplK7luKfmlbDmja7kuLrku6Xot6/lvoTkuLrntKLlvJXnmoTmlbDmja5cbiAqIEBwYXJhbSBrZXlzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzb3J0S2V5c1RvVHJlZU1hcChrZXlzOiBJS2V5RnJhbWVEYXRhW10pOiBJU29ydER1bXBzIHtcbiAgICBjb25zdCByZXN1bHQ6IElTb3J0RHVtcHMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleUluZm8gb2Yga2V5cykge1xuICAgICAgICBpZiAoIWtleUluZm8pIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIOWJlOmZpOS4u+i9qOmBk1xuXG4gICAgICAgIGNvbnN0IHBhdGggPSBrZXlJbmZvLm5vZGVQYXRoICsga2V5SW5mby5wcm9wO1xuICAgICAgICBpZiAoIXJlc3VsdFtwYXRoXSkge1xuICAgICAgICAgICAgcmVzdWx0W3BhdGhdID0ge1xuICAgICAgICAgICAgICAgIHByb3A6IGtleUluZm8ucHJvcCxcbiAgICAgICAgICAgICAgICBub2RlUGF0aDoga2V5SW5mby5ub2RlUGF0aCxcbiAgICAgICAgICAgICAgICBmcmFtZXM6IFtrZXlJbmZvLnJhd0ZyYW1lXSxcbiAgICAgICAgICAgICAgICBrZXlGcmFtZXM6IFtrZXlJbmZvXSxcbiAgICAgICAgICAgICAgICBvZmZzZXRGcmFtZToga2V5SW5mby5vZmZzZXRGcmFtZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRbcGF0aF0uZnJhbWVzLnB1c2goa2V5SW5mby5yYXdGcmFtZSk7XG4gICAgICAgIHJlc3VsdFtwYXRoXS5rZXlGcmFtZXMucHVzaChrZXlJbmZvKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gYWRkSW5mb1RvUHJvcCh0YXJnZXQ6IElTb3J0RHVtcHMsIHBhcmFtOiBJS2V5RnJhbWVEYXRhKSB7XG4gICAgY29uc3QgcGF0aCA9IHBhcmFtLm5vZGVQYXRoICsgcGFyYW0ucHJvcDtcbiAgICBpZiAoIXRhcmdldFtwYXRoXSkge1xuICAgICAgICB0YXJnZXRbcGF0aF0gPSB7XG4gICAgICAgICAgICBwcm9wOiBwYXJhbS5wcm9wLFxuICAgICAgICAgICAgbm9kZVBhdGg6IHBhcmFtLm5vZGVQYXRoLFxuICAgICAgICAgICAgZnJhbWVzOiBbcGFyYW0ucmF3RnJhbWVdLFxuICAgICAgICAgICAga2V5RnJhbWVzOiBbcGFyYW1dLFxuICAgICAgICAgICAgb2Zmc2V0RnJhbWU6IHBhcmFtLm9mZnNldEZyYW1lLFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0YXJnZXRbcGF0aF0uZnJhbWVzLmluY2x1ZGVzKHBhcmFtLnJhd0ZyYW1lKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRhcmdldFtwYXRoXS5mcmFtZXMucHVzaChwYXJhbS5yYXdGcmFtZSk7XG4gICAgdGFyZ2V0W3BhdGhdLmtleUZyYW1lcy5wdXNoKHBhcmFtKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGNQYXJhbVBhdGgocGFyYW06IHN0cmluZ1tdKSB7XG4gICAgbGV0IHBhdGg7XG4gICAgaWYgKHBhcmFtWzFdKSB7XG4gICAgICAgIHBhdGggPSBgcGF0aF8ke3BhcmFtWzBdfSR7cGFyYW1bMV19YDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXRoID0gYHBhdGhfJHtwYXJhbVswXX1gO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aDtcbn1cblxuLyoqXG4gKiDmo4Dmn6XmjIflrprnmoTlsZ7mgKfovajpgZPmmK/lkKblrZjlnKjlnKjlvZPliY3mlK/mjIHnmoTlsZ7mgKfoj5zljZXlhoVcbiAqIEBwYXJhbSB0YXJnZXQgXG4gKiBAcGFyYW0gbWVudUFyciBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tQcm9wZXJ0eUluTWVudSh0YXJnZXQ6IElQcm9wRGF0YSwgbWVudUFycjogcHJvcGVydHlNZW51SXRlbVtdKSB7XG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBpbmRleCA9IG1lbnVBcnIuZmluZEluZGV4KChtZW51SXRlbSkgPT4ge1xuICAgICAgICAvLyBUT0RPIOmcgOimgeeUqCBrZXkg5p2l5Yik5patXG4gICAgICAgIHJldHVybiB0YXJnZXQucHJvcCA9PT0gbWVudUl0ZW0ua2V5O1xuICAgIH0pO1xuICAgIHJldHVybiBpbmRleCAhPT0gLTE7XG59XG5cbi8qKlxuICog5qC55o2u5bey5re75Yqg5bGe5oCn6L2o6YGT5L+h5oGv77yM5a+55bGe5oCn6I+c5Y2V5YGa5YiG57G744CB56aB55So5qCH6K6wXG4gKiBAcGFyYW0geyp9IG1lbnUg5bGe5oCn6I+c5Y2VXG4gKiBAcGFyYW0geyp9IHByb3BlcnRpZXMg5bey5re75Yqg55qE5bGe5oCnXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzb3J0UHJvcGVydHlNZW51KG1lbnU6IGFueSwgcHJvcGVydGllczogUmVjb3JkPHN0cmluZywgSVByb3BEYXRhPikge1xuICAgIGNvbnN0IHJlc3VsdDogYW55ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBwcm9wZXJ0aWVzID0gcHJvcGVydGllcyB8fCBbXTtcbiAgICBjb25zdCBjdXN0b21LZXlzID0gT2JqZWN0LmtleXMocHJvcGVydGllcyk7XG4gICAgbWVudSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobWVudSkpO1xuICAgIG1lbnUuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIC8vIOS6kuaWpeWxnuaAp+emgeeUqFxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAoaXRlbS5rZXkgPT09ICdldWxlckFuZ2xlcycgfHwgaXRlbS5rZXkgPT09ICdyb3RhdGlvbicpICYmXG4gICAgICAgICAgICAoY3VzdG9tS2V5cy5pbmNsdWRlcygnZXVsZXJBbmdsZXMnKSB8fCBjdXN0b21LZXlzLmluY2x1ZGVzKCdyb3RhdGlvbicpKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGl0ZW0uZGlzYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAvLyDph43lpI3lsZ7mgKfnpoHnlKhcbiAgICAgICAgfSBlbHNlIGlmIChjdXN0b21LZXlzLmluY2x1ZGVzKGl0ZW0ua2V5KSkge1xuICAgICAgICAgICAgaXRlbS5kaXNhYmxlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGl0ZW0uZGlzYWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXRlbS5jYXRlZ29yeSkge1xuICAgICAgICAgICAgcmVzdWx0W2l0ZW0ubmFtZV0gPSBpdGVtO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1lbnVOYW1lID0gaXRlbS5tZW51TmFtZSA/IGl0ZW0ubWVudU5hbWUgOiBpdGVtLmRpc3BsYXlOYW1lO1xuICAgICAgICBzZXRNZW51SXRlbShyZXN1bHQsIGl0ZW0uY2F0ZWdvcnkgKyBgLyR7bWVudU5hbWV9YCwgaXRlbSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiDliKTmlq3mmK/lkKbmmK/lj7blrZDoioLngrnnmoToj5zljZXmlbDmja7jgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTWVudUl0ZW0oaW5wdXQ6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBib29sZWFuIHtcbiAgICAvLyDpgb/lhY3lrZDoj5zljZXoj5zljZXkuK3lrZjlnKjlrZDoj5zljZXlkI3kuLogYGtleWAg55qE5oOF5Ya177yM5Yik5patIGtleSDpnIDopoHkuLrlrZfnrKbkuLJcbiAgICByZXR1cm4gaW5wdXQua2V5ICYmIHR5cGVvZiBpbnB1dC5rZXkgPT09ICdzdHJpbmcnO1xufVxuXG5mdW5jdGlvbiBzZXRNZW51SXRlbShvYmo6IFJlY29yZDxzdHJpbmcsIGFueT4sIHBhdGg6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGNvbnN0IHBhdGhzID0gcGF0aC5zcGxpdCgnLycpO1xuICAgIGxldCBzcmNPYmogPSBvYmo7XG4gICAgcGF0aHMuZm9yRWFjaCgoa2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgaWYgKGluZGV4ID09PSBwYXRocy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAvLyDlpoLmnpzmnKzouqvmmK/kuIDkuKroj5zljZXmlbDmja7lr7nosaHvvIzopoHlsIboh6rouqvlr7nosaHlrZjlgqjlnKggX3NlbGYg5bGe5oCn5YaFXG4gICAgICAgICAgICBpZiAoaXNNZW51SXRlbShzcmNPYmopKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGVtcCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc3JjT2JqKSk7XG4gICAgICAgICAgICAgICAgc3JjT2JqLl9zZWxmID0gdGVtcDtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhzcmNPYmopLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAnX3NlbGYnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNyY09ialtrZXldO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3JjT2JqW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3JjT2JqW2tleV0gIT09IG51bGwgJiYgc3JjT2JqW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc3JjT2JqID0gc3JjT2JqW2tleV07XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3JjT2JqW2tleV0gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICBzcmNPYmogPSBzcmNPYmpba2V5XTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJPbmNlKCRkb206IGFueSwgZXZlbnROYW1lOiBzdHJpbmcsIGhhbmRsZTogYW55KSB7XG4gICAgaWYgKCEkZG9tIHx8IGhhbmRsZS5oYXNCaW5kIHx8ICFldmVudE5hbWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAkZG9tLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGUpO1xuICAgIGhhbmRsZS5oYXNCaW5kID0gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXIoJGRvbTogYW55LCBldmVudE5hbWU6IHN0cmluZywgaGFuZGxlOiBhbnkpIHtcbiAgICBpZiAoISRkb20gfHwgIWV2ZW50TmFtZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgICRkb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZSk7XG4gICAgaGFuZGxlLmhhc0JpbmQgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiDmoLnmja4gZXZlbnQg5Yik5pat5b2T5YmN5bmz5Y+w5LiL5piv5ZCm5oyJ5LiL5LqGIGN0cmwg5oiW6ICFIGNvbW1hbmRcbiAqIFRPRE8g5aSE55CG5pa55rOV5Y+v5LyY5YyWXG4gKiBAcGFyYW0gZXZlbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQ3RybE9yQ29tbWFuZChldmVudDogTW91c2VFdmVudCkge1xuICAgIGlmICghZXZlbnQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgICByZXR1cm4gZXZlbnQuY3RybEtleTtcbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50Lm1ldGFLZXk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwaWNrVGFyZ2V0Q3VydmVEdW1wKHRhcmdldEluZm86IHtcbiAgICBub2RlUGF0aDogc3RyaW5nO1xuICAgIHByb3A6IHN0cmluZztcbn0sIGN1cnZlc0R1bXA6IElQcm9wQ3VydmVEdW1wRGF0YVtdLCBwYXRoc0R1bXA6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIElQcm9wRGF0YT4+KTogSVByb3BDdXJ2ZUR1bXBEYXRhW10ge1xuICAgIGlmICghY3VydmVzRHVtcCB8fCAhcGF0aHNEdW1wW3RhcmdldEluZm8ubm9kZVBhdGhdW3RhcmdldEluZm8ucHJvcF0pIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBwcm9wRGF0YSA9IHBhdGhzRHVtcFt0YXJnZXRJbmZvLm5vZGVQYXRoXVt0YXJnZXRJbmZvLnByb3BdO1xuICAgIGNvbnN0IHR5cGUgPSBwcm9wRGF0YS50eXBlO1xuICAgIGxldCByZXNDdXJ2ZUR1bXA6IElQcm9wQ3VydmVEdW1wRGF0YVtdID0gW107XG4gICAgaWYgKHByb3BEYXRhLnBhcnRLZXlzKSB7XG4gICAgICAgIC8vIOW9k+eymOi0tOi9qOmBk+aYr+W4puacieWIhumHj+i9qOmBk+eahOeItui9qOmBk+aXtu+8jOmcgOimgeaJvuWHuuWFtuWIhumHj+i9qOmBk+aVsOaNruS/oeaBr+S9nOS4uuWunumZheeymOi0tOeahOebruagh+WxnuaAp+i9qOmBk1xuICAgICAgICAvLyDlubbkuJTnrZvpgInlh7rlpI3liLbmlbDmja7nmoTniLbovajpgZPmlbDmja7nsbvlnovkuI7nspjotLTovajpgZPkuIDoh7TnmoTlpI3liLbmlbDmja5cbiAgICAgICAgY29uc3QgcGFydFByb3BEYXRhcyA9IHByb3BEYXRhLnBhcnRLZXlzLm1hcCgoa2V5KSA9PiBwYXRoc0R1bXBbdGFyZ2V0SW5mby5ub2RlUGF0aF1ba2V5XSk7XG4gICAgICAgIGN1cnZlc0R1bXAuZm9yRWFjaCgoZHVtcCkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSDlpI3liLbmlbDmja7niLbovajpgZPnsbvlnovkuI3kuIDoh7TkuI3kvZzlpITnkIZcbiAgICAgICAgICAgIGlmICghZHVtcC5fcGFyZW50VHlwZSB8fCBkdW1wLl9wYXJlbnRUeXBlLnZhbHVlICE9PSB0eXBlLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSEFDSyDnrZvpgInlh7rnm67moIfovajpgZPmlbDmja7kuK0gZGlzcGxheU5hbWUg5LiO5aSN5Yi26L2o6YGT5pWw5o2u5LiA5qC355qE5L2c5Li65a6e6ZmF57KY6LS05pWw5o2u77yM55uu5YmN5Y+q5pyJ6L+Z5Liq5YC85Y+v5Lul5L2c5Li65Yik5pat77yM5Zug5Li6IGtleSDluKbkuIrkuobkuLvovajpgZPnmoTlkI3np7BcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldFByb3AgPSBwYXJ0UHJvcERhdGFzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uZGlzcGxheU5hbWUgPT09IGR1bXAuZGlzcGxheU5hbWUpO1xuICAgICAgICAgICAgaWYgKCF0YXJnZXRQcm9wIHx8ICFkdW1wLmtleWZyYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNDdXJ2ZUR1bXAucHVzaChkdW1wKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8g5Y2V54us6L2o6YGT55qE5aSN5Yi257KY6LS077yM562b6YCJ5om+5Yiw56ys5LiA5Liq5ZKM55uu5qCH6L2o6YGT5pWw5o2u57G75Z6L5Lul5Y+K5bGe5oCn5ZCN56ew5a6M5YWo5LiA5qC35oiW6ICF5pyA5ZCO5LiA5Liq5pWw5o2u57G75Z6L5LiA5qC355qE5aSN5Yi25pWw5o2u57KY6LS05Y2z5Y+vXG4gICAgICAgIGZvciAoY29uc3QgZHVtcCBvZiBjdXJ2ZXNEdW1wKSB7XG4gICAgICAgICAgICBpZiAodHlwZSAmJiBkdW1wLnR5cGUgJiYgZHVtcC50eXBlLnZhbHVlICE9PSB0eXBlLnZhbHVlIHx8ICFkdW1wLmtleWZyYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc0N1cnZlRHVtcCA9IFtkdW1wXTtcbiAgICAgICAgICAgIGlmIChkdW1wLmtleSA9PT0gcHJvcERhdGEucHJvcCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXNDdXJ2ZUR1bXA7XG59XG5cbi8qKlxuICog5bCG5YWz6ZSu5bin5pWw5o2u6YeM55qE5Li76L2o6YGT55qE5pWw5o2u6YO96L2s5Li65YiG6YeP6L2o6YGT5pWw5o2uKOWwhuS8muS4ouWkseW/heimgeeahCBkdW1wIOaVsOaNru+8jOWboOS4uuacrOaWueazleS7heWcqOWPkemAgeaTjeS9nOaWueazleWIsOWcuuaZr+aXtuS9v+eUqClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZVBhcmVudFRvUGFydChrZXlGcmFtZXM6IElLZXlGcmFtZURhdGFbXSwgcGF0aHNEdW1wOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBJUHJvcERhdGE+Pikge1xuICAgIGlmICgha2V5RnJhbWVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuICAgIGlmIChrZXlGcmFtZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBzb3J0S2V5c1RvVHJlZU1hcChrZXlGcmFtZXMpO1xuICAgIH1cbiAgICBjb25zdCBhbGxLZXlzOiBSZWNvcmQ8c3RyaW5nLCBJS2V5RnJhbWVEYXRhPiA9IHt9O1xuICAgIGtleUZyYW1lcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGNvbnN0IHByb3BEYXRhID0gcGF0aHNEdW1wW2l0ZW0ubm9kZVBhdGghXVtpdGVtLnByb3BdO1xuICAgICAgICBpZiAocHJvcERhdGEgJiYgcHJvcERhdGEucGFydEtleXMpIHtcbiAgICAgICAgICAgIHByb3BEYXRhLnBhcnRLZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BEYXRhID0gcGF0aHNEdW1wW2l0ZW0ubm9kZVBhdGghXVtrZXldO1xuICAgICAgICAgICAgICAgIGlmIChwcm9wRGF0YS5rZXlGcmFtZXMuZmluZCgoa2V5ZnJhbWUpID0+IGtleWZyYW1lLmZyYW1lID09PSBpdGVtLnJhd0ZyYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWNoZURhdGEgPSBhbGxLZXlzW3Byb3BEYXRhLnByb3AgKyBpdGVtLmZyYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0RnJhbWUgPSBpdGVtLm9mZnNldEZyYW1lIHx8IGNhY2hlRGF0YSAmJiBjYWNoZURhdGEub2Zmc2V0RnJhbWUgfHwgaXRlbS5mcmFtZSAtIGl0ZW0ucmF3RnJhbWU7XG4gICAgICAgICAgICAgICAgICAgIGFsbEtleXNbaXRlbS5rZXldID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldEZyYW1lLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgY2FjaGVEYXRhID0gYWxsS2V5c1twcm9wRGF0YS5wcm9wICsgaXRlbS5mcmFtZV07XG4gICAgICAgICAgICBjb25zdCBvZmZzZXRGcmFtZSA9IGl0ZW0ub2Zmc2V0RnJhbWUgfHwgY2FjaGVEYXRhICYmIGNhY2hlRGF0YS5vZmZzZXRGcmFtZSB8fCBpdGVtLmZyYW1lIC0gaXRlbS5yYXdGcmFtZTtcbiAgICAgICAgICAgIGFsbEtleXNbaXRlbS5rZXldID0ge1xuICAgICAgICAgICAgICAgIC4uLml0ZW0sXG4gICAgICAgICAgICAgICAgb2Zmc2V0RnJhbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc29ydEtleXNUb1RyZWVNYXAoT2JqZWN0LnZhbHVlcyhhbGxLZXlzKSk7XG59XG5cbi8qKlxuICog5bCG5bGe5oCn6L2o6YGT5pWw5o2u6L2s5Li65Zy65pmv6ZyA6KaB55qE5puy57q/5pWw5o2uXG4gKiBAcGFyYW0gcHJvcERhdGEgXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3BEYXRhVG9DdXJ2ZUR1bXAocHJvcERhdGE6IElQcm9wRGF0YSkge1xuICAgIGNvbnN0IGtleWZyYW1lcyA9IHByb3BEYXRhLmtleUZyYW1lcy5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0uY3VydmUgJiYgdHJhbnNDdXJ2ZUtleVRvRHVtcEtleShpdGVtLmN1cnZlLCBwcm9wRGF0YS50eXBlKSB8fCBpdGVtO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbm9kZVBhdGg6IHByb3BEYXRhLm5vZGVQYXRoLFxuICAgICAgICBrZXlmcmFtZXMsXG4gICAgICAgIGRpc3BsYXlOYW1lOiBwcm9wRGF0YS5kaXNwbGF5TmFtZSxcbiAgICAgICAga2V5OiBwcm9wRGF0YS5wcm9wLFxuICAgICAgICB0eXBlOiBwcm9wRGF0YS50eXBlLFxuICAgICAgICBwb3N0RXh0cmFwOiBwcm9wRGF0YS5wb3N0RXh0cmFwLFxuICAgICAgICBwcmVFeHRyYXA6IHByb3BEYXRhLnByZUV4dHJhcCxcbiAgICAgICAgaXNDdXJ2ZVN1cHBvcnQ6IHByb3BEYXRhLmlzQ3VydmVTdXBwb3J0LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBUKGtleTogc3RyaW5nLCB0eXBlID0gJycpIHtcbiAgICByZXR1cm4gRWRpdG9yLkkxOG4udChgYW5pbWF0b3IuJHt0eXBlfSR7a2V5fWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY0VtYmVkZGVkUGxheWVyS2V5KGVtYmVkZGVkUGxheWVyRHVtcDogSUVtYmVkZGVkUGxheWVycykge1xuICAgIHJldHVybiBgYmVnaW46JHtlbWJlZGRlZFBsYXllckR1bXAuYmVnaW59LGVuZDoke2VtYmVkZGVkUGxheWVyRHVtcC5lbmR9LHBsYXllcjoke2VtYmVkZGVkUGxheWVyRHVtcC5wbGF5YWJsZT8udHlwZX0sZ3JvdXA6JHtlbWJlZGRlZFBsYXllckR1bXAuZ3JvdXB9LGRpc3BsYXlOYW1lOiR7ZW1iZWRkZWRQbGF5ZXJEdW1wLmRpc3BsYXlOYW1lfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtdWx0aXBseVRyYWNrV2l0aFRpbWVyKGNhdGVnb3J5OiBzdHJpbmcsIG9iamVjdDogUmVjb3JkPHN0cmluZywgc3RyaW5nfG51bWJlcj4pe1xuICAgIGZvciAoY29uc3Qga2V5IGluIG9iamVjdCl7XG4gICAgICAgIEVkaXRvci5NZXRyaWNzLl90cmFja0V2ZW50V2l0aFRpbWVyKHtcbiAgICAgICAgICAgIGNhdGVnb3J5LFxuICAgICAgICAgICAgaWQ6IGtleSxcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHZhbHVlOiBvYmplY3Rba2V5XSxcbiAgICAgICAgfSk7XG4gICAgfVxufSJdfQ==