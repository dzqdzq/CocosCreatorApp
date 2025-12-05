LazyExecute = require '../lazy_execute.coffee'
Util = require '../util.coffee'

# This is an incredibly important object because the majority of the layer information
# is contained in layer info blocks. The keys of this object define how the layer info
# can be accessed. Each layer info block contains different data, so accessing the data
# within each differs from type to type.
#
# Here's an example of how to access some of this data:
#
# ``` coffeescript
# node = psd.tree().childrenAtPath('path/to/layer')[0]
# node.get('locked').allLocked
# node.get('metadata').data.layerComp
# node.get('typeTool').export()
# ```
LAYER_INFO = {
  artboard:               require('../layer_info/artboard.coffee')
  blendClippingElements:  require('../layer_info/blend_clipping_elements.coffee')
  blendInteriorElements:  require('../layer_info/blend_interior_elements.coffee')
  fillOpacity:            require('../layer_info/fill_opacity.coffee')
  gradientFill:           require('../layer_info/gradient_fill.coffee')
  layerId:                require('../layer_info/layer_id.coffee')
  layerNameSource:        require('../layer_info/layer_name_source.coffee')
  legacyTypetool:         require('../layer_info/legacy_typetool.coffee')
  locked:                 require('../layer_info/locked.coffee')
  metadata:               require('../layer_info/metadata.coffee')
  name:                   require('../layer_info/unicode_name.coffee')
  nestedSectionDivider:   require('../layer_info/nested_section_divider.coffee')
  objectEffects:          require('../layer_info/object_effects.coffee')
  sectionDivider:         require('../layer_info/section_divider.coffee')
  solidColor:             require('../layer_info/solid_color.coffee')
  typeTool:               require('../layer_info/typetool.coffee')
  vectorMask:             require('../layer_info/vector_mask.coffee')
  vectorOrigination:      require('../layer_info/vector_origination.coffee')
  vectorStroke:           require('../layer_info/vector_stroke.coffee')
  vectorStrokeContent:    require('../layer_info/vector_stroke_content.coffee')
  placedLayer:            require('../layer_info/placed_layer.coffee')
  linkedLayer:            require('../layer_info/linked_layer.coffee')
  smartObject:            require('../layer_info/smart_object.coffee')
}
# **PSB**, the following keys have a length count of 8 bytes
INFO_BYTES_8 = ['LMsk', 'Lr16', 'Lr32', 'Layr', 'Mt16', 'Mt32', 'Mtrn', 'Alph', 'FMsk', 'Ink2', 'FEid', 'FXid', 'PxSD']

module.exports =
  parseLayerInfo: ->
    # Layer info blocks are the last section in the layer, so we can continue until our
    # file cursor reaches the end of the layer.
    while @file.tell() < @layerEnd
      @file.seek 4, true # sig

      # Every layer info block is identified by a unique 4 character string.
      key = @file.readString(4)
      if @header.version == 2 and INFO_BYTES_8.includes key
        length = Util.pad2 @file.readLongLong();
      else
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

        if @externalFiles and key is 'lnk2'
          @externalFiles.push i.parse()
          break
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
