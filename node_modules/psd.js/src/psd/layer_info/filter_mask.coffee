LayerInfo = require '../layer_info.coffee'

module.exports = class FilterMask extends LayerInfo
  @shouldParse: (key) -> key is 'FMsk'

  constructor: (layer, length) ->
    super(layer, length)

  parse: ->
    @color = @file.readSpaceColor()
    @opacity = @file.readShort()

