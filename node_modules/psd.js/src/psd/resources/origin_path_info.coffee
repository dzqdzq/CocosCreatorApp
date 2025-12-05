Descriptor = require '../descriptor.coffee'

module.exports = class OriginPathInfo
  id: 3000
  name: 'originPathInfo'

  constructor: (@resource) ->
    @file = @resource.file

  parse: ->
    @file.seek 4, true
    @data = new Descriptor(@file).parse()
