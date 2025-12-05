/* eslint-disable semi */
import 'Wrapper';
import type WrapperTranslateItem from '../core/entity/translate/WrapperTranslateItem';
import IWrapperMainThread from '../main/IWrapperMainThread';

export default interface IWrapperModule {
    wrapper: IWrapperMainThread;
    WrapperTranslateItem: typeof WrapperTranslateItem;
}
declare module 'Wrapper' {
    export const wrapper: IWrapperModule['wrapper'];
    export const WrapperTranslateItem: IWrapperModule['WrapperTranslateItem'];
}
