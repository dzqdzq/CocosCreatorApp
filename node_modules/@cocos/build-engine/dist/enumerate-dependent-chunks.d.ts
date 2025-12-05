import { build } from './index';
/**
 * Enumerates all chunk files that used by specified feature units.
 * @param meta Metadata of build result.
 * @param featureUnits Feature units.
 */
export declare function enumerateDependentChunks(meta: build.Result, featureUnits: string[]): string[];
