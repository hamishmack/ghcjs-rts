var $hs = {
    // treat signed integer as unsigned word, assuming complementary representation
    Word : {
      gt : function(a, b) {
        if ((a < 0 || b < 0) && (a >= 0 || b >= 0)) // Different signs
          return a < b;
        else
          return a > b;
      },
      ge : function(a, b) {
        if ((a < 0 || b < 0) && (a >= 0 || b >= 0)) // Different signs
          return a <= b;
        else
          return a >= b;
      },
      lt : function(a, b) {
        if ((a < 0 || b < 0) && (a >= 0 || b >= 0)) // Different signs
          return a > b;
        else
          return a < b;
      },
      le : function(a, b) {
        if ((a < 0 || b < 0) && (a >= 0 || b >= 0)) // Different signs
          return a >= b;
        else
          return a <= b;
      }
    },
    Int : { // binary operations supposed to work with 32bit words
      addCarry : function(a, b, c) {
         var word16addCarry = function(a, b, c) {
            var sum = a + b + c;
            var res = sum & 0xFFFF;
            var carry = sum >>> 16;
            return [res, carry];
         };
         var resl = word16addCarry(a & 0xFFFF, b & 0xFFFF, c);
         var resh = word16addCarry(a >>> 16, b >>> 16, resl[1]);
         return [(resh[0] << 16) | resl[0], resh[1]];
      },
      mul : function(a, b) {
         var al = a & 0xFFFF;
         var ah = a >>> 16;
         var bl = b & 0xFFFF;
         var bh = b >>> 16;
         var r = $hs.Int.addCarry(al * bh, bl * ah, 0)[0]
         return $hs.Int.addCarry(al * bl, (r & 0xFFFF) << 16, 0)[0];
      },
      mulIntMayOflo : function(a, b) {
        return a >>> 16 == 0 && b >>> 16 == 0;
      }
    },
    modules: {},
    alert: function (str) {
        window.alert(str);
    },
    logAny: function (c, str) {
        var el = document.getElementById('log');
        el.innerHTML = el.innerHTML + c + ": " + str + '<br/>\n';
    },
    logInfo: function (str) {
        $hs.logAny("INFO", str);
    },
    logError: function (str) {
        $hs.logAny("ERROR", str);
    },
    logDebug: function (str) {
        $hs.logAny("DEBUG", str);
    },
    MutVar : {
        newMutVar : function(a, s) {
            return [s, {value : a}];
        },
        read : function (a, s) {
            return [s, a.value];
        },
        write : function (a, b, s) {
            a.value = b;
            return [s];
        },
        same : function (a, b) {
            return a === b;
        }
    },
    _Array : {
        newArray : function(n, a, s) {
            var result = [];
            for (x = 0; x != n; x++)
              result[x] = a;
            return [s, result];
        },
        same : function (a, b) {
            return a === b;
        },
        read : function (a, n, s) {
            return [s, a[n]];
        },
        write : function (a, n, b, s) {
            a[n] = b;
            return [s];
        },
        sizeof : function (a, s) {
            return [s, a.length];
        },
        sizeofMut : function (a, s) {
            return [s, a.length];
        },
        index : function (a, n) {
            return a[n];
        },
        unsafeFreeze : function (a, s) {
            return [s, a];
        },
        unsafeThaw : function (a, s) {
            return [s, a];
        }
    },
    newByteArrayzh : function (n, s) {
        var result = new ArrayBuffer(n);
        return [s, result];
    },
    newPinnedByteArrayzh : function (n, s) {
        var result = new ArrayBuffer(n);
        return [s, result];
    },
    newAllignedPinnedByteArrayzh : function (n, k, s) {
        var result = new ArrayBuffer(n);
        return [s, result];
    },
    byteArrayContentszh : function (a) {
        return [a, 0];
    },
    sameMutableByteArrayzh : function (a, b) {
        return a === b;
    },
    unsafeFreezeByteArrayzh : function (a, s) {
        return [s, a];
    },
    sizeofByteArrayzh : function (a) {
        return new Uint8Array(a).length;
    },
    sizeofMutableByteArrayzh : function (a) {
        return new Uint8Array(a).length;
    },
    indexCharArrayzh : function (a, n) {
        return String.fromCharCode(new Uint8Array(a)[n]);
    },
    indexWideCharArrayzh : function (a, n) {
        return String.fromCharCode(new Uint32Array(a)[n]);
    },
    indexIntArrayzh : function (a, n) {
        return new Int32Array(a)[n];
    },
    indexWordArrayzh : function (a, n) {
        return new Uint32Array(a)[n];
    },
    indexAddrArrayzh : function (a, n) {
        throw "Not sure how to store Addr in a ByteArray";
    },
    indexFloatArrayzh : function (a, n) {
        return Float32Array(a)[n];
    },
    indexDoubleArrayzh : function (a, n) {
        return Float64Array(a)[n];
    },
    indexAddrArrayzh : function (a, n) {
        throw "Not sure how to store StablePtr in a ByteArray";
    },
    indexInt8Arrayzh : function (a, n) {
        return new Int8Array(a)[n];
    },
    indexInt16Arrayzh : function (a, n) {
        return new Int16Array(a)[n];
    },
    indexInt32Arrayzh : function (a, n) {
        return new Int32Array(a)[n];
    },
    indexInt64Arrayzh : function (a, n) {
        return new Int64Array(a)[n];
    },
    indexWord8Arrayzh : function (a, n) {
        return new Uint8Array(a)[n];
    },
    indexWord16Arrayzh : function (a, n) {
        return new Uint16Array(a)[n];
    },
    indexWord32Arrayzh : function (a, n) {
        return new Uint32Array(a)[n];
    },
    indexWord64Arrayzh : function (a, n) {
        return new Uint64Array(a)[n];
    },
    readCharArrayzh : function (a, n, s) {
        return [s, String.fromCharCode(new Uint8Array(a)[n])];
    },
    readWideCharArrayzh : function (a, n, s) {
        return [s, String.fromCharCode(new Uint32Array(a)[n])];
    },
    readIntArrayzh : function (a, n, s) {
        return [s, new Int32Array(a)[n]];
    },
    readWordArrayzh : function (a, n, s) {
        return [s, new Uint32Array(a)[n]];
    },
    readAddrArrayzh : function (a, n, s) {
        throw "Not sure how to store Addr in a ByteArray";
    },
    readFloatArrayzh : function (a, n, s) {
        return [s, Float32Array(a)[n]];
    },
    readDoubleArrayzh : function (a, n, s) {
        return [s, Float64Array(a)[n]];
    },
    readAddrArrayzh : function (a, n, s) {
        throw "Not sure how to store StablePtr in a ByteArray";
    },
    readInt8Arrayzh : function (a, n, s) {
        return [s, new Int8Array(a)[n]];
    },
    readInt16Arrayzh : function (a, n, s) {
        return [s, new Int16Array(a)[n]];
    },
    readInt32Arrayzh : function (a, n, s) {
        return [s, new Int32Array(a)[n]];
    },
    readInt64Arrayzh : function (a, n, s) {
        return [s, new Int64Array(a)[n]];
    },
    readWord8Arrayzh : function (a, n, s) {
        return [s, new Uint8Array(a)[n]];
    },
    readWord16Arrayzh : function (a, n, s) {
        return [s, new Uint16Array(a)[n]];
    },
    readWord32Arrayzh : function (a, n, s) {
        return [s, new Uint32Array(a)[n]];
    },
    readWord64Arrayzh : function (a, n, s) {
        return [s, new Uint64Array(a)[n]];
    },
    writeCharArrayzh : function (a, n, v, s) {
        new Uint8Array(a)[n] = v.charCodeAt();
        return s;
    },
    writeWideCharArrayzh : function (a, n, v, s) {
        new Uint32Array(a)[n] = v.charCodeAt();
        return s;
    },
    writeIntArrayzh : function (a, n, v, s) {
        new Int32Array(a)[n] = v;
        return s;
    },
    writeWordArrayzh : function (a, n, v, s) {
        new Uint32Array(a)[n] = v;
        return s;
    },
    writeAddrArrayzh : function (a, n, v, s) {
        throw "Not sure how to store Addr in a ByteArray";
    },
    writeFloatArrayzh : function (a, n, v, s) {
        Float32Array(a)[n] = v;
        return s;
    },
    writeDoubleArrayzh : function (a, n, v, s) {
        Float64Array(a)[n] = v;
        return s;
    },
    writeAddrArrayzh : function (a, n, v, s) {
        throw "Not sure how to store StablePtr in a ByteArray";
    },
    writeInt8Arrayzh : function (a, n, v, s) {
        new Int8Array(a)[n] = v;
        return s;
    },
    writeInt16Arrayzh : function (a, n, v, s) {
        new Int16Array(a)[n] = v;
        return s;
    },
    writeInt32Arrayzh : function (a, n, v, s) {
        new Int32Array(a)[n] = v;
        return s;
    },
    writeInt64Arrayzh : function (a, n, v, s) {
        new Int64Array(a)[n] = v;
        return s;
    },
    writeWord8Arrayzh : function (a, n, v, s) {
        new Uint8Array(a)[n] = v;
        return s;
    },
    writeWord16Arrayzh : function (a, n, v, s) {
        new Uint16Array(a)[n] = v;
        return s;
    },
    writeWord32Arrayzh : function (a, n, v, s) {
        new Uint32Array(a)[n] = v;
        return s;
    },
    writeWord64Arrayzh : function (a, n, v, s) {
        new Uint64Array(a)[n] = v;
        return s;
    },
    copyByteArrayzh : function (src, soff, dest, doff, count, s) {
        srcarray = new Uint8Array(src);
        destarray = new Uint8Array(dest);
        while(count != 0) {
            destarray[doff] = srcarray[soff];
            soff++;
            doff++;
            count--;
        }
        return s;
    },
    copyMutableByteArrayzh : function (src, soff, dest, doff, count, s) {
        srcarray = new Uint8Array(src);
        destarray = new Uint8Array(dest);
        while(count != 0) {
            destarray[doff] = srcarray[soff];
            soff++;
            doff++;
            count--;
        }
        return s;
    }
}

