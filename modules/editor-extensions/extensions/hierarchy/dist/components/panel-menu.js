'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.popupContextMenu = exports.popupSearchMenu = exports.popupPanelMenu = exports.popupCreateMenu = void 0;
const panelData = __importStar(require("./panel-data"));
const utils = __importStar(require("./utils"));
function prependCancelSearchMenu(buildInMenu) {
    if (utils.isSearching()) {
        buildInMenu.unshift({
            label: Editor.I18n.t('hierarchy.menu.cancelSearch'),
            click() {
                panelData.$.panel.clearSearch();
            },
        }, {
            type: 'separator',
        });
    }
    return buildInMenu;
}
/**
 * 生成一份创建节点的菜单
 * 用 function 来不断生成数据是为了文案都能有翻译，下同
 * @param callback 增加此层是为了把这里的固定参数传出去，接收方再增加参数
 */
async function createMenu(callback) {
    const data = await Editor.Menu.__protected__.queryMain();
    if (!data || !data['i18n:menu.node']) {
        return [];
    }
    // 过滤出 create 的菜单
    // 这里 submenu 类型就是对象，只是现在 queryMain 定义的 type 是错误的，后续会在底层 queryMain 的 type
    const submenu = data['i18n:menu.node'].submenu;
    if (submenu) {
        for (const key in submenu) {
            const config = submenu[key];
            if (config.group !== 'create') {
                delete submenu[key];
            }
        }
    }
    const menus = suitSubmenu(data['i18n:menu.node'], callback)['submenu'];
    menus.push({
        type: 'extend-menu',
    });
    const result = await mergeMenu(menus, 'createMenu');
    return result;
}
function suitSubmenu(obj, callback) {
    if (obj.submenu) {
        // 数据源是对象结构，但是在弹出menu 的地方 需要数组的结构
        obj.submenu = Object.values(obj.submenu).reduce((result, next) => {
            next.click = () => {
                callback(next.params?.[0]);
            };
            suitSubmenu(next, callback);
            result.push(next);
            return result;
        }, []);
    }
    return obj;
}
/**
 * 弹出创建节点菜单
 */
async function popupCreateMenu() {
    if (!utils.enableContextMenu()) {
        return;
    }
    Editor.Menu.popup({
        menu: await createMenu((addNode) => {
            panelData.$.tree.addTo(addNode);
        }),
    });
}
exports.popupCreateMenu = popupCreateMenu;
/**
 * 生成一份面板空白区域的右击菜单
 */
async function createPanelMenu() {
    const menu = [
        {
            label: Editor.I18n.t('hierarchy.menu.newNode'),
            enabled: utils.enableContextMenu(),
            submenu: await createMenu((addNode) => {
                panelData.$.tree.addTo(addNode);
            }),
        },
        {
            label: Editor.I18n.t('hierarchy.menu.paste'),
            accelerator: 'CmdOrCtrl+V',
            enabled: !utils.isNoneCopyOrCut() && utils.enableContextMenu(),
            click() {
                panelData.$.tree.paste();
            },
        },
        {
            // @ts-ignore
            type: 'extend-menu',
        },
    ];
    const result = await mergeMenu(menu, 'panelMenu');
    return result;
}
/**
 * 弹出面板空白位置上右击菜单
 */
async function popupPanelMenu() {
    const buildInMenu = await createPanelMenu();
    prependCancelSearchMenu(buildInMenu);
    Editor.Menu.popup({
        menu: buildInMenu,
    });
}
exports.popupPanelMenu = popupPanelMenu;
/**
 * 生成一份面板搜索类型的菜单
 */
