"use strict";module.exports={title:"AssetDB",description:"Cocos Creator Asset Database",deprecatedTip:"{oldName} is deprecated in {version}. Please use {newName} instead",globalReadonlyTip:"The global variable {name} field is already used by the resource process and cannot be overwritten, please replace it with another field",mask:{startup:"Starting the asset database - {name}",loading:"Loading ..."},"debug-mode":"Open Assets(Builder) DevTools",assetDBPauseTips:"The asset database is locked, asset operations({operate}) will delay response, please wait a moment.",assetDBInitError:"Failed to initialize asset database, please check the console for details.",operate:{dialogError:"Error",dialogWarning:"Warning",dialogQuestion:"Confirm",dialogInfo:"Tips",dialogDoNotNotify:"Do not ask again for this operation.",overwrite:"Overwrite",rename:"Rename",edit:"Edit",editTip:"running...",apply:"Apply",cancel:"Cancel"},operation:{invalid_url:"Invalid URL: The URL passed in must be a string and begin with db://",exists_url:"Invalid URL: THE URL points to a resource that does not exist",readonly:"The destination path is not valid: the destination is a read-only folder",overwrite:"The file already exists. Overwrite it?"},importAsset:{metaExists:"The resource({name}) meta file already exists. Skip meta import. Please open it in preferences if necessary"},openAsset:{preferenceProgramWarning:"Please set the application in {preferences} -> {program} -> {scriptEditor} to better open the script"},createAsset:{title:"Create Asset",fail:{unknown:"Failed to create asset ({target}): unknown error",type:"Failed to create asset: the incoming asset type({type}) is not recognized",url:"Failed to create asset: the incoming address ({url}) is not recognized",exist:"Failed to create asset: file already exists",drop:"Failed to create a asset: the address ({target}) of the imported asset does not exist",toUrl:"Failed to create asset: the file path ({target}) should be limited in project folder.",uuid:"Failed to create the asset: unable to identify uuid of the url ({target})",content:"Failed to create the asset ({target}): file content format is not correct",readonly:"Failed to create the asset: cannot operate on a readonly asset in {target}"},warn:{overwrite:"The file already exists. Do you want to overwrite it?"}},createAssetTemplate:{title:"Create Asset Template",manageTemplate:"Manager Asset Template"},dropAsset:{overwrite:"Overwrite",reserve:"Keep two files",fail:{unknown:"Failed to import asset: unknown error",url:"Failed to import asset: incorrect destination address format, needing db://folder format",filepaths:"Failed to import asset: the imported assets is empty",readonly:"Failed to import asset: destination address is readonly"},warn:{overwrite:"The file already exists. Do you want to overwrite it?",sameway:"The following import maintains the same operation"}},saveAsset:{fail:{unknown:"Failed to save asset: unknown error",uuid:"Failed to save asset: unable to identify uuid",content:"Failed to save the asset: file content format is not correct",readonly:"Failed to save the asset: cannot operate on a readonly asset"}},saveAssetMeta:{fail:{unknown:"Failed to save asset META: unknown error",uuid:"Failed to save asset META: unable to identify uuid",content:"Failed to save asset META: file content format is not correct",readonly:"Failed to save the asset META: cannot operate on a readonly asset"}},copyAsset:{fail:{unknown:"Failed to copy asset: unknown error",url:"Failed to copy asset: invalid parameter",source:"Failed to copy asset: file does not exist at source address",target:"Failed to copy asset: target file already exists",include:"Failed to copy asset: source address cannot be contained by destination address",parent:"Failed to copy asset: the parent address of the destination address is incorrect",readonly:"Failed to copy asset: The parent address of the destination address is readonly",metauuid:"Failed to copy asset: cannot update a new uuid."}},moveAsset:{fail:{unknown:"Failed to move asset: unknown error",url:"Failed to move asset: invalid parameter",source:"Failed to move asset: source address does not exist",target:"Failed to move asset: destination address is not valid",exist:"Failed to move the asset: the same file already exists at the destination address",include:"Failed to move the asset: source address cannot be contained by destination address",parent:"Failed to move the asset: the parent address of the destination address is incorrect",readonly_source:"Failed to move the asset: the source address is readonly",readonly:"Failed to copy asset: The parent address of the destination address is readonly"},warn:{overwrite:"The file already exists. Do you want to overwrite it?"}},renameAsset:{fail:{source:"Failed to rename asset: source address does not exist",include:"Failed to move the asset: source address cannot be contained by destination address",parent:"Failed to move the asset: the parent address of the destination address is incorrect"},warn:{overwrite:"The file already exists. Do you want to overwrite it?"}},deleteAsset:{fail:{unknown:"Failed to delete asset: unknown error",url:"Failed to delete asset: invalid parameter",unexist:"Failed to delete asset: the file does not exist",readonly:"Failed to delete asset: the file is readonly"}},preferences:{log_level:"Log Level",log_level_debug:"All Messages",log_level_log:"Errors, Warnings and Logs",log_level_warn:"Errors and Warnings Only",log_level_error:"Errors Only",ignore_glob:"Ignore Files(Glob)",ignore_changed:"Ignore configuration",notice_reload_editor:"You need to restart the editor to use the new configuration",auto_scan:"Update resources automatically",auto_scan_info:"When auto-refresh is turned off, the editor will not check for external resource updates. If you need to update the resource status, please click the refresh button in the Assets panel.",autoOverwriteMeta:"Automatically overwrite metadata on import",autoOverwriteMetaTooltip:"When the imported resource has a meta and conflicts with the local resource, it is automatically overwritten",flagReimportCheck:"Optimal scheduling strategy",flagReimportCheckTooltip:"Use policies to optimize the import process and reduce overhead",defaultImageMeta:"Default import image type",defaultMeta:"Default import asset type settings",defaultMetaTip:"This option allows users to edit default import asset types for different file format. After update the settings, all new assets imported would follow the new rules. Existing assets in the project would not update their type."},importers:{glTF:{glTF_asset_group_mesh:"mesh",glTF_asset_group_animation:"animation",glTF_asset_group_node:"node",glTF_asset_group_skin:"skin",glTF_asset_group_sampler:"texture-sampler",glTF_asset:"{group}[{index}]({name})",glTF_asset_no_name:"{group}[{index}]",unsupported_alpha_mode:"Alpha mode {mode} in {material} is not supported",unsupported_texture_parameter:"{type} value {value} of {sampler} used by {texture} is not supported",texture_parameter_min_filter:"min-filter",texture_parameter_mag_filter:"mag-filter",unsupported_channel_path:"Channel type ${path} in channel[{channel}] of {animation} is not supported, the channel is ignored",reference_skin_in_different_scene:"The {node} and its referenced {skin} are live in different scenes.",disallow_cubic_spline_channel_split:"Channel[{channel}] of {animation} use cubic-spline-interpolation, the animation split is not valid on this kind of interpolation",failed_to_calculate_tangents_due_to_lack_of_normals:"Failed to calculate tangents for sub-mesh[${primitive}] of {mesh} due to lack of normals",failed_to_calculate_tangents_due_to_lack_of_uvs:"Failed to calculate tangents for sub-mesh[${primitive}] of {mesh} due to lack of texture coordinates(uvs)",empty_morph:"Morph data of the ${primitive}-th primitive of mesh {mesh} exists but is empty.",unsupported_extension:"Unsupported glTF extension: {name}",failed_to_load_image:"Failed to load image {url}: {reason}",image_uri_should_be_file_url:"The URL of image must be file URL",failed_to_convert_tga:"Failed to convert TGA image"},fbx:{failed_to_convert_fbx_file:"Failed to convert fbx file {path}.",no_available_fbx_temp_dir:"Internal error: Cannot find a ascii-only path for fbx-temp-dir. You may try to solve this problem by place your project into english-character-only path.",fbx2glTF_exists_with_non_zero_code:`
The FBX2glTF process exited with non-zero code {code},
which indicates the process may not terminated successful.
This happened usually due to internal error of FBX2glTF tool itself when converting source FBX file.
Please report this error and related FBX file to Cocos team or to FBX2glTF author if possible.
Process output: {output}
`,fbxGlTfConv:{missing_dll:"Missing DLL. Seems like your system lack the the necessary runtime, please try to install the VC runtime: https://aka.ms/vs/16/release/vc_redist.x64.exe。",unsupported_inherit_type:"The following nodes specified unsupported inherit type [{type}]: [{nodes}].",multi_material_layers:"Mesh [{mesh}] uses multiple material layers.",skin_merge_error:"Bone [{node}] has different inverse bind matrix on different sub-meshes.",detached_joint_error:"Bone [{node}] is ignored since it's not located in the scene.",inconsistent_target_count:"Sub-meshes of mesh [{mesh}] have different number of blend shapes.",shall_not_be_texture:"The [{property}] property of material [{material}] is not allowed to be texture.",invalid_node_animation_range:"The duration({received} seconds) of animation on node {node} on take {take} exceeds the preset limit({limit} seconds).It seems to be abnormal, usually because there are negative frames or big interval in this FBX file. This animation won't be imported thereof."}},javascript:{transform_failure:"Failed to transform script {path}: {reason}"},image:{title:"Whether to switch the image type to SpriteFrame?",change_type_detail:"Whether or not to convert the {path} image resource that the {name} depends on to the SpriteFrame type that the {name} uses."},dragonbones_atlas:{texture_not_imported:"{texture} is not imported",texture_not_found:"Can not find texture {texture} for atlas {atlas}"}},contributions:{messages:{description:{asset_db_ready:"Broadcast when the resource database is ready",asset_db_close:"Broadcast when the resource database is closed",asset_db_asset_add:"Broadcast when a resource database is ready to be added",asset_db_asset_change:"Broadcast when a resource is modified",asset_db_asset_delete:"Broadcast when a resource is deleted",query_ready:"Check that the database has been started",create_asset:"Create a new asset",import_asset:"Import a file or folder into the database",copy_asset:"Copy an asset",move_asset:"Move an asset",rename_asset:"Rename an asset",delete_asset:"Delete an asset",open_asset:"Try to open an asset",save_asset:"Save the assets",save_asset_meta:"Save meta information about the asset",reimport_asset:"Reimport asset",refresh_asset:"Refresh the url location, delete files will be destroyed, new files will be imported",query_path:"Query the path of an asset",query_url:"Query the URL of an asset",query_uuid:"Query the UUID of an asset",query_assets:"Query assets against conditions",query_asset_info:"Query basic information about an asset",query_asset_meta:"Query meta information about an asset",generate_available_url:"Generate a new url available based on the url passed in"},doc:{asset_db_asset_add:"",query_ready:"@returns {boolean} Ready or not",create_asset:`
- url {string} The URL of the asset, for example: db://assets/abc.json
- content {string | null} Writes the contents of a string to a file, or creates a new folder if null
- option {AssetOperationOption}
    - option.overwrite {boolean} If overwrite is enforced, the default is false
    - option.rename {boolean} Default false if the conflict is automatically renamed

@returns {AssetInfo} Returns an asset information
                `,import_asset:`
- source {string} The absolute address of the local file
- target {string} The URL address to import into the database
- option {AssetOperationOption}
    - option.overwrite {boolean} If overwrite is enforced, the default is false
    - option.rename {boolean} Default false if the conflict is automatically renamed

@returns {AssetInfo} Returns an asset information
                `,copy_asset:`
- source {string} The URL path of the source resource, for example: db://assets/abc.json
- target {string} The URL of the destination location copied to
- option {AssetOperationOption}
    - option.overwrite {boolean} If overwrite is enforced, the default is false
    - option.rename {boolean} Default false if the conflict is automatically renamed

@returns {AssetInfo} Returns an asset information
                `,move_asset:`
- source {string} The URL path of the source resource that needs to be moved, for example: db://assets/abc.json
- target {string} The URL of the destination location moved to
- option {AssetOperationOption}
    - option.overwrite {boolean} If overwrite is enforced, the default is false
    - option.rename {boolean} Default false if the conflict is automatically renamed

@returns {AssetInfo} Returns an asset information
                `,delete_asset:`
- url {string} The URL of the assets

@returns {AssetInfo} Returns an asset information
                `,open_asset:`
- urlOrUUID {string} The asset URL or UUID that you are trying to open
                `,save_asset:`
- urlOrUUID {string} The URL or UUID of the asset
- content {string | Buffer} The content string of the resource. For typeArray, use the "buffer.from" transform.

@returns {AssetInfo} Returns an asset information
                `,save_asset_meta:`
- urlOrUUID {string} The URL or UUID of the asset
- content {string} The serialized content string of the asset Meta

@returns {AssetInfo} Returns an asset information
                `,reimport_asset:`
- urlOrUUID {string} The URL or UUID of the asset
                `,refresh_asset:`
- urlOrUUID {string} The URL or UUID of the asset
                `,query_path:`
- urlOrUUID {string} The URL or UUID of the asset

@returns {string} Returns the absolute disk path of an asset
                `,query_url:`
- uuid {string} The UUID of the asset

@returns {string} Returns the URL of an asset
                `,query_uuid:`
- url {string} The URL of the asset

@returns {string} Returns the UUID of an asset
                `,query_assets:`
- pattern? {string} Path matching pattern, glob format (db://**)

@returns {AssetInfo[]} Return resource array
                `,query_asset_info:`
- urlOrUUID {string} The URL or UUID of the asset

@returns {AssetInfo} Returns an asset information
                `,query_asset_meta:`
- urlOrUUID {string} The URL or UUID of the asset

@returns {AssetMeta} Returns a resource meta information
                `,generate_available_url:`
- url {string} The URL of the asset

@returns {string} Returns a new or the same URL as the parameter passed in
                `},example:{query_ready:`
await Editor.Message.request('asset-db', 'query-ready');
                `,create_asset:`
await Editor.Message.request('asset-db', 'create-asset', url, content);
                `,import_asset:`
await Editor.Message.request('asset-db', 'import-asset', path, url, { overwrite: true, rename: true });
                `,copy_asset:`
await Editor.Message.request('asset-db', 'copy-asset', sourceUrl, targetUrl, { overwrite: true, rename: true });
                `,move_asset:`
await Editor.Message.request('asset-db', 'move-asset', sourceUrl, targetUrl);
                `,delete_asset:`
await Editor.Message.request('asset-db', 'delete-asset', pathOrUrlOrUUID);
                `,open_asset:`
await Editor.Message.request('asset-db', 'open-asset', urlOrUUID);
                `,save_asset:`
await Editor.Message.request('asset-db', 'save-asset', urlOrUUID, content);
                `,save_asset_meta:`
await Editor.Message.request('asset-db', 'save-asset-meta', urlOrUUID, content);
                `,reimport_asset:`
await Editor.Message.request('asset-db', 'reimport-asset', urlOrUUID);
                `,refresh_asset:`
await Editor.Message.request('asset-db', 'refresh-asset', urlOrUUID);
                `,query_path:`
await Editor.Message.request('asset-db', 'query-path', urlOrUUID);
                `,query_url:`
await Editor.Message.request('asset-db', 'query-url', uuidOrPath);
                `,query_uuid:`
await Editor.Message.request('asset-db', 'query-uuid', urlOrUUID);
                `,query_assets:`
await Editor.Message.request('asset-db', 'query-assets', { ccType: 'cc.Script' });
                `,query_asset_info:`
await Editor.Message.request('asset-db', 'query-asset-info', urlOrUUIDOrPath);
                `,query_asset_meta:`
await Editor.Message.request('asset-db', 'query-asset-meta', urlOrUUID);
                `,generate_available_url:`
await Editor.Message.request('asset-db', 'generate-available-url', url);
                `,asset_db_ready:`
Editor.Message.broadcast('asset-db:ready');
                `,asset_db_close:`
Editor.Message.broadcast('asset-db:close');
                `,asset_db_asset_add:`
Editor.Message.broadcast('asset-db:asset-add');
                `,asset_db_asset_change:`
Editor.Message.broadcast('asset-db:asset-change');
                `,asset_db_asset_delete:`
Editor.Message.broadcast('asset-db:asset-delete');
                `}}},migrations:{creator:{autoTitle:"The .creator folder has been migrated success",autoMessage:"Please note that the editor has already migrated the files for you automatically, so please do not place files under the .creator file to avoid problems caused by repeated migrations.",message:"Since 3.8.3, the .creator folder has been deprecated, and the default-meta.json will be moved to the settings directory under the project. asset-template will be moved to the templates/new-asset directory under the project, so please submit the folder changes in time to avoid problems. Please submit the folder changes in time to avoid problems."},templates:{autoTitle:"Preview & build template folder has been migrated",autoMessage:"The editor has been automatically migrated templates folder for you, please do not place the file in the original template address, so as not to repeat the migration caused by the problem, please note that",message:"Since 3.8.3, the preview-template and build-template folders will be moved to the templates directory, so please submit the folder changes in a timely manner to avoid problems.",title:"Preview & build template location has changed"},failed:{title:"Failed to Automatically Migrate Template Files",message:"Please refer to the documentation for manual migration of template files to the specified location to avoid any impact on the project."}}};