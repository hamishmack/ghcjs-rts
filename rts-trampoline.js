$tr = {
    Jump : function(method, object, args) {
        this.method = method;
        this.object = object;
        this.args = args;
    },

    Call : function(method, object, args, rest) {
        this.method = method;
        this.object = object;
        this.args = args;
        this.rest = rest;
    },

    Catch : function(next, catcher) {
        this.next = next;
        this.catcher = catcher;
    },

    WithThread : function(withThread) {
        this.withThread = withThread;
    },

    Suspend : function(resume) {
        this.resume = resume;
    },

    Yield : function(next) {
        this.next = next;
    },

    Result : function(result) {
        this.value = result;
    }
}

$tr.Scheduler = {
    waiting : [],
    maxID   : 0,
    runWaiting : function() {
        while (this.waiting.length != 0) {
            var t = this.waiting[0];
            this.activeThread = t[0];
            this.waiting = Array.prototype.slice.call(this.waiting, 1, this.waiting.length);
            t[0]._run(t[1], t[2]);
        }
    },
    schedule : function(thread, retval, isException) {
        this.waiting.push([thread, retval, isException]);
    },
    start : function(r) {
        var thread = new $tr.Thread();
        this.schedule(thread, r, false);
        this.maxID++;
        thread.threadID = this.maxID;
        return thread;
    }
};

$tr.trace = function(msg) {
    console.log($tr.Scheduler.activeThread.threadID + " : " + msg);
};

$tr.traceThread = function(msg) {
    $tr.trace(msg);
};

$tr.traceMVar = function(msg) {
    $tr.trace(msg);
};

$tr.traceException = function(msg) {
    $tr.trace(msg);
};

$tr.Thread = function () {
  this._stack = [];
  this._stackMax = 10000;
  this._state = "run";
  this.waitingThreads = [];
}

$tr.Thread.prototype = {

  /* Returns true if the Thread has run to completion. */
  finished: function() {
    return this._state != "run";
  },
  
  /* Returns the final return value of the Thread.
   * If the Thread ended with an exception, throws the exception that
   * ended the Thread.
   * If the Thread is not yet complete, throws an exception.
   */
  value: function() {
    if (this._state == "return") {
      return this._value;
    } else if (this._state == "throw") {
      throw this._value;
    } else {
      throw "Thread is not complete";
    }
  },
  
  /* Suspends a running Thread until this Thread is complete. */
  join: function() {
    if (this._state == "run") {
      var _this = this;
      return new $tr.WithThread(function(currentThread) { 
          _this.waitingThreads.push(currentThread);
          return new $tr.Suspend(null);
        });
    } else {
      return new $tr.Result(this.value());
    }
  },
  
  popReturnHandler : function () {
    var handler = null;
    while(this._stack.length != 0 && handler == null) {
      handler = this._stack.pop()[0];
    }
    return handler;
  },

  popCatcher : function () {
    var catcher = null;
    while(this._stack.length != 0 && catcher == null) {
      catcher = this._stack.pop()[1];
    }
    return catcher;
  },
  
  _run : function(r, isException) {
    var traceLog = [];
    while (true) {
      // Handy for debug
      // traceLog.push(r);
      // if (traceLog.length > 100)
      //   traceLog = Array.prototype.slice.call(traceLog, 1, traceLog.length);

      try {
        if (this._stack.length > this._stackMax)
            throw "Stack Overflow"

        if (isException) {
          var catcher = this.popCatcher();
          if (catcher != null) {
            r = catcher(r);
          }
          else {
            this._state = "throw";
            this._value = r;
            this._signal();
            return;
          }
        }
        if (r instanceof $tr.Jump) {
          r = r.method.apply(r.object, r.args);
        }
        else if(r instanceof $tr.Call) {
          this._stack.push([r.rest, null]);
          r = r.method.apply(r.object, r.args);
        }
        else if(r instanceof $tr.Result) {
          var handler = this.popReturnHandler();
          if (handler != null) {
            r = handler(r.value);
          }
          else {
            this._state = "return";
            this._value = r.value;
            this._signal();
            return;
          }
        }
        else if(r instanceof $tr.Catch) {
          this._stack.push([null, r.catcher]);
          r = r.next;
        }
        else if(r instanceof $tr.WithThread) {
          r = r.withThread(this);
        }
        else if(r instanceof $tr.Suspend) {
          if(r.resume != null)
            this._stack.push([r.resume, null]);
          return;
        }
        else if(r instanceof $tr.Yield) {
          $tr.Scheduler.schedule(this, r.next, false);
          return;
        }
        // Must be just a plain return value
        else {
          var handler = this.popReturnHandler();
          if (handler != null) {
            r = handler(r);
          }
          else {
            this._state = "return";
            this._value = r;
            this._signal();
            return;
          }
        }
        isException = false;
      }
      catch(e) {
        isException = true;
        r = e;
      }     
    }
  },

  // Notify joining threads that this thread is complete.
  _signal: function() {
    for (var i = 0; i < this.waitingThreads.length; i++) {
      $scheduler.schedule(
        this.waitingThreads[i],
        this._value,
        this._state == "throw");
    }
  }
}