_hs_text_memcpy = function (dest, doff, src, soff, count) {
    srcarray = new Uint16Array(src);
    destarray = new Uint16Array(dest);
    while(count != 0) {
        destarray[doff] = srcarray[soff];
        soff++;
        doff++;
        count--;
    }
}

_hs_text_memcmp = function (a, aoff, b, boff, count) {
    aarray = new Uint16Array(a);
    barray = new Uint16Array(b);
    while(count != 0) {
        if( aarray[aoff] < barray[boff] )
            return -1;
        if( aarray[aoff] > barray[boff] )
            return 1;
        soff++;
        doff++;
        count--;
    }
    return 0;
}

$hs.Module = function () {};
$hs.Module.prototype = {
    init: function () {
        this.initBeforeDependencies();
    },
    loadDependencies: function () {
        for (var i = 0; i < this.dependencies.length; i++)
	    $hs.loadModule(this.dependencies[i]);
        this.initAfterDependencies();
    }
};
$hs.loadPaths = ["./"];
$hs.packages = [".", "ghc-prim", "integer-simple", "base"];
$hs.loadModule = function (moduleName) {
	    variableName = moduleName.replace(/z/g, "zz").replace(/\./g, "zi"); // Z-encoding string
	    modulePath = moduleName.replace(/\./g, "/") + ".js";
	    if ($hs.modules[variableName] != undefined) {
		return;
	    }

	    var code = null;
	    for (var i = 0; i < $hs.loadPaths.length && code == null; i++) {
	        for (var j = 0; j < $hs.packages.length && code == null; j++) {
		    var path = $hs.loadPaths[i] + $hs.packages[j] + "/" + modulePath;
		    try {
		        var transport = new XMLHttpRequest();
		        transport.open("GET", path, false);
		        transport.send(null);
		        if (transport.status == 200 || transport.status == 0)
                            code = transport.responseText;
		    } catch (e) { }
	        }
            }
	    try {
		eval(code);
		$hs.modules[variableName].init();
	    } catch (e) {
		$hs.logError("Error evaluating module: " + moduleName + ":\n" + e);
		return false;
	    }
	    
	    return true;
};

