"use strict";module.exports={name:"Reference Image",description:"Reference Image",none:"None",none_tips:"Click here to add a reference image",edit:{header:"Image",position:"Position",scale:"Scale",opacity:"Opacity"},add_image:"add",del_image:"delete",show_tips:"Whether to display the reference image",dialog:{add_image_title:"Add reference image",del_image_message:"Whether to delete the {path} reference image",yes:"Confirm",cancel:"Cancel"},contributions:{messages:{"add-image":{description:"Add reference image",doc:"- paths {string[]} - Array of absolute paths to reference image resources",example:`
                await Editor.Message.request('reference-image', 'add-image', paths);
            `},"remove-image":{description:"Remove reference image",doc:"- paths {string[]} - Array of absolute paths to reference image resources (optional); if not provided, remove the current reference image",example:`
                await Editor.Message.request('reference-image', 'remove-image', paths);
            `},"switch-image":{description:"Switch reference image",doc:`
            - path {string[]} - Array of absolute paths to reference image resources
            - specifySceneUUID - Specify scene UUID (optional)
            `,example:`
            await Editor.Message.request('reference-image', 'switch-image', path);
            `},"set-image-data":{description:"Set reference image data",doc:`
            - key {string[]} - Reference image data parameters
                - path: string;    - Absolute path to the reference image
                - x: number;       - X offset
                - y: number;       - Y offset
                - sx: number;      - X scale
                - sy: number;      - Y scale
                - opacity: number; - Reference image opacity
            `,example:`
                await Editor.Message.request('reference-image', 'set-image-data', 'x', 10);
            `},"query-config":{description:"Request reference image configuration",doc:"@return {IReference}",example:"await Editor.Message.request('reference-image', 'query-config');"},"query-current":{description:"Request current reference image data",doc:"@return {IImageData}",example:`
                await Editor.Message.request('reference-image', 'query-current');
            `},refresh:{description:"Refresh reference image",doc:" ",example:`
                await Editor.Message.request('reference-image', 'refresh');
            `}}}};