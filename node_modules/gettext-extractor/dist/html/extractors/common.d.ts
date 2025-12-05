export interface IAttributeMapping {
    textPlural?: string;
    context?: string;
    comment?: string;
}
export interface IHtmlExtractorOptions {
    attributes?: IAttributeMapping;
}
export declare function validateOptions(options: IHtmlExtractorOptions): void;
