// Generated by CoffeeScript 1.6.3
(function() {
  var ResourceManager, forceAbsolute, root;

  forceAbsolute = function(url) {
    if (!/^(https?|file):\/\//.test(url)) {
      url = document.baseURI.match(/^(.*)\//)[0] + url;
    }
    return url;
  };

  ResourceManager = (function() {
    function ResourceManager() {
      this.resourceDefs = {};
      this.callbacks = {};
      this.resources = {};
      this.loaded = 0;
      this.total = 0;
    }

    ResourceManager.prototype.add = function(shortName, filename, def, callback) {
      var typeSource, _base, _name;
      if (def == null) {
        def = {};
      }
      if (callback == null) {
        callback = null;
      }
      typeSource = 'explicit';
      if (def.type == null) {
        def.type = this.guessType(filename);
        typeSource = 'extension';
      }
      def.shortName = shortName;
      def.filename = forceAbsolute(filename);
      def.key = "" + def.type + "/" + filename;
      console.debug("Requesting resource '" + (cofgl.autoShortenFilename(def.filename)) + "' [type=" + def.type + ", from=" + typeSource + "]");
      if (callback && (this.resources[def.key] != null)) {
        if (shortName && (this.resourceDefs[shortName] == null)) {
          this.resourceDefs[shortName] = this.resources[def.key];
        }
        return callback(this.resources[def.key]);
      }
      this.resourceDefs[def.key] = def;
      delete this.resources[def.key];
      this.total++;
      if (callback != null) {
        ((_base = this.callbacks)[_name = def.key] != null ? (_base = this.callbacks)[_name = def.key] : _base[_name] = []).push(callback);
      }
      return this.triggerLoading(def.key);
    };

    ResourceManager.prototype.addFromList = function(resources) {
      var args, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = resources.length; _i < _len; _i++) {
        args = resources[_i];
        _results.push(this.add.apply(this, args));
      }
      return _results;
    };

    ResourceManager.prototype.guessType = function(filename) {
      if (/\.(png|gif|jpe?g)$/.test(filename)) {
        return 'image';
      }
      if (/\.texture$/.test(filename)) {
        return 'texture';
      }
      if (/\.glsl$/.test(filename)) {
        return 'shader';
      }
      return console.error("Could not guess type from resource " + filename);
    };

    ResourceManager.prototype.wait = function(callback) {
      var _base;
      if (this.doneLoading()) {
        return callback();
      } else {
        return ((_base = this.callbacks).__all__ != null ? (_base = this.callbacks).__all__ : _base.__all__ = []).push(callback);
      }
    };

    ResourceManager.prototype.triggerLoading = function(key) {
      var def,
        _this = this;
      def = this.resourceDefs[key];
      return this.loaders[def.type](this, def, function(obj) {
        var callback, callbacks, _i, _len;
        if (def.shortName != null) {
          _this.resources[def.shortName] = obj;
        }
        _this.resources[key] = obj;
        callbacks = _this.callbacks[key];
        delete _this.callbacks[key];
        _this.loaded++;
        if (callbacks) {
          for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
            callback = callbacks[_i];
            callback(obj);
          }
        }
        if (_this.doneLoading()) {
          return _this.notifyWaiters();
        }
      });
    };

    ResourceManager.prototype.doneLoading = function() {
      return this.loaded >= this.total;
    };

    ResourceManager.prototype.notifyWaiters = function() {
      var callback, callbacks, _i, _len, _results;
      callbacks = this.callbacks.__all__ || [];
      delete this.callbacks.__all__;
      _results = [];
      for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
        callback = callbacks[_i];
        _results.push(callback());
      }
      return _results;
    };

    ResourceManager.prototype.loaders = {
      image: function(mgr, def, callback) {
        var rv,
          _this = this;
        rv = new Image();
        rv.onload = function() {
          console.debug("Loaded image from '" + (cofgl.autoShortenFilename(def.filename)) + "' [dim=" + rv.width + "x" + rv.height + "] ->", rv);
          return callback(rv);
        };
        return rv.src = def.filename;
      },
      shader: function(mgr, def, callback) {
        return cofgl.loadShader(def.filename, function(shader) {
          return callback(shader);
        });
      },
      texture: function(mgr, def, callback) {
        var imageFilename,
          _this = this;
        imageFilename = def.image;
        if (!imageFilename) {
          imageFilename = def.filename.match(/^(.*)\.texture$/)[1];
        }
        return mgr.add(null, imageFilename, {}, function(image) {
          return callback(cofgl.Texture.fromImage(image, def));
        });
      }
    };

    return ResourceManager;

  })();

  root = self.cofgl != null ? self.cofgl : self.cofgl = {};

  root.ResourceManager = ResourceManager;

}).call(this);