$hs.fromHaskellString = function() {
          var res = "";
          var s = $hs.force.apply($hs, arguments);
          for (;;) {
            switch (s.tag) {
              case 1: // nil
                return res;
              case 2: // cons
                var chthunk = s.data[0];
                var sthunk = s.data[1];
                var ch = $hs.force(chthunk);
                res = res + ch.data[0];
                s = $hs.force(sthunk);
            }
          }
        };
$hs.fromHaskellInt = function() {
          var i = $hs.force.apply($hs, arguments);
          return i.data[0];
        };
$hs.fromHaskellIO = function() {
          var newArguments = [];
          for (var i = 0; i < arguments.length; i++)
            newArguments[i] = arguments[i];
          newArguments[arguments.length] = $hs.modules.GHCziPrim.hs_realWorldzh;
          var i = $hs.force.apply($hs, newArguments);
          return i[1];
        };
$hs.toHaskellInt = function(i) {
    var hsi = new $hs.Data(1);
    hsi.data = [(0 + i) & ~0];
    return hsi;
};
$hs.nil = function() {
    return "";
};
$hs.cons = function(x, xs) {
    return String.fromCharCode(x) + xs;
};

$hs.init = function() {
    $hs.modules.GHCziPrim = new $hs.Module();
    $hs.modules.GHCziPrim.dependencies = [];
    $hs.modules.GHCziPrim.initBeforeDependencies = function () {};
    $hs.modules.GHCziPrim.hs_realWorldzh = new $hs.Data(1);

    $hs.loadModule("GHC.Types"); // Is required for primitive operations
}


