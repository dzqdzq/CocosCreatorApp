import { ICurveConfig } from "./curve-base";
import { Grid } from "./grid";
import { Hermite } from "./hermite";
export declare type ICurveType = 'hermit';
export declare function getCurveInstance(type: ICurveType, canvas: HTMLCanvasElement, grid: Grid, config: ICurveConfig): Hermite;
export declare function getCurveClass(type: ICurveType): typeof Hermite;
