module.exports = class ResolutionInfo
  id: 1005
  name: 'resolutionInfo'

  constructor: (@resource) ->
    @file = @resource.file

  parse: ->
    # 32-bit fixed-point number (16.16)
    @h_res = @file.readInt() / 65536
    @h_res_unit = @file.readShort()
    @width_unit = @file.readShort()

    # 32-bit fixed-point number (16.16)
    @v_res = @file.readInt() / 65536
    @v_res_unit = @file.readShort()
    @height_unit = @file.readShort()

    @resource.data = @

  export: ->
    data = {}
    for key in ['h_res', 'h_res_unit', 'width_unit', 'v_res', 'v_res_unit', 'height_unit']
      data[key] = @[key]

    data