(function() {
  var __slice = [].slice;

  (function($) {
    var Communicado, instances, methods;
    instances = {};
    methods = {
      fetch: function(options) {
        if (options == null) {
          options = {};
        }
        return instances[$(this).data("communicado-id")].collection.fetch(options);
      },
      resize: function() {
        return instances[$(this).data("communicado-id")].resize();
      },
      send: function(message) {
        if (message == null) {
          message = {};
        }
        return instances[$(this).data("communicado-id")].send(message);
      },
      destroy: function() {
        delete instances[$(this).data("communicado-id")];
        $(this).data("communicado-id", null);
        return this;
      }
    };
    Communicado = Backbone.View.extend({
      initialize: function(options) {
        _.bindAll(this, "render", "scroll_to_bottom");
        this.el = options.$el;
        this.message_view = options.view;
        this.events = options.events;
        this.template = options.template;
        this.collection = new options.list();
        this.session = options.session;
        this.flex_flag = false;
        this.collection.on('sync', this.render);
        if (options.debug) {
          this.collection.on('all', function(name) {
            return console.log(name);
          });
        }
        this.$el.addClass('communicado').html(options.template({}));
        this.$msgs = this.$el.find('.messages');
        return this.$el.loading();
      },
      scroll_to_bottom: function() {
        return this.$msgs.animate({
          scrollTop: this.$msgs.prop('scrollHeight') - this.$msgs.height()
        });
      },
      resize: function() {
        return $("#chat-messages").css("max-height", $(".cdo-container")[0].scrollHeight + 10);
      },
      render: function() {
        var at_bottom;
        at_bottom = this.$msgs.prop('scrollHeight') - this.$msgs.height() - this.$msgs.scrollTop() === 0;
        this.collection.each((function(_this) {
          return function(item) {
            if (!item.view) {
              item.view = new _this.message_view({
                model: item
              });
              return _this.$msgs.find(".cdo-container").append(item.view.render().el);
            }
          };
        })(this));
        this.resize();
        this.$el.loading('destroy');
        this.$msgs.loading('destroy');
        if (at_bottom) {
          this.scroll_to_bottom();
        }
        return this;
      },
      send: function(message_text) {
        var deferred, message;
        message = new this.collection.model({
          source: 'HOST',
          session: "/api/v1/chat_session/" + (this.session.get('id')),
          text: message_text
        });
        deferred = message.save();
        deferred.done((function(_this) {
          return function() {
            _this.collection.add(message);
            _this.render();
            return _this.scroll_to_bottom();
          };
        })(this));
        return deferred;
      }
    });
    return $.fn.communicado = function() {
      var init_options, others;
      init_options = arguments[0], others = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (init_options && methods[init_options]) {
        if (instances[$(this).data("communicado-id")] == null) {
          throw new Error("Communicado has not been initialized for this element.");
        }
        return methods[init_options].apply(this, others);
      }
      if (typeof init_options === "string" && (instances[$(this).data("communicado-id")] == null)) {
        throw new Error('Unknown method.');
      }
      if (!init_options) {
        throw new Error("Required options missing for initialization.");
      }
      if ($(this).data("communicado-id")) {
        throw new Error('Already initialized!');
      }
      $(this).each(function(i, el) {
        var communicado, options, _id;
        options = {
          el: el,
          $el: $(el),
          list: null,
          view: null,
          events: {},
          fetch_options: {},
          template: '',
          session: null,
          debug: false
        };
        $.extend(true, options, init_options);
        communicado = new Communicado(options);
        while (true) {
          _id = (((Math.random()) * 0x10000000) | 0).toString(16);
          if (instances[_id] == null) {
            break;
          }
        }
        $(this).data("communicado-id", _id);
        instances[_id] = communicado;
        return communicado.collection.fetch(options.fetch_options);
      });
      return this;
    };
  })(jQuery);

}).call(this);

//# sourceMappingURL=communicado.map