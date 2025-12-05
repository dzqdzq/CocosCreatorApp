export { Asset, Importer, VirtualAsset } from '@editor/asset-db';

export interface IAsset {
    name: string; // 资源名字
    asset: import('@editor/asset-db').Asset; // AssetDB 的资源
}