$hs.hscall = function () {
    if (this.arity == arguments.length) { // EXACT and THUNK rules
        return new $tr.Jump(this.evaluate, this, arguments);
    } else if (this.arity < arguments.length) { // CALLK and TCALL rules
        var remainingArguments = Array.prototype.slice.call(arguments, this.arity, arguments.length);
        arguments.length = this.arity;
        return new $tr.Call(this.evaluate, this, arguments,
            function (result) {return new $tr.Jump(result.hscall, result, remainingArguments)});
    } else if (arguments.length == 0) { // RETFUN
        return new $tr.Result(this);
    } else if (this instanceof $hs.Pap) { // PCALL rule, we can bypass this rule by building PAPs of PAPs
        return new $tr.Jump(this.evaluate, this, arguments);
    } else {
        // PAP2 rule and then RETFUN (jump to continuation)
        return new $tr.Result(new $hs.Pap (this, arguments));
    }
};

$hs.Pap = function(obj, args) {
    this.arity = obj.arity - args.length;
    this.object = obj;
    this.savedArguments = args;
};
$hs.Pap.prototype = {
    hscall: $hs.hscall,
    notEvaluated: false,
    evaluate: function () {
            var k = arguments.length;
            var n = this.savedArguments.length;
            var newArguments = new Array (k + n);
            for (var i = 0; i < n; i++)
                newArguments[i] = this.savedArguments[i];
            for (var i = 0; i < k; i++)
                newArguments[n + i] = arguments[i];
            return new $tr.Jump(this.object.hscall, this.object, newArguments);
    }
};

$hs.Func = function(a) {
    this.arity = a;
};
$hs.Func.prototype = {
    hscall: $hs.hscall,
    notEvaluated: false
};

$hs.Thunk = function() {};
$hs.Thunk.prototype = {
    hscall: $hs.hscall,
    arity: 0,
    notEvaluated: true,
    evaluate: function() {
        var _this = this;
        return new $tr.Call(this.evaluateOnce, this, [], function (res) {
            _this.evaluate = function () { return new $tr.Result(res); };
            return new $tr.Result(res);
        });
    }
};

$hs.Data = function (t) {
    this.tag = t;
};
$hs.Data.prototype = {
    hscall: $hs.hscall,
    arity: 0,
    notEvaluated: false,
    evaluate: function() {
        return new $tr.Result(this);
    }
};

$hs.force = function () {
    var f = arguments[0];
    var args = Array.prototype.slice.call(arguments, 1, arguments.length);
    var t = $tr.Scheduler.start(f.hscall.apply(f, args));
    $tr.Scheduler.runWaiting();
    return t.value();
};

