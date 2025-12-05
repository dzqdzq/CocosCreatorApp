"use strict";module.exports={title:"Program Manager",description:"External Program Manager",defaultProgram:"Default Program",customProgram:"Custom Program",label:{script_editor:"Default Script Editor",picture_editor:"Default Picture Editor",browser:"Default Browser",commandArgument:"Command Argument"},tips:{quickArguments:"Click the button on the right to select the quick argument"},console:{noProgram:"The application {program} is not configured in the settings. Please check and ensure that the application is correctly added to the configuration.",noProgramPath:"The configured {program} path does not exist. Please go to Preferences -> Program Manager -> {program} to configure it.",programPathErr:"The configured {program} path({path}) cannot be found. Please go to Preferences -> Program Manager -> {program} to verify it.",programErr:"The requested application cannot be found.",urlErr:"Invalid URL protocol. Please ensure you are using the correct URL protocol."},messages:{description:{queryProgramInfo:"Query program info",execute:"Startup program"},doc:{queryProgramInfo:`
- program {string} The program key

@returns {IProgramInfo} Return program information, if no params, return all program information
            `,execute:`
- program {string} The program key
- args {Record<string, any>} Program startup arguments
            `}}};