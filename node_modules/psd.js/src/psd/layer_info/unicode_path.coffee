LayerInfo = require '../layer_info.coffee'
Descriptor = require '../descriptor.coffee'

module.exports = class UnicodePath extends LayerInfo
    @shouldParse: (key) -> key is 'pths'

    parse: ->
        @file.seek 4
        @data = new Descriptor(@file).parse()

        return @



