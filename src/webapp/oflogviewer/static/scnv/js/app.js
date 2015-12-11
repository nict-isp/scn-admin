/*!
 * Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
 * GPL3, see LICENSE for more details.
 */
(function(window) {
    var SCNV = window.SCNV || (window.SCNV = {});
    var Graph = window.Graph;

    /**
     * アプリケーションのエントリポイント
     * インスタンス生成, コンポーネント間イベント, ログ処理を行う
     * @class SCNV.App
     * @constructor
     */
    SCNV.App = function() {
        var iconlist = {};
        $.ajax({
            url: "js/iconlist.json",
            datatype: "json"
        }).done(function(json) {
            iconlist = json;
            console.log("finished: reading iconlist.json", json);
        }).fail(function(e) {
            console.log("error: reading iconlist.json", e);
        });

        // app外部UI
        /**
         * デバッグダイアログを閉じる。
         * @method $("#stats").draggable().dblclick
         */
        $("#stats").draggable().dblclick(function() {
            $(this).hide();
        });
        /**
         * サービス連携の選択を解除する。
         * @method $(".clearOverlay").click
         */
        $(".clearOverlay").click(function() {
            overlayList.each(function(model) {
                model.set("selected", false);
            });
        });
        /**
         * 描画モードをトグルする。
         * @method $(".curveMode").click
         */
        $(".curveMode").click(function() {
            topologyView.toggleCurveMode();
        });

        /**
         * redis, mysql 側のデータの形式を揃えて
         * キューに追加。受信専用スレッドで実行。
         * @method append
         * @param {JSON} log ログデータ
         */
        this.append = function(log) {
            recvThread.push(function() {
                if (log.data.messageType) {
                    // message from redis
                    if (log.data.messageType === "commands") {
                        // commandsのvalue.commands要素はJSON化
                        try {
                            log.data.value.commands =
                                JSON.parse(log.data.value.commands);
                        } catch (e) {}
                    }
                    debugCtr.add("redis", log.data); // for debugging
                    alignedLogs.push(log.data);
                } else {
                    // message from mysql
                    // ログの平坦化
                    for (var i = 0; i < log.data.length; i++) {
                        var arr = log.data[i].value;
                        var type = log.data[i].messageType;
                        for (var j = 0; j < arr.length; j++) {
                            if (type === "commands") {
                                // redis側とフォーマットが異なるが
                                // mysql側のcommandsはもともと不要
                                continue;
                            }
                            var obj = {
                                messageType: type,
                                value: arr[j]
                            };
                            alignedLogs.push(obj);
                            debugCtr.add("mysql", obj); // for debugging
                        }
                    }
                }
            });
        };
        /** 
         * @method storedSize
         * @return ログ保持件数 
         */
        this.storedSize = function() {
            return alignedLogs.length;
        };
        /** 
         * @method interval
         * @param i {numeric}
         * @param j {numeric}
         */
        this.interval = function(i, j) {
            readThread.interval(i, j);
        };
        /** 
         * @method setFilterMode
         * @param b {boolean} on/off
         */
        this.setFilterMode = function(b) {
            filterMode = b;
        };
        /** 
         * @method setMaxLineWidth
         * @param w {numeric} 最大行数
         */
        this.setMaxLineWidth = function(w) {
            maxLineWidth = w;
        }

        // 各種スレッド
        var debugCtr = new MyUtil.DebugCounter();
        var alignedLogs = [];
        /**
         * 受信処理用スレッド
         * @property recvThread
         * @type MyUtil.Thread
         */
        var recvThread = new MyUtil.Thread({
            interval: 3,
            skip: 20
        }).start();
        /**
         * @property readThread
         * @type MyUtil.Thread
         */
        var readThread = new MyUtil.Thread({
            interval: 3,
            skip: 20,
            loopRunner: function(n) {
                var log = alignedLogs.shift();
                if (log) {
                    processMessage(log);
                    debugCtr.proc();
                    return false; // not end loop
                }
                return true; // end loop this time
            }
        }).start();
        /**
         * ストリーム表示用スレッド
         * @property streamThread
         * @type MyUtil.Thread
         */
        var streamThread = new MyUtil.Thread({
            interval: 100,
            skip: 100
        }).start();
        /**
         * @property heavyThread
         * @type MyUtil.Thread
         */
        var heavyThread = new MyUtil.Thread({
            interval: 100,
            skip: 10
        }).start();
        new MyUtil.Thread({
            interval: 1000,
            skip: null,
            loopRunner: function(n) {
                // デバッグカウンタの更新
                debugCtr.update();
                $("#stats").html(
                    SCNV.templates.debugCounter(debugCtr.toJSON())
                );
            }
        }).start();
        /**
         * @property colorMgr
         * @type SCNV.ColorManager
         */
        var colorMgr = new SCNV.ColorManager(); // 色管理
        /**
         * @property srvMgr
         * @type SCNV.ServiceManager
         */
        var srvMgr = new SCNV.ServiceManager(); // サービス管理

        // stream view 生成
        /**
         * @property trafficStream
         * @type SCNV.StreamView
         */
        var trafficStream = new SCNV.StreamView({
            el: "#trafficStream",
            capacity: 100,
            template: SCNV.templates.trafficChip
        });
        /**
         * @property commandStream
         * @type SCNV.StreamView
         */
        var commandStream = new SCNV.StreamView({
            el: "#commandStream",
            capacity: 100,
            template: SCNV.templates.commandChip
        });
        /**
         * @property overlayStream
         * @type SCNV.StreamView
         */
        var overlayStream = new SCNV.StreamView({
            el: "#overlayStream",
            capacity: 100,
            template: SCNV.templates.overlayChip
        });

        // button list 生成
        /**
         * @property locationList
         * @type SCNV.ButtonList
         */
        var locationList = new SCNV.ButtonList();
        /**
         * @property locationListView
         * @type SCNV.ButtonListView
         */
        var locationListView = new SCNV.ButtonListView({
            el: "#locationList",
            collection: locationList,
            template: SCNV.templates.button,
            sorting: true
        });
        /**
         * @property serviceList
         * @type SCNV.ButtonList
         */
        var serviceList = new SCNV.ButtonList();
        /**
         * @property serviceListView
         * @type SCNV.ButtonListView
         */
        var serviceListView = new SCNV.ButtonListView({
            el: "#serviceList",
            collection: serviceList,
            template: SCNV.templates.button
        });
        /**
         * @property overlayList
         * @type SCNV.OverlayDetailList
         */
        var overlayList = new SCNV.OverlayDetailList();
        /**
         * @property overlayListView
         * @type SCNV.ToggleButtonListView
         */
        var overlayListView = new SCNV.ToggleButtonListView({
            el: "#overlayList",
            collection: overlayList,
            template: SCNV.templates.button,
            newIcon: true
        });
        /**
         * @property overlayDetailListView
         * @type SCNV.OverlayDetailListView
         */
        var overlayDetailListView = new SCNV.OverlayDetailListView({
            el: "#overlayDetail",
            collection: overlayList,
            template: SCNV.templates.overlayDetail
        });
        /**
         * @property topology
         * @type Graph.Graph
         */
        var topology = new Graph.Graph();
        /**
         * @property topologyView
         * @type Graph.GraphView
         */
        var topologyView = new Graph.GraphView({
            model: topology,
            el: "#networkTopology"
        });
        /**
         * @property topologySwitchList
         * @type Graph.SwitchList
         */
        var topologySwitchList = topology.get("switchList");
        /**
         * @property topologyRouteList
         * @type Graph.RouteList
         */
        var topologyRouteList = topology.get("routeList");
        /**
         * @property topologyNodeList
         * @type Graph.NodeList
         */
        var topologyNodeList = topology.get("nodeList");
        /**
         * @property topologyPathList
         * @type Graph.PathList
         */
        var topologyPathList = topology.get("pathList");
        /**
         * @property filterMode
         * @type boolean
         * @default false
         */
        var filterMode = false;
        /**
         * @property maxLineWidth
         * @type numeric
         * @default 1000
         */
        var maxLineWidth = 1000;

        /**
         * サービス一覧の要素をクリック時、サービス連携を選択
         * @method serviceListView.on("clicked", function(e))
         */
        serviceListView.on("clicked", function(e) {
            var sid = $(e.currentTarget).data("id");
            overlayList.each(function(model) {
                if (model.hasService(sid)) {
                    model.set({
                        "selected": true
                    });
                }
            });
        });

        /**
         * サービス連携一覧の要素を選択時、色を更新
         * @method overlayList.on("change:selected", function(m))
         */
        overlayList.on("change:selected", function(m) {
            var selected = overlayList.where({
                selected: true
            });

            // 色の決定
            colorMgr.updateColors(selected);

            // 連携一覧に配色
            _.each(selected, function(s) {
                var oid = s.get("id");
                var hue = colorMgr.hueByOid(oid);
                s.setColors([
                    [hue, 1.0, 0.5],
                    [hue, 0.9, 0.7]
                ]);
            });
            // トポロジー側、パスに配色
            topologyPathList.each(function(path) {
                var pid = path.get("id");
                if (colorMgr.pidSelected(pid)) {
                    path.set({
                        "selected": true,
                        "hue1": colorMgr.hueByPid(pid)
                    });
                } else {
                    path.set({
                        "selected": false,
                        "hue1": 0
                    });
                }
            });
        });
        /**
         * サービス一覧: 要素ホバー時のイベント
         * ・オーバーレイ、ロケーション、ノードのモデルhovered
         * @method serviceListView.on("hovered", function(e, args))
         */
        serviceListView.on("hovered", function(e, args) {
            var sid = args.view.$el.data("id");
            var b = args.value;
            overlayList.each(function(model) {
                if (model.hasService(sid)) {
                    model.set({
                        "hovered": b
                    });
                }
            });
            var location = locationList.get(sid);
            if (location) {
                location.set("hovered", b);
                var ip = location.get("ip");
                _.each(topologyNodeList.where({
                    ip: ip
                }), function(m) {
                    m.set("hovered", b);
                });
            }
        });
        /**
         * オーバーレイ一覧の要素ホバー時のイベント
         * ・サービス、ロケーション、ノードのモデルhovered
         * @method overlayListView.on("hovered", function(e, args))
         */
        overlayListView.on("hovered", function(e, args) {
            var oid = args.view.model.get("id");
            //	var oid = args.view.$el.data("id");
            var overlay = overlayList.get(oid);
            var b = args.value;
            _.each(overlay.get("serviceList"), function(sid) {
                var service = serviceList.get(sid);
                if (service) {
                    service.set("hovered", b);
                }
                var location = locationList.get(sid);;
                if (location) {
                    location.set("hovered", b);
                    var ip = location.get("ip");
                    _.each(topologyNodeList.where({
                        ip: ip
                    }), function(m) {
                        m.set("hovered", b);
                    });
                }
            });
        });
        /**
         * オーバーレイ詳細一覧の要素ホバー時のイベント
         * ・サービス、ロケーション、ノードのモデルhovered
         * @method overlayDetailListView.on("hovered", function(e, args))
         */
        overlayDetailListView.on("hovered", function(e, args) {
            var oid = args.view.model.get("id");
            var overlay = overlayList.get(oid);
            var b = args.value;
            _.each(overlay.get("serviceList"), function(sid) {
                var service = serviceList.get(sid);
                if (service) {
                    service.set("hovered", b);
                }
                var location = locationList.get(sid);;
                if (location) {
                    location.set("hovered", b);
                    var ip = location.get("ip");
                    _.each(topologyNodeList.where({
                        ip: ip
                    }), function(m) {
                        m.set("hovered", b);
                    });
                }
            });
        });

        /**
         * ロケーション一覧の要素ホバー時のイベント
         * @method locationListView.on("hovered", function(e, args))
         */
        locationListView.on("hovered", function(e, args) {
            var sid = args.view.$el.data("id");
            var b = args.value;
            var service = serviceList.get(sid);
            if (service) {
                service.set("hovered", b);
            }
            var location = locationList.get(sid);;
            if (location) {
                location.set("hovered", b);
                var ip = location.get("ip");
                _.each(topologyNodeList.where({
                    ip: ip
                }), function(m) {
                    m.set("hovered", b);
                });
            }
        });


        var test = {
            arr: []
        };
        /**
         * メッセージ処理
         * @method processMessage
         * @param msg {JSON} メッセージ：messageTypeおよびvalueを持つ処理単位
         * @example
         *      messageType: overlay サービス連携に関するメッセージ
         *      value: {
         *          Uid: オーバーレイ名
         *          Rule: メッセージ種別（r0～r7,dr,cr）
         *          Value: メッセージ詳細
         *          Code: DSNルール実行ログ
         *      }
         * @example
         *      messageType: services サービスに関するメッセージ
         *      value: {
         *          node_id: ノードID
         *          service_name: サービス名
         *          mode: 追加か、削除か
         *      }
         * @example
         *      messageType: traffics サービスパストラフィックに関するメッセージ
         *      value: {
         *          path_id: サービスパスID
         *          traffic: サービスパストラフィック
         *      }
         * @example
         *      messageType: commands ネットワーク制御コマンドに関するメッセージ
         *      value: {
         *          type: コマンドタイプ
         *          [src]: 送信元に関する情報
         *          [dst]: 送信先に関する情報
         *      }
         * @example
         *      messageType: paths ネットワークトポロジーのサービスパスに関するメッセージ
         *      value: {
         *          path_id: サービスパスID
         *          switch: 経由するスイッチのID
         *          src_node_mac: 送信元MACアドレス 
         *          dst_node_mac: 送信先MACアドレス
         *      }
         * @example
         *      messageType: switches ネットワークトポロジーのスイッチに関するメッセージ
         *      value: {
         *          switch_id: スイッチのID
         *          switch_ip: スイッチのIPアドレス
         *      }
         * @example
         *      messageType: nodes ネットワークトポロジーのノードに関するメッセージ
         *      value: {
         *          node_mac: ノードのマックアドレス
         *          node_ip: ノードのIPアドレス
         *          [node_alive]: ノードの死活情報
         *          switch_id: 接続するスイッチのID
         *      } 
         * @example
         *      messageType: routes ネットワークトポロジーの経路に関するメッセージ
         *      value: {
         *          src_switch_id: 送信元スイッチのID
         *          dst_switch_id: 送信先スイッチのID
         *          bandwidth: バンド幅
         *      }
         */
        var processMessage = function(msg) {
            // procedures
            var type = msg.messageType;
            var value = msg.value;
            console.log(type + ":" + JSON.stringify(value));

            if (type === "overlay") {
                var Value = value["Value"];
                var cmd = value["Rule"] + "";
                var id = value["Uid"] || (Value ? (
                    Value["add.uid"] || Value["recv.uid"] || Value["ppg.uid"]
                ) : null);

                // ストリームメッセージ追加　色付き
                streamThread.push(function() {
                    var c = colorMgr.cssByOid(id);
                    if ((c !== "inherit" || !filterMode) && value["Code"]) {
                        overlayStream.add({
                            "text": value["Code"],
                            "color": c,
                            "time": value["Timestamp"] * 1000,
                            "src": value["Src"],
                            "rule": cmd
                        });
                    }
                });
                if ("r4,r5".indexOf(cmd) !== -1) {
                    // not implemented
                    return;
                }
                /*	    // サービス連携詳細をblink
                	    if ("r0,r6".indexOf(cmd)!==-1) {
                		heavyThread.push(function() {
                		    var id = (cmd=="r0")?Value["recv.uid"]:Value["ppg.uid"];
                		    var sid = value["Src"];
                		    var overlay = overlayList.get(id);
                		    if (overlay&&overlay.get("selected")) {
                			overlay.trigger("blinkService",sid);
                		    }
                		});
                		return;
                	    }
                	    // サービス連携詳細をblink
                	    if ("s1,s2,s3".indexOf(cmd)!==-1) {
                		heavyThread.push(function() {
                		    var id = value["Uid"];
                		    var sid = value["Src"];
                		    var did = value["Dst"];
                		    var overlay = overlayList.get(id);
                		    if (overlay&&overlay.get("selected")) {
                			overlay.trigger("blinkPath",sid,did);
                		    }
                		});
                		return;
                	    }
                */
                // サービス一覧にサービス追加
                if (cmd === "r1") {
                    serviceList.add({
                        id: value["Src"],
                        label: value["Src"]
                    });
                    return;
                }
                // サービス一覧からサービス削除
                if (cmd === "r7") {
                    serviceList.remove({
                        id: value["Src"]
                    });
                    return;
                }
                // サービス連携一覧にサービス追加＆サービス連携詳細にルール追加
                if (cmd === "r2") {
                    var id = value["Value"]["add.uid"] + "";

                    if (!overlayList.get(id)) {
                        overlayList.add({
                            id: id,
                            label: id
                        });
                    }
                    overlayList.get(id).addRule(
                        //		    Value["add.no"], // TODO: 20130820 要修正
                        //Value["add.no"]+Value["add.src"]+Value["add.dst"],
                        Value["add.no"],
                        Value["add.src"],
                        Value["add.dst"]
                    );

                    setTimeout(function() {
                        heavyThread.push(function() {
                            overlayList.get(id).set({
                                selected: true
                            });
                        });
                    }, 0);

                    return;
                }
                // delete rules
                if (cmd === "r3") {
                    var id = value["Value"]["seq.uid"] + "";
                    if (overlayList.get(id)) {
                        overlayList.get(id).delRule(
                            Value["seq.no"]
                        );
                    }
                    return;
                }
                // create path
                if ("cr" === cmd) {
                    heavyThread.push(function() {
                        var id = value["Uid"] + "";
                        var s = Value["src.path"] + "";
                        var d = Value["dst.path"] + "";
                        var sService = value["Src"];
                        var dService = value["Dst"];

                        colorMgr.addPath(id, s);
                        colorMgr.addPath(id, d);

                        srvMgr.addPath(s, sService, dService);
                        srvMgr.addPath(d, dService, sService);

                        if (colorMgr.pidSelected(s) && topologyPathList.get(s)) {
                            topologyPathList.get(s).set({
                                "selected": true,
                                "hue1": colorMgr.hueByPid(s)
                            });
                        }
                        if (colorMgr.pidSelected(d) && topologyPathList.get(d)) {
                            topologyPathList.get(d).set({
                                "selected": true,
                                "hue1": colorMgr.hueByPid(d)
                            });
                        }
                    });
                    return;
                }
                if ("dr" === cmd) {
                    heavyThread.push(function() {
                        var id = value["Uid"] + "";
                        var s = Value["src.path"] + "";
                        var d = Value["dst.path"] + "";

                        colorMgr.removePath(id, s);
                        colorMgr.removePath(id, d);

                        topologyPathList.remove(s);
                        topologyPathList.remove(d);

                        srvMgr.delPath(s);
                        srvMgr.delPath(d);
                    });
                    return;
                }
                return;
                throw "undefined middleware message: " + JSON.stringify(value);
            }
            if (type === "services") {
                if (value["mode"] === 'ADD') {
                    locationList.add({
                        "id": value["service_name"] + "",
                        "ip": value["node_ip"] + "",
                        "label": value["node_ip"] + "&emsp;" + value["service_name"]
                    });
                } else {
                    locationList.remove({
                        "id": value["service_name"] + ""
                    });
                }
                return;
            }
            // ストリーム表示
            if (type === "traffics") {
                streamThread.push(function() {
                    var c = colorMgr.cssByPid(value["path_id"]);
                    var arr = srvMgr.getPath(value["path_id"]);
                    if ((c !== "inherit" || !filterMode) && arr) {
                        trafficStream.add({
                            "value": value["traffic"],
                            "color": c,
                            "src": arr[0],
                            "dst": arr[1]
                        });
                    }
                });
                return;
            }

            // コマンド、ストリーム表示
            if (type === "commands") {
                streamThread.push(function() {
                    var json = value["commands"];
                    var options = {
                        time: Date.parse(value.timestamp)
                    };
                    if (json.NAME === "INITIALIZE_REQUEST") {
                        options = $.extend(options, {
                            "type": "JOIN_SCN",
                            "src": json.listen_peer.ipaddr,
                            "dst": "requested."
                        });
                    } else if (json.NAME === "GET_NODES_REQUEST") {
                        /*
		    options = $.extend(options,{
			"type":"SEARCH",
			"src":json.listen_peer.ipaddr,
			"dst":"requested."
		    });
            */
                    } else if (json.NAME === "CREATE_BI_PATH_REQUEST") {
                        options = $.extend(options, {
                            "type": "CREATE_PATH",
                            "src": json.src.ipaddr + " bi " + json.dst.ipaddr,
                            "dst": "tos=" + json.app_id.tos + "."
                        });
                    } else if (json.NAME === "UPDATE_PATH_REQUEST") {
                        options = $.extend(options, {
                            "type": "UPDATE_PATH",
                            "src": json.path_id,
                            "dst": "from " + json.listen_peer.ipaddr,
                        });
                    } else if (json.NAME === "DELETE_BI_PATH_REQUEST") {
                        options = $.extend(options, {
                            "type": "DELETE_PATH",
                            "src": json.path_id,
                            "dst": "from " + json.listen_peer.ipaddr,
                        });
                    } else if (json.NAME === "DUMP_REQUEST") {
                        // do nothing.
                    } else {
                        options = $.extend(options, {
                            "type": "ERROR",
                            "src": "see console",
                            "dst": ""
                        });
                        console.log(json);
                    }
                    if (!options.src) {
                        //console.log(options);
                        console.log(json);
                    } else {
                        commandStream.add(options);
                    }
                });
                return;
            }
            if (type === "paths") {
                // なければパス追加
                heavyThread.push(function() {
                    var id = value["path_id"] + "";
                    /*
test.arr.push(id+" paths");
test.arr = test.arr.sort();
console.log(test);
		*/
                    topologyPathList.add({
                        id: id
                    });
                    topologyPathList.get(id).set({
                        snode: value["src_node_mac"],
                        dnode: value["dst_node_mac"],
                        switches: _.pluck(value["switch"], "switch_id")
                    });
                    if (colorMgr.pidSelected(id)) {
                        // パスが登録され、選択状態ならば表示
                        topologyPathList.get(id).set({
                            "selected": true,
                            "hue1": colorMgr.hueByPid(id)
                        });
                    }
                });
                return;
            }
            if (type === "switches") {
                // なければtopologyにswitch追加
                //	    console.log(value);
                topologySwitchList.add({
                    id: "" + value["switch_id"],
                    label: "" + value["switch_ip"]
                });
                return;
            }
            if (type === "nodes") {
                var nid = value["node_mac"] + "";
                var sid = value["switch_id"] + "";
                var id = "route@@" + nid + "@@" + sid;
                var icon = iconlist[value["node_ip"]] || {};
                //	    console.log(nid,sid,value["node_ip"],icon,id);

                if (topologyNodeList.get(id) == null) {
                    topologyNodeList.add({
                        id: nid,
                        parent: sid,
                        label: value["node_ip"] + "",
                        ip: value["node_ip"] + "",
                        texture: icon.image,
                        textureType: icon.type
                    });
                    topologyRouteList.add({
                        id: id,
                        sid: nid,
                        did: sid
                    });
                }
                _.each(topologyNodeList.where({
                    ip: value["node_ip"] + ""
                }), function(m) {
                    m.set("joined", value["node_alive"]);
                });

                return;
            }
            if (type === "routes") {
                heavyThread.push(function() {
                    // なければrouteを追加, bandwidth を更新
                    var sid = value["src_switch_id"] + "";
                    var did = value["dst_switch_id"] + "";
                    var id = "route@@" + sid + "@@" + did;
                    var bw = value["bandwidth"];
                    topologyRouteList.add({
                        id: id,
                        sid: sid,
                        did: did
                    });
                    var delDate = topologyRouteList.get(id).get("time");
                    var now = new Date();
                    if (delDate && (now - delDate > 20000)) {
                        var width = Math.max(0.1, Math.min(1, bw / maxLineWidth));
                        topologyRouteList.get(id).set("width", width);
                        //topologyRouteList.get(id).set("time", new Date());
                        //console.log("update path=" + topologyRouteList.get(id));
                    }
                });
                return;
            }
            return;
            throw "unknown type message";
        };
    };

})(window);