function createSearchMenu() {
    const { searchType } = panelData.$.panel;
    return [
        {
            label: Editor.I18n.t('hierarchy.menu.searchName'),
            type: 'radio',
            checked: searchType === 'name',
            click() {
                panelData.$.panel.searchType = 'name';
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.searchUuid'),
            type: 'radio',
            checked: searchType === 'uuid',
            click() {
                panelData.$.panel.searchType = 'uuid';
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.searchPath'),
            type: 'radio',
            checked: searchType === 'path',
            click() {
                panelData.$.panel.searchType = 'path';
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.searchComponent'),
            type: 'radio',
            checked: searchType === 'component',
            click() {
                panelData.$.panel.searchType = 'component';
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.searchAsset'),
            type: 'radio',
            checked: searchType === 'asset',
            click() {
                panelData.$.panel.searchType = 'asset';
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.searchMissAsset'),
            type: 'radio',
            checked: searchType === 'missAsset',
            click() {
                panelData.$.panel.searchType = 'missAsset';
            },
        },
    ];
}
/**
 * 弹出面板搜索菜单
 */
async function popupSearchMenu() {
    Editor.Menu.popup({
        menu: createSearchMenu(),
    });
}
exports.popupSearchMenu = popupSearchMenu;
/**
 * 生成一份复制并打印 uuid path 等数据的菜单
 * @param node 当前操作的节点
 */
function createConsoleMenu(node) {
    return [
        { type: 'separator' },
        {
            label: Editor.I18n.t('hierarchy.menu.showUuid'),
            click() {
                Editor.Clipboard.write('text', node.uuid);
                console.log('UUID ', Editor.I18n.t('hierarchy.menu.doneCopied'), ' ', node.uuid);
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.showPath'),
            click() {
                Editor.Clipboard.write('text', node.path);
                console.log('PATH ', Editor.I18n.t('hierarchy.menu.doneCopied'), ' ', node.path);
            },
        },
    ];
}
function createEditPrefab(node) {
    const isPrefab = node.prefab && node.prefab.state && node.prefab.state !== 3;
    if (!isPrefab || node.prefab.assetUuid.includes('@') || node.prefab.assetUuid === panelData.act.assetUuid) {
        return [];
    }
    return [
        {
            label: Editor.I18n.t('hierarchy.menu.edit_prefab'),
            enabled: node.prefab && !!node.prefab.assetUuid,
            click() {
                Editor.Message.request('asset-db', 'open-asset', node.prefab.assetUuid);
            },
        },
        {
            type: 'separator',
        },
    ];
}
function createLocateAsset(node) {
    if (!node.isScene && node.prefab && !node.prefab.state) {
        return [];
    }
    return [
        {
            type: 'separator',
        },
        {
            label: Editor.I18n.t('hierarchy.menu.locateAsset'),
            enabled: utils.isExistedAsset(),
            click() {
                utils.twinkle.asset(node);
            },
        },
    ];
}
/**
 * 针对场景根节点的右击菜单
 * @param node 当前操作的节点
 */
async function createRootMenu(node) {
    const menu = [
        {
            label: Editor.I18n.t('hierarchy.menu.newNode'),
            enabled: !utils.canNotCreateNode(node) && utils.enableContextMenu(),
            submenu: await createMenu((addNode) => {
                addNode.parent = node.uuid;
                panelData.$.tree.addTo(addNode);
            }),
        },
        {
            label: Editor.I18n.t('hierarchy.menu.paste'),
            accelerator: 'CmdOrCtrl+V',
            enabled: !utils.canNotPasteNode(node) && utils.enableContextMenu(),
            click() {
                panelData.$.tree.paste(node.uuid);
            },
        },
        ...createLocateAsset(node),
        {
            type: 'extend-menu',
        },
        ...createConsoleMenu(node),
    ];
    const result = await mergeMenu(menu, 'rootMenu', node);
    return result;
}
/**
 * 针对场景里普通节点的右击菜单
 * @param node 当前操作的节点
 */
async function createNodeMenu(node) {
    const menu = [
        ...createEditPrefab(node),
        {
            label: Editor.I18n.t('hierarchy.menu.newNode'),
            enabled: !utils.canNotCreateNode(node) && utils.enableContextMenu(),
            submenu: await createMenu((addNode) => {
                addNode.parent = node.uuid;
                panelData.$.tree.addTo(addNode);
            }),
        },
        {
            type: 'separator',
        },
        {
            label: Editor.I18n.t('hierarchy.menu.copy'),
            accelerator: 'CmdOrCtrl+C',
            enabled: !utils.canNotCopyNode(node) && utils.enableContextMenu(),
            click() {
                panelData.$.tree.copy(node.uuid);
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.duplicate'),
            accelerator: 'CmdOrCtrl+D',
            enabled: !utils.canNotCopyNode(node) && utils.enableContextMenu(),
            click() {
                panelData.$.tree.duplicate(node.uuid);
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.cut'),
            accelerator: 'CmdOrCtrl+X',
            enabled: !utils.canNotCutNode(node) && utils.enableContextMenu(),
            click() {
                panelData.$.tree.cut(node.uuid);
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.paste'),
            accelerator: 'CmdOrCtrl+V',
            enabled: !utils.canNotPasteNode(node) && utils.enableContextMenu(),
            click() {
                panelData.$.tree.paste(node.uuid);
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.pasteAsChild'),
            accelerator: `CmdOrCtrl+${process.platform === 'win32' ? 'Alt' : 'Option'}+V`,
            enabled: !utils.canNotPasteNode(node) && utils.enableContextMenu(),
            click() {
                panelData.$.tree.paste(node.uuid, false, true);
            },
        },
        {
            label: Editor.I18n.t('hierarchy.menu.rename'),
            accelerator: 'Enter',
            enabled: !utils.canNotRename(node) && utils.enableContextMenu(),
            click() {
                panelData.$.tree.renameUuid = node.uuid;
            },
        },
        ...createLocateAsset(node),
        {
            type: 'extend-menu',
        },
        { type: 'separator' },
        {
            label: Editor.I18n.t('hierarchy.menu.selectAll'),
            accelerator: 'CmdOrCtrl+A',
            click() {
                panelData.$.tree.selectAll(node.uuid);
            },
        },
        { type: 'separator' },
        {
            label: Editor.I18n.t('hierarchy.menu.delete'),
            accelerator: 'Delete',
            enabled: !utils.canNotDeleteNode(node) && utils.enableContextMenu(),
            click() {
                panelData.$.tree.delete(node.uuid);
            },
        },
        ...createConsoleMenu(node),
    ];
    const result = await mergeMenu(menu, 'nodeMenu', node);
    return result;
}
/**
 * 弹出节点的右击菜单
 * @param node 当前操作的节点
 */
async function popupContextMenu(node) {
    const buildInMenu = node.isScene || node.isPrefabRoot ? await createRootMenu(node) : await createNodeMenu(node);
    prependCancelSearchMenu(buildInMenu);
    Editor.Menu.popup({
        menu: buildInMenu,
    });
}
exports.popupContextMenu = popupContextMenu;
/**
 * 合并外部扩展菜单
 */
async function mergeMenu(buildInMenu, where, node) {
    const extendMenu = await panelData.config.extendMenu.show(where, node);
    const extendIndex = buildInMenu.findIndex((item) => item.type === 'extend-menu');
    const menus = buildInMenu.slice();
    menus.splice(extendIndex, 1, ...extendMenu);
    return menus;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwtbWVudS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3BhbmVsLW1lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUliLHdEQUEwQztBQUMxQywrQ0FBaUM7QUFFakMsU0FBUyx1QkFBdUIsQ0FBQyxXQUEwQztJQUN2RSxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRTtRQUNyQixXQUFXLENBQUMsT0FBTyxDQUNmO1lBQ0ksS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDO1lBQ25ELEtBQUs7Z0JBQ0QsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDcEMsQ0FBQztTQUNKLEVBQ0Q7WUFDSSxJQUFJLEVBQUUsV0FBVztTQUNwQixDQUNKLENBQUM7S0FDTDtJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsS0FBSyxVQUFVLFVBQVUsQ0FBQyxRQUFrQjtJQUN4QyxNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3pELElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtRQUFFLE9BQU8sRUFBRSxDQUFDO0tBQUU7SUFFcEQsaUJBQWlCO0lBQ2pCLHlFQUF5RTtJQUN6RSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDL0MsSUFBSSxPQUFPLEVBQUU7UUFDVCxLQUFLLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBRTtZQUN2QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUIsSUFBSSxNQUFNLENBQUMs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O0dBRUc7QUFDSCxLQUFLLFVBQVUsU0FBUyxDQUFDLFdBQTBDLEVBQUUsS0FBMEIsRUFBRSxJQUFlO0lBQzVHLE1BQU0sVUFBVSxHQUFrQyxNQUFNLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdEcsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQWlDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFlLEtBQUssYUFBYSxDQUFDLENBQUM7SUFDekgsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2xDLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQyxDQUFDO0lBQzVDLE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEFkZE5vZGUsIFRyZWVOb2RlLCBNZW51RXh0ZW5zaW9uIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuXG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9wYW5lbC1kYXRhJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vdXRpbHMnO1xuXG5mdW5jdGlvbiBwcmVwZW5kQ2FuY2VsU2VhcmNoTWVudShidWlsZEluTWVudTogRWRpdG9yLk1lbnUuQ29udGV4dE1lbnVJdGVtW10pIHtcbiAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmcoKSkge1xuICAgICAgICBidWlsZEluTWVudS51bnNoaWZ0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiBFZGl0b3IuSTE4bi50KCdoaWVyYXJjaHkubWVudS5jYW5jZWxTZWFyY2gnKSxcbiAgICAgICAgICAgICAgICBjbGljaygpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuY2xlYXJTZWFyY2goKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc2VwYXJhdG9yJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBidWlsZEluTWVudTtcbn1cblxuLyoqXG4gKiDnlJ/miJDkuIDku73liJvlu7roioLngrnnmoToj5zljZVcbiAqIOeUqCBmdW5jdGlvbiDmnaXkuI3mlq3nlJ/miJDmlbDmja7mmK/kuLrkuobmlofmoYjpg73og73mnInnv7vor5HvvIzkuIvlkIxcbiAqIEBwYXJhbSBjYWxsYmFjayDlop7liqDmraTlsYLmmK/kuLrkuobmiorov5nph4znmoTlm7rlrprlj4LmlbDkvKDlh7rljrvvvIzmjqXmlLbmlrnlho3lop7liqDlj4LmlbBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gY3JlYXRlTWVudShjYWxsYmFjazogRnVuY3Rpb24pOiBQcm9taXNlPEVkaXRvci5NZW51LkNvbnRleHRNZW51SXRlbVtdPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IEVkaXRvci5NZW51Ll9fcHJvdGVjdGVkX18ucXVlcnlNYWluKCk7XG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhWydpMThuOm1lbnUubm9kZSddKSB7IHJldHVybiBbXTsgfVxuXG4gICAgLy8g6L+H5ruk5Ye6IGNyZWF0ZSDnmoToj5zljZVcbiAgICAvLyDov5nph4wgc3VibWVudSDnsbvlnovlsLHmmK/lr7nosaHvvIzlj6rmmK/njrDlnKggcXVlcnlNYWluIOWumuS5ieeahCB0eXBlIOaYr+mUmeivr+eahO+8jOWQjue7reS8muWcqOW6leWxgiBxdWVyeU1haW4g55qEIHR5cGVcbiAgICBjb25zdCBzdWJtZW51ID0gZGF0YVsnaTE4bjptZW51Lm5vZGUnXS5zdWJtZW51O1xuICAgIGlmIChzdWJtZW51KSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHN1Ym1lbnUpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHN1Ym1lbnVba2V5XTtcbiAgICAgICAgICAgIGlmIChjb25maWcuZ3JvdXAgIT09ICdjcmVhdGUnKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHN1Ym1lbnVba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1lbnVzID0gc3VpdFN1Ym1lbnUoZGF0YVsnaTE4bjptZW51Lm5vZGUnXSwgY2FsbGJhY2spWydzdWJtZW51J10gYXMgRWRpdG9yLk1lbnUuQ29udGV4dE1lbnVJdGVtW107XG4gICAgbWVudXMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdleHRlbmQtbWVudScgYXMgdW5rbm93biBhcyAnc2VwYXJhdG9yJyxcbiAgICB9KTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtZXJnZU1lbnUobWVudXMsICdjcmVhdGVNZW51Jyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gc3VpdFN1Ym1lbnUob2JqOiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW0sIGNhbGxiYWNrOiBGdW5jdGlvbikge1xuICAgIGlmIChvYmouc3VibWVudSkge1xuICAgICAgICAvLyDmlbDmja7mupDmmK/lr7nosaHnu5PmnoTvvIzkvYbmmK/lnKjlvLnlh7ptZW51IOeahOWcsOaWuSDpnIDopoHmlbDnu4TnmoTnu5PmnoRcbiAgICAgICAgb2JqLnN1Ym1lbnUgPSBPYmplY3QudmFsdWVzPEVkaXRvci5NZW51LkNvbnRleHRNZW51SXRlbT4ob2JqLnN1Ym1lbnUpLnJlZHVjZSgocmVzdWx0OiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW1bXSwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgbmV4dC5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXh0LnBhcmFtcz8uWzBdKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBzdWl0U3VibWVudShuZXh0LCBjYWxsYmFjayk7XG4gICAgICAgICAgICByZXN1bHQucHVzaChuZXh0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiDlvLnlh7rliJvlu7roioLngrnoj5zljZVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBvcHVwQ3JlYXRlTWVudSgpIHtcbiAgICBpZiAoIXV0aWxzLmVuYWJsZUNvbnRleHRNZW51KCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIEVkaXRvci5NZW51LnBvcHVwKHtcbiAgICAgICAgbWVudTogYXdhaXQgY3JlYXRlTWVudSgoYWRkTm9kZTogQWRkTm9kZSkgPT4ge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5hZGRUbyhhZGROb2RlKTtcbiAgICAgICAgfSksXG4gICAgfSk7XG59XG5cbi8qKlxuICog55Sf5oiQ5LiA5Lu96Z2i5p2/56m655m95Yy65Z+f55qE5Y+z5Ye76I+c5Y2VXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVBhbmVsTWVudSgpIHtcbiAgICBjb25zdCBtZW51OiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW1bXSA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51Lm5ld05vZGUnKSxcbiAgICAgICAgICAgIGVuYWJsZWQ6IHV0aWxzLmVuYWJsZUNvbnRleHRNZW51KCksXG4gICAgICAgICAgICBzdWJtZW51OiBhd2FpdCBjcmVhdGVNZW51KChhZGROb2RlOiBBZGROb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5hZGRUbyhhZGROb2RlKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogRWRpdG9yLkkxOG4udCgnaGllcmFyY2h5Lm1lbnUucGFzdGUnKSxcbiAgICAgICAgICAgIGFjY2VsZXJhdG9yOiAnQ21kT3JDdHJsK1YnLFxuICAgICAgICAgICAgZW5hYmxlZDogIXV0aWxzLmlzTm9uZUNvcHlPckN1dCgpICYmIHV0aWxzLmVuYWJsZUNvbnRleHRNZW51KCksXG4gICAgICAgICAgICBjbGljaygpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLnBhc3RlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0eXBlOiAnZXh0ZW5kLW1lbnUnLFxuICAgICAgICB9LFxuICAgIF07XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbWVyZ2VNZW51KG1lbnUsICdwYW5lbE1lbnUnKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIOW8ueWHuumdouadv+epuueZveS9jee9ruS4iuWPs+WHu+iPnOWNlVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcG9wdXBQYW5lbE1lbnUoKSB7XG4gICAgY29uc3QgYnVpbGRJbk1lbnUgPSBhd2FpdCBjcmVhdGVQYW5lbE1lbnUoKTtcbiAgICBwcmVwZW5kQ2FuY2VsU2VhcmNoTWVudShidWlsZEluTWVudSk7XG5cbiAgICBFZGl0b3IuTWVudS5wb3B1cCh7XG4gICAgICAgIG1lbnU6IGJ1aWxkSW5NZW51LFxuICAgIH0pO1xufVxuXG4vKipcbiAqIOeUn+aIkOS4gOS7vemdouadv+aQnOe0ouexu+Wei+eahOiPnOWNlVxuICovXG5mdW5jdGlvbiBjcmVhdGVTZWFyY2hNZW51KCk6IEVkaXRvci5NZW51LkNvbnRleHRNZW51SXRlbVtdIHtcbiAgICBjb25zdCB7IHNlYXJjaFR5cGUgfSA9IHBhbmVsRGF0YS4kLnBhbmVsO1xuXG4gICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LnNlYXJjaE5hbWUnKSxcbiAgICAgICAgICAgIHR5cGU6ICdyYWRpbycsXG4gICAgICAgICAgICBjaGVja2VkOiBzZWFyY2hUeXBlID09PSAnbmFtZScsXG4gICAgICAgICAgICBjbGljaygpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hUeXBlID0gJ25hbWUnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LnNlYXJjaFV1aWQnKSxcbiAgICAgICAgICAgIHR5cGU6ICdyYWRpbycsXG4gICAgICAgICAgICBjaGVja2VkOiBzZWFyY2hUeXBlID09PSAndXVpZCcsXG4gICAgICAgICAgICBjbGljaygpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hUeXBlID0gJ3V1aWQnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LnNlYXJjaFBhdGgnKSxcbiAgICAgICAgICAgIHR5cGU6ICdyYWRpbycsXG4gICAgICAgICAgICBjaGVja2VkOiBzZWFyY2hUeXBlID09PSAncGF0aCcsXG4gICAgICAgICAgICBjbGljaygpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hUeXBlID0gJ3BhdGgnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LnNlYXJjaENvbXBvbmVudCcpLFxuICAgICAgICAgICAgdHlwZTogJ3JhZGlvJyxcbiAgICAgICAgICAgIGNoZWNrZWQ6IHNlYXJjaFR5cGUgPT09ICdjb21wb25lbnQnLFxuICAgICAgICAgICAgY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVHlwZSA9ICdjb21wb25lbnQnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LnNlYXJjaEFzc2V0JyksXG4gICAgICAgICAgICB0eXBlOiAncmFkaW8nLFxuICAgICAgICAgICAgY2hlY2tlZDogc2VhcmNoVHlwZSA9PT0gJ2Fzc2V0JyxcbiAgICAgICAgICAgIGNsaWNrKCkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLnNlYXJjaFR5cGUgPSAnYXNzZXQnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LnNlYXJjaE1pc3NBc3NldCcpLFxuICAgICAgICAgICAgdHlwZTogJ3JhZGlvJyxcbiAgICAgICAgICAgIGNoZWNrZWQ6IHNlYXJjaFR5cGUgPT09ICdtaXNzQXNzZXQnLFxuICAgICAgICAgICAgY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVHlwZSA9ICdtaXNzQXNzZXQnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICBdO1xufVxuXG4vKipcbiAqIOW8ueWHuumdouadv+aQnOe0ouiPnOWNlVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcG9wdXBTZWFyY2hNZW51KCkge1xuICAgIEVkaXRvci5NZW51LnBvcHVwKHtcbiAgICAgICAgbWVudTogY3JlYXRlU2VhcmNoTWVudSgpLFxuICAgIH0pO1xufVxuXG4vKipcbiAqIOeUn+aIkOS4gOS7veWkjeWItuW5tuaJk+WNsCB1dWlkIHBhdGgg562J5pWw5o2u55qE6I+c5Y2VXG4gKiBAcGFyYW0gbm9kZSDlvZPliY3mk43kvZznmoToioLngrlcbiAqL1xuZnVuY3Rpb24gY3JlYXRlQ29uc29sZU1lbnUobm9kZTogVHJlZU5vZGUpOiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW1bXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgeyB0eXBlOiAnc2VwYXJhdG9yJyB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogRWRpdG9yLkkxOG4udCgnaGllcmFyY2h5Lm1lbnUuc2hvd1V1aWQnKSxcbiAgICAgICAgICAgIGNsaWNrKCkge1xuICAgICAgICAgICAgICAgIEVkaXRvci5DbGlwYm9hcmQud3JpdGUoJ3RleHQnLCBub2RlLnV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdVVUlEICcsIEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LmRvbmVDb3BpZWQnKSwgJyAnLCBub2RlLnV1aWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LnNob3dQYXRoJyksXG4gICAgICAgICAgICBjbGljaygpIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLndyaXRlKCd0ZXh0Jywgbm9kZS5wYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUEFUSCAnLCBFZGl0b3IuSTE4bi50KCdoaWVyYXJjaHkubWVudS5kb25lQ29waWVkJyksICcgJywgbm9kZS5wYXRoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgXTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRWRpdFByZWZhYihub2RlOiBUcmVlTm9kZSk6IEVkaXRvci5NZW51LkNvbnRleHRNZW51SXRlbVtdIHtcbiAgICBjb25zdCBpc1ByZWZhYiA9IG5vZGUucHJlZmFiICYmIG5vZGUucHJlZmFiLnN0YXRlICYmIG5vZGUucHJlZmFiLnN0YXRlICE9PSAzO1xuICAgIGlmICghaXNQcmVmYWIgfHwgbm9kZS5wcmVmYWIuYXNzZXRVdWlkLmluY2x1ZGVzKCdAJykgfHwgbm9kZS5wcmVmYWIuYXNzZXRVdWlkID09PSBwYW5lbERhdGEuYWN0LmFzc2V0VXVpZCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LmVkaXRfcHJlZmFiJyksXG4gICAgICAgICAgICBlbmFibGVkOiBub2RlLnByZWZhYiAmJiAhIW5vZGUucHJlZmFiLmFzc2V0VXVpZCxcbiAgICAgICAgICAgIGNsaWNrKCkge1xuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ29wZW4tYXNzZXQnLCBub2RlLnByZWZhYi5hc3NldFV1aWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ3NlcGFyYXRvcicsXG4gICAgICAgIH0sXG4gICAgXTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTG9jYXRlQXNzZXQobm9kZTogVHJlZU5vZGUpOiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW1bXSB7XG4gICAgaWYgKCFub2RlLmlzU2NlbmUgJiYgbm9kZS5wcmVmYWIgJiYgIW5vZGUucHJlZmFiLnN0YXRlKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnc2VwYXJhdG9yJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LmxvY2F0ZUFzc2V0JyksXG4gICAgICAgICAgICBlbmFibGVkOiB1dGlscy5pc0V4aXN0ZWRBc3NldCgpLFxuICAgICAgICAgICAgY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hc3NldChub2RlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgXTtcbn1cblxuLyoqXG4gKiDpkojlr7nlnLrmma/moLnoioLngrnnmoTlj7Plh7voj5zljZVcbiAqIEBwYXJhbSBub2RlIOW9k+WJjeaTjeS9nOeahOiKgueCuVxuICovXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVSb290TWVudShub2RlOiBUcmVlTm9kZSk6IFByb21pc2U8RWRpdG9yLk1lbnUuQ29udGV4dE1lbnVJdGVtW10+IHtcbiAgICBjb25zdCBtZW51OiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW1bXSA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51Lm5ld05vZGUnKSxcbiAgICAgICAgICAgIGVuYWJsZWQ6ICF1dGlscy5jYW5Ob3RDcmVhdGVOb2RlKG5vZGUpICYmIHV0aWxzLmVuYWJsZUNvbnRleHRNZW51KCksXG4gICAgICAgICAgICBzdWJtZW51OiBhd2FpdCBjcmVhdGVNZW51KChhZGROb2RlOiBBZGROb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgYWRkTm9kZS5wYXJlbnQgPSBub2RlLnV1aWQ7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5hZGRUbyhhZGROb2RlKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogRWRpdG9yLkkxOG4udCgnaGllcmFyY2h5Lm1lbnUucGFzdGUnKSxcbiAgICAgICAgICAgIGFjY2VsZXJhdG9yOiAnQ21kT3JDdHJsK1YnLFxuICAgICAgICAgICAgZW5hYmxlZDogIXV0aWxzLmNhbk5vdFBhc3RlTm9kZShub2RlKSAmJiB1dGlscy5lbmFibGVDb250ZXh0TWVudSgpLFxuICAgICAgICAgICAgY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5wYXN0ZShub2RlLnV1aWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgLi4uY3JlYXRlTG9jYXRlQXNzZXQobm9kZSksXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICdleHRlbmQtbWVudScgYXMgdW5rbm93biBhcyAnc2VwYXJhdG9yJyxcbiAgICAgICAgfSxcbiAgICAgICAgLi4uY3JlYXRlQ29uc29sZU1lbnUobm9kZSksXG4gICAgXTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtZXJnZU1lbnUobWVudSwgJ3Jvb3RNZW51Jywgbm9kZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiDpkojlr7nlnLrmma/ph4zmma7pgJroioLngrnnmoTlj7Plh7voj5zljZVcbiAqIEBwYXJhbSBub2RlIOW9k+WJjeaTjeS9nOeahOiKgueCuVxuICovXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVOb2RlTWVudShub2RlOiBUcmVlTm9kZSk6IFByb21pc2U8RWRpdG9yLk1lbnUuQ29udGV4dE1lbnVJdGVtW10+IHtcbiAgICBjb25zdCBtZW51ID0gW1xuICAgICAgICAuLi5jcmVhdGVFZGl0UHJlZmFiKG5vZGUpLFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogRWRpdG9yLkkxOG4udCgnaGllcmFyY2h5Lm1lbnUubmV3Tm9kZScpLFxuICAgICAgICAgICAgZW5hYmxlZDogIXV0aWxzLmNhbk5vdENyZWF0ZU5vZGUobm9kZSkgJiYgdXRpbHMuZW5hYmxlQ29udGV4dE1lbnUoKSxcbiAgICAgICAgICAgIHN1Ym1lbnU6IGF3YWl0IGNyZWF0ZU1lbnUoKGFkZE5vZGU6IEFkZE5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICBhZGROb2RlLnBhcmVudCA9IG5vZGUudXVpZDtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLmFkZFRvKGFkZE5vZGUpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICdzZXBhcmF0b3InLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogRWRpdG9yLkkxOG4udCgnaGllcmFyY2h5Lm1lbnUuY29weScpLFxuICAgICAgICAgICAgYWNjZWxlcmF0b3I6ICdDbWRPckN0cmwrQycsXG4gICAgICAgICAgICBlbmFibGVkOiAhdXRpbHMuY2FuTm90Q29weU5vZGUobm9kZSkgJiYgdXRpbHMuZW5hYmxlQ29udGV4dE1lbnUoKSxcbiAgICAgICAgICAgIGNsaWNrKCkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuY29weShub2RlLnV1aWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LmR1cGxpY2F0ZScpLFxuICAgICAgICAgICAgYWNjZWxlcmF0b3I6ICdDbWRPckN0cmwrRCcsXG4gICAgICAgICAgICBlbmFibGVkOiAhdXRpbHMuY2FuTm90Q29weU5vZGUobm9kZSkgJiYgdXRpbHMuZW5hYmxlQ29udGV4dE1lbnUoKSxcbiAgICAgICAgICAgIGNsaWNrKCkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUuZHVwbGljYXRlKG5vZGUudXVpZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogRWRpdG9yLkkxOG4udCgnaGllcmFyY2h5Lm1lbnUuY3V0JyksXG4gICAgICAgICAgICBhY2NlbGVyYXRvcjogJ0NtZE9yQ3RybCtYJyxcbiAgICAgICAgICAgIGVuYWJsZWQ6ICF1dGlscy5jYW5Ob3RDdXROb2RlKG5vZGUpICYmIHV0aWxzLmVuYWJsZUNvbnRleHRNZW51KCksXG4gICAgICAgICAgICBjbGljaygpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLmN1dChub2RlLnV1aWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LnBhc3RlJyksXG4gICAgICAgICAgICBhY2NlbGVyYXRvcjogJ0NtZE9yQ3RybCtWJyxcbiAgICAgICAgICAgIGVuYWJsZWQ6ICF1dGlscy5jYW5Ob3RQYXN0ZU5vZGUobm9kZSkgJiYgdXRpbHMuZW5hYmxlQ29udGV4dE1lbnUoKSxcbiAgICAgICAgICAgIGNsaWNrKCkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnRyZWUucGFzdGUobm9kZS51dWlkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiBFZGl0b3IuSTE4bi50KCdoaWVyYXJjaHkubWVudS5wYXN0ZUFzQ2hpbGQnKSxcbiAgICAgICAgICAgIGFjY2VsZXJhdG9yOiBgQ21kT3JDdHJsKyR7cHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyA/ICdBbHQnIDogJ09wdGlvbid9K1ZgLFxuICAgICAgICAgICAgZW5hYmxlZDogIXV0aWxzLmNhbk5vdFBhc3RlTm9kZShub2RlKSAmJiB1dGlscy5lbmFibGVDb250ZXh0TWVudSgpLFxuICAgICAgICAgICAgY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5wYXN0ZShub2RlLnV1aWQsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiBFZGl0b3IuSTE4bi50KCdoaWVyYXJjaHkubWVudS5yZW5hbWUnKSxcbiAgICAgICAgICAgIGFjY2VsZXJhdG9yOiAnRW50ZXInLFxuICAgICAgICAgICAgZW5hYmxlZDogIXV0aWxzLmNhbk5vdFJlbmFtZShub2RlKSAmJiB1dGlscy5lbmFibGVDb250ZXh0TWVudSgpLFxuICAgICAgICAgICAgY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5yZW5hbWVVdWlkID0gbm9kZS51dWlkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgLi4uY3JlYXRlTG9jYXRlQXNzZXQobm9kZSksXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICdleHRlbmQtbWVudScsXG4gICAgICAgIH0sXG4gICAgICAgIHsgdHlwZTogJ3NlcGFyYXRvcicgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5tZW51LnNlbGVjdEFsbCcpLFxuICAgICAgICAgICAgYWNjZWxlcmF0b3I6ICdDbWRPckN0cmwrQScsXG4gICAgICAgICAgICBjbGljaygpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC50cmVlLnNlbGVjdEFsbChub2RlLnV1aWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyB0eXBlOiAnc2VwYXJhdG9yJyB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogRWRpdG9yLkkxOG4udCgnaGllcmFyY2h5Lm1lbnUuZGVsZXRlJyksXG4gICAgICAgICAgICBhY2NlbGVyYXRvcjogJ0RlbGV0ZScsXG4gICAgICAgICAgICBlbmFibGVkOiAhdXRpbHMuY2FuTm90RGVsZXRlTm9kZShub2RlKSAmJiB1dGlscy5lbmFibGVDb250ZXh0TWVudSgpLFxuICAgICAgICAgICAgY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudHJlZS5kZWxldGUobm9kZS51dWlkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIC4uLmNyZWF0ZUNvbnNvbGVNZW51KG5vZGUpLFxuICAgIF0gYXMgRWRpdG9yLk1lbnUuQ29udGV4dE1lbnVJdGVtW107XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbWVyZ2VNZW51KG1lbnUsICdub2RlTWVudScsIG5vZGUpO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICog5by55Ye66IqC54K555qE5Y+z5Ye76I+c5Y2VXG4gKiBAcGFyYW0gbm9kZSDlvZPliY3mk43kvZznmoToioLngrlcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBvcHVwQ29udGV4dE1lbnUobm9kZTogVHJlZU5vZGUpIHtcblxuICAgIGNvbnN0IGJ1aWxkSW5NZW51OiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW1bXSA9IG5vZGUuaXNTY2VuZSB8fCBub2RlLmlzUHJlZmFiUm9vdCA/IGF3YWl0IGNyZWF0ZVJvb3RNZW51KG5vZGUpIDogYXdhaXQgY3JlYXRlTm9kZU1lbnUobm9kZSk7XG4gICAgcHJlcGVuZENhbmNlbFNlYXJjaE1lbnUoYnVpbGRJbk1lbnUpO1xuXG4gICAgRWRpdG9yLk1lbnUucG9wdXAoe1xuICAgICAgICBtZW51OiBidWlsZEluTWVudSxcbiAgICB9KTtcbn1cblxuLyoqXG4gKiDlkIjlubblpJbpg6jmianlsZXoj5zljZVcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbWVyZ2VNZW51KGJ1aWxkSW5NZW51OiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW1bXSwgd2hlcmU6IGtleW9mIE1lbnVFeHRlbnNpb24sIG5vZGU/OiBUcmVlTm9kZSkge1xuICAgIGNvbnN0IGV4dGVuZE1lbnU6IEVkaXRvci5NZW51LkNvbnRleHRNZW51SXRlbVtdID0gYXdhaXQgcGFuZWxEYXRhLmNvbmZpZy5leHRlbmRNZW51LnNob3cod2hlcmUsIG5vZGUpO1xuICAgIGNvbnN0IGV4dGVuZEluZGV4ID0gYnVpbGRJbk1lbnUuZmluZEluZGV4KChpdGVtOiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW0pID0+IGl0ZW0udHlwZSBhcyB1bmtub3duID09PSAnZXh0ZW5kLW1lbnUnKTtcbiAgICBjb25zdCBtZW51cyA9IGJ1aWxkSW5NZW51LnNsaWNlKCk7XG4gICAgbWVudXMuc3BsaWNlKGV4dGVuZEluZGV4LCAxLCAuLi5leHRlbmRNZW51KTtcbiAgICByZXR1cm4gbWVudXM7XG59XG4iXX0=