$hs.Thread = {
    fork : function (a, s) {
        var t = $tr.Scheduler.start(a.hscall(s));
        $tr.traceThread("fork thread " + t.threadID);
        return new $tr.Result([s, t]);
    },    
    forkOn : function (n, a, s) {return fork(a,s);},
    yieldThread : function (s) {
        $tr.traceThread("yield thread");
        return new $tr.Yield(new $Result(s));
    },
    myThreadId : function (s) {
        return new $tr.WithThread(function (t) {
            return new $tr.Result([s, t]);
          });
    },
    noDuplicate : function (s) { return s; }
};

$hs.MutVar.atomicModify = function (a, b, s) {
    return new $tr.Call(b.hscall, b, [a.value], function (res) {
        a.value = res.data[0];
        return new $tr.Result([s, res.data[1]]);
      });
};

$hs.MVar = {
    newMVar : function(s) {
        $tr.traceMVar("newMVar");
        return [s, {value : null, waiting : []}];
    },
    take : function (a, s) {
        var takeWhenNotEmpty = function (_x) {
            $tr.traceMVar("take taking");
            var result = a.value;
            a.value = null;
            if (a.waiting.length != 0) {
                $tr.traceMVar("take waking waiters");
                var w = a.waiting[0];
                a.waiting = Array.prototype.slice.call(a.waiting, 1, a.waiting.length)
                $tr.Scheduler.schedule(w, null);
            }
            return new $tr.Result([s, result]);
        };
        if (a.value === null) {
            $tr.traceMVar("take waiting");
            return new $tr.WithThread(function (t) {
                a.waiting.push(t);
                return new $tr.Suspend(takeWhenNotEmpty);
              });
        }
        return takeWhenNotEmpty(null);
    },
    tryTake : function (a, s) {
        if (a.value === null) {
            $tr.traceMVar("tryTake nothing to take");
            return new $tr.Result([s, 0, null]);
        }
        $tr.traceMVar("tryTake taking");
        var result = a.value;
        a.value = null;
        if (a.waiting.length != 0) {
            $tr.traceMVar("tryTake waking waiters");
            var w = a.waiting[0];
            a.waiting = Array.prototype.slice.call(a.waiting, 1, a.waiting.length)
            $tr.Scheduler.schedule(w, null);
        }
        return new $tr.Result([s, 1, result]);
    },
    put : function (a, b, s) {
        var putWhenEmpty = function (_x) {
            $tr.traceMVar("put putting");
            a.value = b;
            if (a.waiting.length != 0) {
                $tr.traceMVar("put waking waiters");
                var w = a.waiting[0];
                a.waiting = Array.prototype.slice.call(a.waiting, 1, a.waiting.length)
                $tr.Scheduler.schedule(w, null);
            }
            return new $tr.Result(s);
        }
        if (a.value !== null) {
            $tr.traceMVar("put waiting");
            return new $tr.WithThread(function (t) {
                a.waiting.push(t);
                return new $tr.Suspend(putWhenEmpty);
              });
        }
        return putWhenEmpty(null);
    },
    same : function (a, b, s) {
        return [s, a === b];
    },
    isEmpty : function (a, b, s) {
        return [s, a.value === null];
    }
};

$hs.Exception = {
    tryCatch : function(a, b, s) {
        return new $tr.Catch(
            new $tr.Jump(a.hscall, a, [s]),
            function (e) { return new $tr.Jump(b.hscall, b, [e, s]); } );
    },
    raise : function(a) {
        $tr.traceException("raise");
        throw a;
    },
    raiseIO : function(a, s) {
        $tr.traceException("raiseIO");
        throw a;
    }
};

$hs.maskAsyncExceptions = function (a, s) {
    return new $tr.Jump(a.hscall, a, [s]);
};

$hs.maskAsyncExceptionszh = function (a, s) {
    return new $tr.Jump(a.hscall, a, [s]);
};

$hs.unmaskAsyncExceptions = function (a, s) {
    return new $tr.Jump(a.hscall, a, [s]);
};

$hs.unmaskAsyncExceptionszh = function (a, s) {
    return new $tr.Jump(a.hscall, a, [s]);
};

$hs.getMaskingStatezh = function (s) {
    return new $tr.Result([s, 0]);
};
