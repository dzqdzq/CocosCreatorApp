import { IProperty, INode, CreateNodeOptions, SetPropertyOptions } from '../@types/public';
export declare async function queryNode(uuid: string): INode;
export declare async function setProperty(options: SetPropertyOptions);
export declare async function queryNodeTree(): INode;