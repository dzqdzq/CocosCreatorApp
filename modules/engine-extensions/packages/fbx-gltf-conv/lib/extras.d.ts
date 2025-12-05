export interface OriginalMaterial {
    properties?: unknown;
}
export interface OriginalMaterialExtra {
    ['FBX-glTF-conv']: {
        originalMaterial: OriginalMaterial;
    };
}
export interface Adsk3dsMaxPhysicalMaterialProperties {
    ShadingModel: 'unknown';
    '3dsMax': {
        ORIGINAL_MTL: 'PHYSICAL_MTL';
        Parameters: Partial<{
            brdf_mode: FbxBoolean;
            coating: FbxFloat;
            coat_map: TextureReference;
            coat_map_on: FbxBoolean;
            coat_color: FbxColor;
            coat_color_map: TextureReference;
            coat_color_map_on: FbxBoolean;
            coat_roughness: FbxFloat;
            coat_rough_map: TextureReference;
            coat_rough_map_on: FbxBoolean;
            coat_roughness_inv: FbxBoolean;
            coat_affect_color: FbxFloat;
            coat_affect_roughness: FbxFloat;
            coat_ior: FbxFloat;
            basic_weight: FbxFloat;
            base_weight_map: TextureReference;
            base_weight_map_on: FbxBoolean;
            base_color: FbxColor;
            base_color_map: TextureReference;
            base_color_map_on: FbxBoolean;
            diff_roughness: FbxFloat;
            diff_rough_map: TextureReference;
            diff_rough_map_on: FbxBoolean;
            reflectivity: FbxFloat;
            reflectivity_map: TextureReference;
            reflectivity_map_on: FbxBoolean;
            refl_color: FbxColor;
            refl_color_map: TextureReference;
            refl_color_map_on: FbxBoolean;
            roughness: FbxFloat;
            roughness_map: TextureReference;
            roughness_map_on: FbxBoolean;
            roughness_inv: FbxBoolean;
            metalness: FbxFloat;
            metalness_map: TextureReference;
            metalness_map_on: FbxBoolean;
            ior: FbxFloat;
            ior_map: TextureReference;
            ior_map_on: FbxBoolean;
            transparency: FbxFloat;
            transparency_map: TextureReference;
            transparency_map_on: FbxBoolean;
            trans_color: FbxColor;
            trans_color_map: TextureReference;
            trans_color_map_on: FbxBoolean;
            trans_depth: FbxFloat;
            trans_depth_map: TextureReference;
            trans_depth_map_on: FbxBoolean;
            trans_roughness: FbxFloat;
            trans_rough_map: TextureReference;
            trans_rough_map_on: FbxBoolean;
            trans_roughness_inv: FbxBoolean;
            trans_roughness_lock: FbxBoolean;
            trans_ior: FbxFloat;
            trans_ior_map: TextureReference;
            trans_ior_map_on: FbxBoolean;
            thin_walled: FbxBoolean;
            scattering: FbxFloat;
            scattering_map: TextureReference;
            scattering_map_on: FbxBoolean;
            sss_color: FbxColor;
            sss_color_map: TextureReference;
            sss_color_map_on: FbxBoolean;
            sss_scatter_color: FbxColor;
            sss_depth: FbxFloat;
            sss_scale: FbxFloat;
            sss_scale_map: TextureReference;
            sss_scale_map_on: FbxBoolean;
            emission: FbxFloat;
            emission_map: TextureReference;
            emission_map_on: FbxBoolean;
            emit_color: FbxColor;
            emit_color_map: TextureReference;
            emit_color_map_on: FbxBoolean;
            emit_luminance: FbxFloat;
            emit_kelvin: FbxFloat;
            anisotropy: FbxFloat;
            anisotropy_map: TextureReference;
            anisotropy_map_on: FbxBoolean;
            anisoangle: FbxFloat;
            aniso_angle_map: TextureReference;
            aniso_angle_map_on: FbxBoolean;
            bump_map: TextureReference;
        }>;
    };
}
declare type Adsk3dsMaxPhysicalMaterialParameters = Required<Adsk3dsMaxPhysicalMaterialProperties['3dsMax']['Parameters']>;
declare type Adsk3dsMaxPhysicalMaterialParametersNoMaps = Omit<Adsk3dsMaxPhysicalMaterialParameters, `${string}_map`>;
export declare const ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS: Readonly<Adsk3dsMaxPhysicalMaterialParametersNoMaps>;
export declare function hasOriginalMaterialExtras(extras: unknown): extras is OriginalMaterialExtra;
export declare function isAdsk3dsMaxPhysicalMaterial(originalMaterial: OriginalMaterial): originalMaterial is {
    properties: Adsk3dsMaxPhysicalMaterialProperties;
};
declare type FbxFloat = number;
declare type FbxColor = readonly [number, number, number, number];
declare type FbxBoolean = boolean;
declare type TextureReference = {
    /**
     * Index to the glTF texture array.
     */
    index: number;
    /**
     *
     */
    texCoord?: number;
    extensions?: unknown;
};
export {};
