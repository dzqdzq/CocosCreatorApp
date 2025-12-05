Descriptor = require '../descriptor.coffee'

module.exports = class PathSelection
  id: 1088
  name: 'pathSelection'

  constructor: (@resource) ->
    @file = @resource.file

  parse: ->
    @file.seek 4, true
    @data = new Descriptor(@file).parse()
