LayerInfo = require '../layer_info.coffee'
parseEngineData = require '../engine_data.coffee'

module.exports = class TextEngineData extends LayerInfo
  @shouldParse: (key) -> key is 'Txt2'

  constructor: (layer, length) ->
    super(layer, length)
    @textEngineData = null

  parse: ->
    data = @file.read(@length)
    @textEngineData = parseEngineData(data)

  export: ->
    textEngineData: @textEngineData

