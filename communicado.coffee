(($) ->
  instances = {}

  methods =
    # Fetch the collection
    fetch: (options={}) ->
      return instances[$(@).data("communicado-id")].collection.fetch(options)

    # Resize the messages window
    resize: ->
      return instances[$(@).data("communicado-id")].resize()

    # Send a message to the
    send: (message={}) ->
      return instances[$(@).data("communicado-id")].send(message)

    # Will delete the communicado instance, and remove
    # the attribute that references in the DOM
    destroy: ->
      delete instances[$(@).data("communicado-id")]
      $(@).data "communicado-id", null
      return this

  # Subclass Backbone.js's View object here.
  Communicado = Backbone.View.extend
    initialize: (options) ->
      _.bindAll this, "render", "scroll_to_bottom"

      @el = options.$el
      @message_view = options.view
      @events = options.events
      @template = options.template
      @collection = new options.list()
      @session = options.session

      # Boolean for keeping track of whether or not the chat messages element
      # has had its flexbox CSS value modified. We only have to do it once,
      # when it overflows the window, so for efficiency, we keep track of that
      # here.
      @flex_flag = false

      @collection.on 'sync', @render

      # Some useful debug code for event handling
      if options.debug
        @collection.on 'all', (name) -> console.log name

      @$el.addClass('communicado').html options.template({})

      # Convenience reference
      @$msgs = @$el.find('.messages')

      @$el.loading()

    scroll_to_bottom: ->
      @$msgs.animate scrollTop: @$msgs.prop('scrollHeight') - @$msgs.height()

    # Fuck
    resize: ->
      $("#chat-messages").css "max-height", $(".cdo-container")[0].scrollHeight + 10

    render: ->
      # If the user is watching the most recent messages, don't scroll, just append to the div
      # Otherwise, keep up with new messages
      at_bottom = @$msgs.prop('scrollHeight') - @$msgs.height() - @$msgs.scrollTop() is 0

      # Add each element in the collection to the DOM
      @collection.each (item) =>
        # We only want to add the item to the DOM if it's fresh
        # from the server. Skip it if it's already been added.
        unless item.view
          item.view = new @message_view
            model: item

          @$msgs.find(".cdo-container").append item.view.render().el


      @resize()

      @$el.loading('destroy')
      @$msgs.loading('destroy')

      if at_bottom
        @scroll_to_bottom()

      return this

    send: (message_text) ->
      message = new @collection.model
        source: 'HOST'
        session: "/api/v1/chat_session/#{ @session.get('id') }"
        text: message_text

      deferred = message.save()

      deferred.done =>
        @collection.add message
        @render()
        @scroll_to_bottom()

      return deferred

  $.fn.communicado = (init_options, others...)->
    # Call one of the plugin's methods
    if (init_options and methods[init_options])
      unless instances[$(this).data("communicado-id")]?
        throw new Error "Communicado has not been initialized for this element."

      return methods[init_options].apply this, others

    # If an unknown method is called, just raise an error
    if typeof init_options is "string" and not instances[$(this).data("communicado-id")]?
      throw new Error 'Unknown method.'

    unless init_options
      throw new Error "Required options missing for initialization."

    if $(this).data("communicado-id")
      throw new Error 'Already initialized!'

    $(this).each (i, el) ->
      options =
        el: el
        $el: $(el)
        list: null
        view: null
        events: {}
        fetch_options: {}
        template: ''
        session: null
        debug: false

      $.extend true, options, init_options

      communicado = new Communicado(options)

      # Create a unique id and hash it for later retrieval
      loop
        _id = (((Math.random())*0x10000000)|0).toString 16
        break unless instances[_id]?

      $(@).data "communicado-id", _id

      instances[_id] = communicado

      communicado.collection.fetch(options.fetch_options)

    return this
)(jQuery)
