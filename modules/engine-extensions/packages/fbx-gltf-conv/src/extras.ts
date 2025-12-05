/* eslint-disable camelcase */

export interface OriginalMaterial {
    properties?: unknown;
}

export interface OriginalMaterialExtra {
    ['FBX-glTF-conv']: {
        originalMaterial: OriginalMaterial
    };
}

export interface Adsk3dsMaxPhysicalMaterialProperties {
    ShadingModel: 'unknown',
    '3dsMax': {
        ORIGINAL_MTL: 'PHYSICAL_MTL';
        // TODO: material_mode brdf_low brdf_high brdf_curve aniso_mode aniso_channel displacement_map cutout_map
        Parameters: Partial<{
            // #region Hidden
            brdf_mode: FbxBoolean;
            // #endregion

            // #region Tab: Coating Parameters
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
            // #endregion

            // #region Tab: Basic Parameters
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
            // #endregion

            // #region Tab: Transparency
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
            // #endregion

            // #region Tab: Sub-surface Scattering
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
            // #endregion

            // #region Tab: Emission
            emission: FbxFloat;
            emission_map: TextureReference;
            emission_map_on: FbxBoolean;

            emit_color: FbxColor;
            emit_color_map: TextureReference;
            emit_color_map_on: FbxBoolean;

            emit_luminance: FbxFloat;

            emit_kelvin: FbxFloat;
            // #endregion

            // #region Tab: Anisotropy
            anisotropy: FbxFloat;
            anisotropy_map: TextureReference;
            anisotropy_map_on: FbxBoolean;

            anisoangle: FbxFloat;
            aniso_angle_map: TextureReference;
            aniso_angle_map_on: FbxBoolean;
            // #endregion

            // #region Tab: Special Maps
            bump_map: TextureReference;
            // #endregion

            // #region Tab: Generic Maps
            // #endregion
        }>;
    };
}

type Adsk3dsMaxPhysicalMaterialParameters = Required<Adsk3dsMaxPhysicalMaterialProperties['3dsMax']['Parameters']>;

type Adsk3dsMaxPhysicalMaterialParametersNoMaps = Omit<Adsk3dsMaxPhysicalMaterialParameters, `${string}_map`>;

export const ADSK_3DS_MAX_PHYSICAL_MATERIAL_DEFAULT_PARAMETERS: Readonly<Adsk3dsMaxPhysicalMaterialParametersNoMaps> = {
    brdf_mode: false,
    coating: 0.0,
    coat_map_on: true,
    coat_color: [1.0, 1.0, 1.0, 1.0] as const,
    coat_color_map_on: true,
    coat_roughness: 0.0,
    coat_rough_map_on: true,
    coat_roughness_inv: false,
    coat_affect_color: 0.5,
    coat_affect_roughness: 0.0,
    coat_ior: 1.52,
    basic_weight: 1.0,
    base_weight_map_on: true,
    base_color: [0.5, 0.5, 0.5, 1.0] as const,
    base_color_map_on: true,
    diff_roughness: 0.0,
    diff_rough_map_on: true,
    reflectivity: 1.0,
    reflectivity_map_on: true,
    refl_color: [1.0, 1.0, 1.0, 1.0] as const,
    refl_color_map_on: true,
    roughness: 0.0,
    roughness_map_on: true,
    roughness_inv: false,
    metalness: 0.0,
    metalness_map_on: true,
    ior: 1.52,
    ior_map_on: true,
    transparency: 0.0,
    transparency_map_on: true,
    trans_color: [1.0, 1.0, 1.0, 1.0] as const,
    trans_color_map_on: true,
    trans_depth: 0.0,
    trans_depth_map_on: true,
    trans_roughness: 0.0,
    trans_rough_map_on: true,
    trans_roughness_inv: false,
    trans_roughness_lock: false,
    trans_ior: 1.52,
    trans_ior_map_on: true,
    thin_walled: false,
    scattering: 0.0,
    scattering_map_on: true,
    sss_color: [1.0, 1.0, 1.0, 1.0] as const,
    sss_color_map_on: true,
    sss_scatter_color: [1.0, 0.5, 0.25, 1.0] as const,
    sss_depth: 10.0,
    sss_scale: 1.0,
    sss_scale_map_on: true,
    emission: 1.0,
    emission_map_on: true,
    emit_color: [0.0, 0.0, 0.0, 1.0] as const,
    emit_color_map_on: true,
    emit_luminance: 1500,
    emit_kelvin: 6500.0,
    anisotropy: 1.0,
    anisotropy_map_on: true,
    anisoangle: 0.0,
    aniso_angle_map_on: true,
};

export function hasOriginalMaterialExtras(extras: unknown): extras is OriginalMaterialExtra {
    if (typeof extras !== 'object' || !extras) {
        return false;
    }
    const { ['FBX-glTF-conv']: toolExtra } = extras as { ['FBX-glTF-conv']: unknown };
    if (typeof toolExtra !== 'object' || !toolExtra) {
        return false;
    }

    const { originalMaterial } = toolExtra as { originalMaterial?: OriginalMaterial };
    if (!originalMaterial) {
        return false;
    }

    return true;
}

export function isAdsk3dsMaxPhysicalMaterial(originalMaterial: OriginalMaterial): originalMaterial is { properties: Adsk3dsMaxPhysicalMaterialProperties } {
    const { properties } = originalMaterial;
    if (typeof properties !== 'object' || properties === null) {
        return false;
    }
    const { ['3dsMax']: adsk3dsMax } = properties as { ['3dsMax']: unknown };
    if (typeof adsk3dsMax !== 'object' || adsk3dsMax === null) {
        return false;
    }
    const { ORIGINAL_MTL } = adsk3dsMax as { ORIGINAL_MTL: unknown };
    if (ORIGINAL_MTL !== 'PHYSICAL_MTL') {
        return false;
    }

    return true;
}

type FbxFloat = number;

type FbxColor = readonly [number, number, number, number];

type FbxBoolean = boolean;

type TextureReference = {
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
