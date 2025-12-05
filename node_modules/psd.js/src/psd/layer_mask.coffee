{Module} = require 'coffeescript-module'
_ = require 'lodash'
Util = require './util.coffee'
Layer = require './layer.coffee'
LazyExecute = require './lazy_execute.coffee'

LAYER_INFO = {
  linkedLayer:            require('./layer_info/linked_layer.coffee')
  unicodePath:            require('./layer_info/unicode_path')
  textEngineData:         require('./layer_info/text_engine_data')
  filterMask:             require('./layer_info/filter_mask')
}

# The layer mask is the overarching data structure that describes both
# the layers/groups in the PSD document, and the global mask.
# This part of the document is ordered as such:
# 
# * Layers
# * Layer images
# * Global Mask
# 
# The file does not need to have a global mask. If there is none, then
# its length will be zero.
module.exports = class LayerMask extends Module
  @includes require('./layer/info.coffee')
  constructor: (@file, @header) ->
    @layers = []
    @mergedAlpha = false
    @globalMask = null

    @infoKeys = []
    @adjustments = {}

  skip: -> @file.seek @file.readInt(), true

  parse: ->
    if @header.version == 1
      maskSize = @file.readInt()
    else
      maskSize = @file.readLongLong()

    @layerEnd = maskSize + @file.tell()

    return if maskSize <= 0

    @parseLayers()
    @parseGlobalMask()

    # The layers are stored in the reverse order that we would like them. In other
    # words, they're stored bottom to top and we want them top to bottom.
    @layers.reverse()

    @parseAdditionalLayerInformation()

    @file.seek @layerEnd

  parseLayers: ->
    if @header.version == 1
      layerInfoSize = Util.pad2 @file.readInt()
    else
      layerInfoSize = Util.pad2 @file.readLongLong()

    layerEnd = @file.tell() + layerInfoSize

    if layerInfoSize > 0
      layerCount = @file.readShort()

      if layerCount < 0
        layerCount = Math.abs layerCount
        @mergedAlpha = true

      for i in [0...layerCount]
        @layers.push new Layer(@file, @header).parse()

      layer.parseChannelImage() for layer in @layers

    @file.seek layerEnd

  parseGlobalMask: ->
    length = @file.readInt()
    return if length <= 0

    maskEnd = Util.pad2 @file.tell() + length

    @globalMask = _({}).tap (mask) =>
      mask.overlayColorSpace = @file.readShort()
      mask.colorComponents = [
        @file.readShort() >> 8
        @file.readShort() >> 8
        @file.readShort() >> 8
        @file.readShort() >> 8
      ]

      mask.opacity = @file.readShort() / 16.0

      # 0 = color selected, 1 = color protected, 128 = use value per layer
      mask.kind = @file.readByte()

    @file.seek maskEnd

  parseAdditionalLayerInformation: ->
    while @file.tell() < @layerEnd
      @file.seek 4, true # sig

      key = @file.readString(4)
      length = Util.pad2 @file.readInt()
      pos = @file.tell()

      if length <= 0
        continue

      keyParseable = false
      for own name, klass of LAYER_INFO
        continue unless klass.shouldParse(key)

        # Once we find the right class to handle the layer info block, we create it and
        # register it with LazyExecute. This allows us to parse the PSD significantly
        # faster because we don't bother parsing the layer info block until it's accessed.
        i = new klass(@, length)

        @adjustments[name] = new LazyExecute(i, @file)
          .now('skip')
          .later('parse')
          .get()

        # We create a function that lets us easily access the data.
        unless @[name]?
          do (name) => @[name] = => @adjustments[name]

        # For debugging purposes, we store every key that we can parse.
        @infoKeys.push key
        keyParseable = true
        break

      # If we don't know how to parse this particular layer info block, we can skip it since we
      # know the end position of the data.
      @file.seek length, true if not keyParseable