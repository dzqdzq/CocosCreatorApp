import type { IShortcutInfo } from '../../shortcut';
export declare function createWanderShortcutHtml(): {
    style: string;
    script(root: HTMLDivElement, keyInfo: Record<string, IShortcutInfo>): void;
};
