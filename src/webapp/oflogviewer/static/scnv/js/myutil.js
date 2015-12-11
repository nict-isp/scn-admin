/*!
 * Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
 * GPL3, see LICENSE for more details.
 */

/**
 * ユーティリティ群
 * @class MyUtil
 */
(function(window) {
    var MyUtil = window.MyUtil || (window.MyUtil = {});

    /**
     * Thread helper: ループ実行/実行キュー用スレッド
     * @class MyUtil.Thread
     * @constructor
     * @extends Backbone.Model
     */
    MyUtil.Thread = Backbone.Model.extend({
        /**
         * 評価間隔
         * @property interval 
         * @type number
         * @default 100
         */
        /**
         * 評価時、実行回数
         * @property skip
         * @type number
         * @default 1
         */
        /**
         * ループ実行コールバック
         * @property loopRunner
         * @type function
         */
        defaults: function() {
            return {
                interval: 100,
                skip: 1,
                loopRunner: null,
                runnerQueue: []
            };
        },
        /**
         * @method initialize
         */
        initialize: function() {
            this.worker = new Worker("js/animator.js");
            var that = this;
            var loopRunner = this.get("loopRunner");
            if (loopRunner) {
                this.worker.onmessage = function(m) {
                    var skip = that.get("skip");
                    for (var i = 0; i < skip; i++) {
                        if (loopRunner()) {
                            return;
                        }
                    }
                };
            } else {
                this.worker.onmessage = function(m) {
                    var skip = that.get("skip");
                    var runnerQueue = that.get("runnerQueue");
                    for (var i = 0; i < skip; i++) {
                        var s = runnerQueue.shift();
                        if (s) {
                            s();
                        }
                    }
                };
            }
        },
        /**
         * @method push
         */
        push: function(runner) {
            this.get("runnerQueue").push(runner);
            return this;
        },
        /**
         * @method interval
         */
        interval: function(i, j) {
            this.worker.postMessage(i);
            if (j) {
                this.set("skip", j);
            }
            return this;
        },
        /**
         * @method count
         */
        count: function() {
            return this.get("runnerQueue").length;
        },
        /**
         * @method start
         */
        start: function() {
            //console.log(this.toJSON());
            this.worker.postMessage(this.get("interval"));
            return this;
        }
    });
    /**
     * Thread helper: 遅延実行用スレッド
     * @class MyUtil.DelayThread
     * @constructor
     * @extends Backbone.Model
     */
    MyUtil.DelayThread = Backbone.Model.extend({
        /**
         * 評価間隔
         * @property interval 
         * @type number
         * @default 100
         */
        /**
         * 評価時、実行回数
         * @property skip
         * @type number
         * @default 1
         */
        defaults: function() {
            return {
                interval: 100,
                skip: 1,
                runnerQueue: []
            };
        },
        /**
         * @method initialize
         */
        initialize: function() {
            this.worker = new Worker("js/animator.js");
            var skip = this.get("skip") || 1;
            var that = this;
            this.worker.onmessage = function(m) {
                var t = Date.now();
                var remain = [];
                var runnerQueue = that.get("runnerQueue");
                while (runnerQueue.length > 0) {
                    var s = runnerQueue.shift();
                    if (s[1] > t) {
                        remain.push(s);
                    } else {
                        s[0]();
                    }
                }
                that.set("runnerQueue", remain);
            };
        },
        /**
         * @method start
         */
        start: function() {
            this.worker.postMessage(this.get("interval"));
            return this;
        },
        /**
         * @method push
         */
        push: function(runner, delay) {
            delay = delay || 1;
            this.get("runnerQueue").push([runner, Date.now() + delay]);
            return this;
        },
        /**
         * @method interval
         */
        interval: function(i) {
            this.worker.postMessage(i);
            return this;
        },
        /**
         * @method count
         */
        count: function() {
            return this.get("runnerQueue").length;
        }
    });
    /**
     * 簡易JSONローダ
     * @method loadDump
     * @param {string[]} files 順にロードするファイル名
     * @param {function} callback ファイル読み込み時コールバック
     */
    MyUtil.loadDump = function(files, callback, finish) {
        function loadNext(j) {
            var fname = files[j];
            $.getJSON(fname, function(arr) {
                for (var i = 0; i < arr.length; i++) {
                    callback(arr[i]);
                }
                if (j < files.length - 1) {
                    loadNext(j + 1);
                }
            }).fail(function(e) {
                console.log("getJson error", e);
            }).complete(function(e) {
                if (j === files.length - 1 && finish) {
                    finish();
                }
            });
        }
        loadNext(0);
    };

    /**
     * @method Dumper
     */
    MyUtil.Dumper = function() {
        function errorHandler(e) {
            var msg = '';
            switch (e.code) {
                case FileError.QUOTA_EXCEEDED_ERR:
                    msg = 'QUOTA_EXCEEDED_ERR';
                    break;
                case FileError.NOT_FOUND_ERR:
                    msg = 'NOT_FOUND_ERR';
                    break;
                case FileError.SECURITY_ERR:
                    msg = 'SECURITY_ERR';
                    break;
                case FileError.INVALID_MODIFICATION_ERR:
                    msg = 'INVALID_MODIFICATION_ERR';
                    break;
                case FileError.INVALID_STATE_ERR:
                    msg = 'INVALID_STATE_ERR';
                    break;
                default:
                    msg = 'Unknown Error';
                    break;
            };
            console.error('Error: ' + msg);
        };
        // fix vender prefix
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

        this.createFileURL = function(fname, content) {
            var createFile = function(fs) {
                fs.root.getFile(fname, {
                    create: true
                }, function(fileEntry) {
                    fileEntry.createWriter(function(fileWriter) {
                        fileWriter.onwriteend = function(e) {
                            console.log('Write completed.');
                            fileWriter.onwriteend = null;
                            var blob = new Blob([content], {
                                "type": "text/plain;charset=UTF-8"
                            });
                            fileWriter.write(blob);
                        };
                        fileWriter.onerror = function(e) {
                            console.log('Write failed: ' + e.toString());
                        };
                        // Create a new Blob and write it to log.txt.
                        fileWriter.seek(fileWriter.length);
                        fileWriter.truncate(0);
                    }, errorHandler);
                    window.open(fileEntry.toURL(), fname);
                }, errorHandler);
            };
            window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024 /*5MB*/ ,
                createFile, errorHandler);
            return this;
        };
        var urlBuilder = function(i) {
            return i + ".json";
        };
        var saveSize = 0;
        var numFiles = 0;
        var store = [];
        var that = this;
        this.setPushSaveMode = function(size, b) {
            store = [];
            numFiles = 0;
            saveSize = size || 1;
            urlBuilder = b || urlBuilder;
            return this;
        };
        this.pushJSON = function(json) {
            store.push(json);
            if (store.length >= saveSize) {
                var copy = store;
                store = [];
                that.createFileURL(urlBuilder(numFiles), JSON.stringify(copy));
                numFiles += 1;
            }
        };
    };

    /**
     * Log counter for debugging
     */
    var MessageTypes = {
        "commands": 0,
        "overlay": 0,
        "paths": 0,
        "routes": 0,
        "services": 0,
        "traffics": 0,
        "nodes": 0,
        "switches": 0,
        "others": 0,
        "overlay_types": {
            "r0": 0,
            "r1": 0,
            "r2": 0,
            "r3": 0,
            "r4": 0,
            "r5": 0,
            "r6": 0,
            "s1": 0,
            "s2": 0,
            "s3": 0,
            "cr": 0,
            "others": 0
        },
        "commands_types": {
            "INSERT": 0,
            "SEARCH": 0,
            "CREATE_SERVICE_PATH": 0,
            "others": 0
        }
    };

    /**
     * @class MyUtil.DebugCounter
     * @constructor
     * @extends Backbone.Model
     */
    MyUtil.DebugCounter = Backbone.Model.extend({
        /**
         * @property redis
         * @type Object
         */
        /**
         * @property mysql
         * @type Object
         */
        /**
         * @property example
         * @type Object
         */
        /**
         * @property stats
         * @type Object
         */
        defaults: function() {
            return {
                redis: JSON.parse(JSON.stringify(MessageTypes)),
                mysql: JSON.parse(JSON.stringify(MessageTypes)),
                example: JSON.parse(JSON.stringify(MessageTypes)),
                stats: {
                    recv: 0,
                    proc: 0,
                    recv_ps: 0,
                    proc_ps: 0,
                    recv_ctr: 0,
                    proc_ctr: 0,
                    ptime: Date.now()
                }
            };
        },
        /**
         * @method initialize 
         */
        initialize: function() {},
        /**
         * @method add
         * @param {string} targetName
         * @param {number} l
         */
        add: function(targetName, l) {
            var target = this.get(targetName);
            if (target.hasOwnProperty(l.messageType)) {
                target[l.messageType] += 1;
                if (l.messageType === "overlay") {
                    if (target.overlay_types.hasOwnProperty(l.value.Rule)) {
                        target.overlay_types[l.value.Rule] += 1;
                    } else {
                        target.overlay_types["others"] += 1;
                    }
                }
                if (l.messageType === "commands") {
                    if (target.commands_types.hasOwnProperty(l.value.commands.NAME)) {
                        target.commands_types[l.value.commands.NAME] += 1;
                    } else {
                        target.commands_types["others"] += 1;
                    }
                }
            }
            this.get("stats").recv += 1;
            this.get("stats").recv_ctr += 1;
        },
        /**
         * @method update
         */
        update: function() {
            var now = Date.now();
            var ellapsed = now - this.get("stats").ptime;
            this.set({
                "stats": {
                    recv: this.get("stats").recv,
                    proc: this.get("stats").proc,
                    recv_ps: this.get("stats").recv_ctr / ellapsed,
                    proc_ps: this.get("stats").proc_ctr / ellapsed,
                    recv_ctr: 0,
                    proc_ctr: 0,
                    ptime: now
                }
            });
        },
        /**
         * @method proc
         */
        proc: function() {
            this.get("stats").proc += 1;
            this.get("stats").proc_ctr += 1;
        }
    });

})(window);
