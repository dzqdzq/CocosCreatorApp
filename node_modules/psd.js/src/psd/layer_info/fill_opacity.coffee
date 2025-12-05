LayerInfo = require '../layer_info.coffee'

module.exports = class FillOpacity extends LayerInfo
  @shouldParse: (key) -> key is 'iOpa'

  parse: ->
    value = @file.readByte()
    opacity = Math.round value * 100 / 255
    unit = 'Percent'

    @data.opacity = opacity
    @data.unit = unit
    