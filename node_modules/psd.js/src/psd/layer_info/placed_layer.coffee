LayerInfo = require '../layer_info.coffee'
Util = require '../util.coffee'
Descriptor = require '../descriptor.coffee'

module.exports = class UnicodeName extends LayerInfo
  @shouldParse: (key) -> key is 'PlLd'

  constructor: (layer, length) ->
    super(layer, length)

    @Trnf = []

  parse: ->
    @identifier = @file.readString()
    @version = @file.readInt()
    len = Util.pad2 @file.readByte()
    @Idnt = @file.readString(len)
    @PgNm = @file.parseInt();
    @totalPages = @file.parseInt();
    @Annt = @file.readInt();
    @Type = @file.readInt();

    @parseTransformInfo()

    @warpValue = @file.readInt()
    @file.seek 4, true

    @warpData = new Descriptor(@file).parse()

    return @

  parseTransformInfo: ->
    count = 8
    for i in [0...count]
      @Trnf.push @file.readDouble()