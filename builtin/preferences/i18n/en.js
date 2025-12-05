"use strict";module.exports={title:"Preferences",description:"Editor preferences panel, which stores some editor global configuration and some extensions global configuration.",saving:"Saving",nav:{general:"General",laboratory:"Laboratory"},general:{language:"Language",step:"Number Step",theme:"Theme",wheel_enable:"Enable Scroll Wheel Value Control",wheel_enable_tips:"In input mode for numerical input boxes, you can use the mouse scroll wheel to modify the value.",themeColor:"Theme Color ",preview_ip:"Preview IP",server_port:"Preview server port number",serverPortHelpTips:"Save the setting to project to be able to distinguish between the server port of different projects"},laboratory:{about:`
        <p>1. The laboratory provides some new technical solutions or experimental features, you can turn each feature on with the on/off switch.</p>
        <p>2. Non-backward compatible changes or removal may occur in any future release. Use of the feature in production environments should be well tested and pay attention to the publish notes of future versions.</p>
        <p>3. We welcome users to try out and give us your feed backs via our forum, you can make those features more powerful and easier to use in your own projects.</p>`,create_terrain:"Enable terrain feature",new_add_component:"Add components using pop-ups",bake_feature:"Enable baking feature"},menu:{move_local:"Save to project",move_global:"Restore to global",position_info:"The configuration with the yellow flag is stored in the project. Otherwise, it is stored globally and Shared by all projects.",copyConfigKey:"Copy config key",importConfig:"Import Config",exportConfig:"Export Config",copyTabKey:"Copy tab key"},warn_info:{register_failed:"Extension registration preferences configuration failed"},contributions:{messages:{description:{open_settings:"Open the preferences panel",queryConfig:"Query preferences config",setConfig:"Set preferences config"},doc:{open_settings:`
- tab {string} Tab to be opened (name of the functional plugin)
- ...args: {any[]} Other parameters when opening the tab

@return {null}
                `,queryConfig:`
- name {string} Plugin or Category Name
- path? {string} Configuration Path
- type? {'default' | 'global' | 'local'} Configuration Type

@returns {any} Returns configuration data
                `,setConfig:`
- name {string} Plugin name
- path {string} Configuration path
- value {any} Configuration value
- type? {'default' | 'global' | 'local'} Configuration Type

@returns {boolean} Success of the setting
                `},example:{open_settings:"await Editor.Message.request('preferences', 'open-settings');",queryConfig:"await Editor.Message.request('preferences', 'query-config', 'preview', 'general', 'global');",setConfig:"await Editor.Message.request('preferences', 'set-config', 'preview', 'general.auto_refresh', false, 'global');"}}}};