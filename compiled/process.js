// Generated by CoffeeScript 1.6.3
(function() {
  var Process, ProcessManager, ProcessProxy, commandQueue, executeCommand, findClass, instance, kickOff, makeLogger, root, startProcess, startWorkerSupport, workerBase,
    __slice = [].slice;

  if (typeof window !== "undefined" && window !== null) {
    workerBase = 'compiled/';
    startWorkerSupport = false;
  } else {
    workerBase = './';
    startWorkerSupport = true;
  }

  findClass = function(name) {
    var piece, rv, _i, _len, _ref;
    rv = self;
    _ref = name.split(/\./);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      piece = _ref[_i];
      rv = rv[piece];
    }
    return rv;
  };

  startProcess = function(options) {
    var args, callback, worker, _ref,
      _this = this;
    args = (_ref = options.args) != null ? _ref : [];
    callback = options.onNotification;
    worker = new Worker(workerBase + 'process.js');
    worker.addEventListener('message', function(event) {
      var data;
      data = event.data;
      if (data.type === 'notify') {
        if (callback != null) {
          return callback(data.value, data.done);
        }
      } else if (data.type === 'console') {
        return console[data.level].apply(console, ["%c[" + options.process + "]: ", 'background: #D4F2F3; color: #133C3D'].concat(__slice.call(data.args)));
      }
    });
    worker.addEventListener('error', function(event) {
      return console.error('Error in worker: ', event.message);
    });
    console.log("Starting process " + options.process + " as worker args=", args);
    worker.postMessage({
      cmd: '__init__',
      worker: options.process,
      args: args
    });
    return new ProcessProxy(worker, options.process, options.onBeforeCall);
  };

  ProcessProxy = (function() {
    function ProcessProxy(worker, processClass, onBeforeCall) {
      var callable, key, _fn, _ref,
        _this = this;
      this._worker = worker;
      _ref = findClass(processClass).prototype;
      _fn = function(key) {
        return _this[key] = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (typeof onBeforeCall === "function") {
            onBeforeCall(key, args);
          }
          this._worker.postMessage({
            cmd: key,
            args: args
          });
          return void 0;
        };
      };
      for (key in _ref) {
        callable = _ref[key];
        if (key === 'constructor' || key === 'run' || key === 'notifyParent') {
          continue;
        }
        _fn(key);
      }
    }

    return ProcessProxy;

  })();

  Process = (function() {
    function Process() {}

    Process.prototype.notifyParent = function(value, done) {
      if (done == null) {
        done = true;
      }
      return postMessage({
        type: 'notify',
        value: value,
        done: done
      });
    };

    Process.prototype.run = function() {};

    return Process;

  })();

  ProcessManager = (function() {
    function ProcessManager(workers, options) {
      var n, _i;
      this.workers = [];
      this.display = null;
      this.onNotification = options.onNotification;
      this.load = {};
      for (n = _i = 0; 0 <= workers ? _i < workers : _i > workers; n = 0 <= workers ? ++_i : --_i) {
        this.addWorker(options);
      }
    }

    ProcessManager.prototype.addWorker = function(options) {
      var num,
        _this = this;
      num = this.workers.length;
      this.load[num] = 0;
      return this.workers.push(startProcess({
        process: options.process,
        args: options.args,
        onBeforeCall: function(name, args) {
          _this.updateDisplay();
          cofgl.engine.pushThrobber();
          if (typeof options.onBeforeCall === "function") {
            options.onBeforeCall(name, args);
          }
          return _this.load[num] += 1;
        },
        onNotification: function(data, done) {
          return _this.handleWorkerResult(num, data, done);
        }
      }));
    };

    ProcessManager.prototype.getWorker = function() {
      var load, num, workers;
      workers = (function() {
        var _ref, _results;
        _ref = this.load;
        _results = [];
        for (num in _ref) {
          load = _ref[num];
          _results.push([load, num]);
        }
        return _results;
      }).call(this);
      workers.sort(function(a, b) {
        return a[0] - b[0];
      });
      return this.workers[workers[0][1]];
    };

    ProcessManager.prototype.handleWorkerResult = function(num, data, done) {
      cofgl.engine.popThrobber();
      if (done) {
        this.load[num] -= 1;
      }
      this.updateDisplay();
      return this.onNotification(data);
    };

    ProcessManager.prototype.updateDisplay = function() {
      var load, num, pieces, _ref;
      if (!this.display) {
        return;
      }
      pieces = [];
      _ref = this.load;
      for (num in _ref) {
        load = _ref[num];
        pieces.push("w(" + num + ") = " + load);
      }
      return this.display.setText(pieces.join(', '));
    };

    ProcessManager.prototype.addStatusDisplay = function(name) {
      this.display = cofgl.debugPanel.addDisplay(name);
      return this.updateDisplay();
    };

    return ProcessManager;

  })();

  root = self.cofgl != null ? self.cofgl : self.cofgl = {};

  root.Process = Process;

  root.ProcessManager = ProcessManager;

  root.startProcess = startProcess;

  if (startWorkerSupport) {
    importScripts('../lib/gl-matrix.js', 'perlin.js', 'world.js', 'worldgen.js');
    instance = null;
    commandQueue = [];
    makeLogger = function(level) {
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return postMessage({
          type: 'console',
          level: level,
          args: args
        });
      };
    };
    this.console = {
      log: makeLogger('log'),
      debug: makeLogger('debug'),
      warn: makeLogger('warn'),
      error: makeLogger('error')
    };
    kickOff = function() {
      var args, cmd, _i, _len, _ref, _results;
      setTimeout((function() {
        return instance.run();
      }), 0);
      _results = [];
      for (_i = 0, _len = commandQueue.length; _i < _len; _i++) {
        _ref = commandQueue[_i], cmd = _ref[0], args = _ref[1];
        _results.push(instance[cmd].apply(instance, args));
      }
      return _results;
    };
    executeCommand = function(cmd, args) {
      if (instance) {
        if (instance[cmd] == null) {
          console.error('Tried to call unexisting callback name=', cmd);
        }
        return instance[cmd].apply(instance, args);
      } else {
        return commandQueue.push([cmd, args]);
      }
    };
    self.addEventListener('message', function(event) {
      var cls, data;
      data = event.data;
      if (data.cmd === '__init__') {
        cls = findClass(data.worker);
        instance = (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return Object(result) === result ? result : child;
        })(cls, data.args, function(){});
        console.log('Started up args=', data.args);
        return kickOff();
      } else if (instance) {
        return executeCommand(data.cmd, data.args);
      }
    });
  }

}).call(this);
