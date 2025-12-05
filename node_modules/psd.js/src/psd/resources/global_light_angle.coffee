module.exports = class GlobalLight
  id: 1037
  name: 'globalLightAngle'

  constructor: (@resource) ->
    @file = @resource.file

  parse: ->
    @angle = @file.readInt()