PathRecord = require '../path_record.coffee'
module.exports = class Path
  id: 2000
  name: 'path'

  constructor: (@resource) ->
    @file = @resource.file
    @paths = []

  parse: ->
      numRecords = @resource.length / 26
      for i in [0...numRecords]
        record = new PathRecord(@file)
        record.parse()

        @paths.push record

  export: ->
      @paths