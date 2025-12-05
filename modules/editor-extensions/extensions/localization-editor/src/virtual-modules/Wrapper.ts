import 'reflect-metadata';
import { container } from 'tsyringe';
import WrapperTranslateItem from '../core/entity/translate/WrapperTranslateItem';
import WrapperMainIPC from '../core/ipc/WrapperMainIPC';
import IWrapperModule from './WrapperModule';

const Content: IWrapperModule = {
    wrapper: container.resolve(WrapperMainIPC),
    WrapperTranslateItem,
};
export = Content;
