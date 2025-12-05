/* eslint-disable semi */
import 'Builder';
import IBuilder from '../builder/IBuilder';

export default interface IBuilderModule {
    builder: IBuilder
}

declare module 'Builder' {
    export const builder: IBuilderModule['builder'];
}
