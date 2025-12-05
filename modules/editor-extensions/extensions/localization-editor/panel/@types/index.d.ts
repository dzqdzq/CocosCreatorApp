// 由于面板不再 tsconfig配置的范围内，所以需要在面板这里引入类型声明
///<reference types="F:/Github/creator/app/@types/editor"/>
///<reference types="../../../../app/@types/editor"/>
declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
    const component: DefineComponent<{}, {}, any>;
    export default component;
}
declare type MapKey<T> = T extends Map<infer K, any> ? K : T;
declare type MapValue<T> = T extends Map<any, infer K> ? K : T;
declare type UnPromise<T> = T extends Promise<infer R> ? R : T;

declare module 'Builder' {

}

declare module 'Wrapper' {

}

declare module 'EventBus' {

}
declare type UUID = string;
