export interface AssetInfo {
    name: string;
    uuid: string;
    type?: string;
    path: string;
    iconInfo?: IconInfo;
}

export interface IconInfo {
    type: IconType;
    value: string;
}

export type IconType = 'image' | 'icon';

export type IconMap = {
    asset: Record<string, IconInfo>;
    node: Record<string, IconInfo>;
    component: Record<string, IconInfo>;
};
