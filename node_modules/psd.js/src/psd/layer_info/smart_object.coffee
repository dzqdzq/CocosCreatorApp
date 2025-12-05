LayerInfo = require '../layer_info.coffee'
Descriptor = require '../descriptor.coffee'

module.exports = class SmartObject extends LayerInfo
  @shouldParse: (key) -> key is 'SoLd'

  constructor: (layer, length) ->
    super(layer, length)

  parse: ->
    @identifier = @file.readString()
    @version = @file.readInt()
    @file.seek 4, true

    @data = new Descriptor(@file).parse()

    return @