module.exports = class GlobalLight
  id: 1049
  name: 'globalLightAngle'

  constructor: (@resource) ->
    @file = @resource.file

  parse: ->
    @altitude = @file.readInt()