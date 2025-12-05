LayerInfo = require '../layer_info.coffee'
Descriptor = require '../descriptor.coffee'
Util = require '../util.coffee'

module.exports = class LinkedLayer extends LayerInfo
  @shouldParse: (key) -> key is 'lnk2'

  constructor: (layer, length) ->
    super(layer, length)

  parse: ->
    end = @file.tell() + @length
    @files = []
    while @file.tell() < end
        obj = {}

        @file.seek 4, true
        length = 1 + Util.pad4 this.file.readInt()
        fileEnd = length + @file.tell()

        kind = @file.readString(4)
        version = @file.readInt()
        obj.uuid = @file.readString(this.file.readByte())
        obj.fileName = @file.readUnicodeString()
        obj.fileType = @file.readString(4)
        creator = @file.readString(4)
        @file.seek 4, true
        obj.datasize = @file.readInt()
        obj.openFile = @file.readBoolean()
        if obj.openFile is true
            @file.seek 4, true
            obj.openFile = new Descriptor(@file).parse()

        if kind is 'liFD'
            obj.fileData = @file.read(obj.datasize)
        
        if version >= 5
            obj.childId = @file.readUnicodeString()

        if version >= 6
            obj.modTime = @file.readDouble()
        
        if version >= 7
            obj.lockedState = @file.readBoolean()
        
        @files.push obj
        @file.seek fileEnd
    @file.seek end

    return @files