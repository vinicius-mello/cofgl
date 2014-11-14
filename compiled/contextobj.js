// Generated by CoffeeScript 1.6.3
(function() {
  var ContextObject, GLFlagContextObject, disabledDepthTest, root, stacks, withContext,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  stacks = {};

  ContextObject = (function() {
    function ContextObject() {}

    ContextObject.stack = null;

    ContextObject.withStack = function(name) {
      return this.stack = stacks[name] != null ? stacks[name] : stacks[name] = [];
    };

    ContextObject.hasStack = function() {
      return this.stack !== null;
    };

    ContextObject.prototype.bind = function() {};

    ContextObject.prototype.unbind = function() {};

    ContextObject.prototype.destroy = function() {};

    ContextObject.prototype.push = function() {
      var stack;
      stack = this.constructor.stack;
      stack.push(this);
      return this.bind();
    };

    ContextObject.prototype.pop = function() {
      return this.constructor.pop();
    };

    ContextObject.prototype.executeWithContext = function(callback) {
      if (this === this.constructor.top()) {
        return callback();
      }
      this.push();
      try {
        return callback();
      } finally {
        this.pop();
      }
    };

    ContextObject.top = function() {
      return this.stack[this.stack.length - 1];
    };

    ContextObject.pop = function() {
      var current, old;
      current = this.stack.pop();
      current.unbind();
      old = this.top();
      if (old) {
        return old.bind();
      }
    };

    return ContextObject;

  })();

  GLFlagContextObject = (function(_super) {
    __extends(GLFlagContextObject, _super);

    GLFlagContextObject.withStack('gl_flags');

    function GLFlagContextObject(funcs) {
      this.bind = funcs.bind;
      this.unbind = funcs.unbind;
    }

    return GLFlagContextObject;

  })(ContextObject);

  withContext = function(objects, cb) {
    var idx;
    idx = 0;
    while (idx < objects.length) {
      objects[idx++].push();
    }
    try {
      return cb();
    } finally {
      while (idx > 0) {
        objects[--idx].pop();
      }
    }
  };

  disabledDepthTest = new GLFlagContextObject({
    bind: function() {
      var gl;
      gl = cofgl.engine.gl;
      return gl.disable(gl.DEPTH_TEST);
    },
    unbind: function() {
      var gl;
      gl = cofgl.engine.gl;
      return gl.enable(gl.DEPTH_TEST);
    }
  });

  root = self.cofgl != null ? self.cofgl : self.cofgl = {};

  root.ContextObject = ContextObject;

  root.getContextObjectStacks = function() {
    return stacks;
  };

  root.withContext = withContext;

  root.disabledDepthTest = disabledDepthTest;

}).call(this);
