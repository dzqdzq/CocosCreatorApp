import IWrapperTranslateItem from './IWrapperTranslateItem';

type IWrapperTranslateItemMap = Record<string, undefined | IWrapperTranslateItem & {index: number}>;
export default IWrapperTranslateItemMap;
