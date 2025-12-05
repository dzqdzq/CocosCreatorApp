# Each layer/group in the PSD document can have a mask, which is
# represented by this class. The mask describes which parts of the
# layer are visible and which are hidden.
module.exports = class Mask
  constructor: (@file) ->
    @top = 0
    @right = 0
    @bottom = 0
    @left = 0

  parse: ->
    # If there is no mask, then this section will have a size of zero
    # and we can move on to the next.
    @size = @file.readInt()
    return @ if @size is 0

    maskEnd = @file.tell() + @size

    # First, we parse the coordinates of the mask.
    @top = @file.readInt()
    @left = @file.readInt()
    @bottom = @file.readInt()
    @right = @file.readInt()

    # Each mask defines a couple of flags that are used as extra metadata.
    @defaultColor = @file.readByte()
    @flags = @file.readByte()

    if @size == 20
      @padding = @file.readShort()

    if @size >= 36
      @flags = @file.readByte()
      @defaultColor = @file.readByte()
      @top = @file.readInt()
      @left = @file.readInt()
      @bottom = @file.readInt()
      @right = @file.readInt()
  
    @width = @right - @left
    @height = @bottom - @top

    @relative = (@flags & 0x01) > 0
    @disabled = (@flags & (0x01 << 1)) > 0
    @invert = (@flags & (0x01 << 2)) > 0 # obsolete judge by defaultColor
    @external = (@flags & (0x01 << 3)) > 0 # indicates that the user mask actually came from rendering other data

    @file.seek maskEnd
    return @

  export: ->
    return {} if @size is 0

    top: @top
    left: @left
    bottom: @bottom
    right: @right
    width: @width
    height: @height
    defaultColor: @defaultColor
    relative: @relative
    disabled: @disabled
    invert: @invert
    padding: @padding
    external: @external
