export * from './protected';
import type { IShortcutItem, IShortcutItemMap } from './protected';

export interface IShortcutEditInfo {
    key: string;
    shortcut: string;
    searches: IShortcutItem[];
    conflict: boolean;
    when: string;
    showSearches: boolean;
}

export interface IEditorFlag {
    hasHandle: boolean;
}

export interface IVueData {
    map: Record<string, IShortcutItemMap>,
    active: string,
    msg: IShortcutItem | null,

    left: [],
    right: [],

    editInfo: IShortcutEditInfo | null,
    checkEditInfoTimer: NodeJS.Timeout | null,
    dirty: boolean,
    editFlag: IEditorFlag,
    shortcutList: Record<string, IShortcutItem[]>;
}

export type TEditInfoState = '' | 'error' | 'warn';

export interface IShortcutOptions {
    win: string;
    mac: string;
}