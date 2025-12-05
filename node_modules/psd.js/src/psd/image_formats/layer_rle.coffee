module.exports =
  parseByteCounts: ->
    for i in [0...@height()]
      if @header.version == 1
        @file.readShort()
      else
        @file.readInt()

  parseChannelData: ->
    @lineIndex = 0
    @decodeRLEChannel()
