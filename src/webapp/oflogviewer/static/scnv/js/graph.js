/*!
 * Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
 * GPL3, see LICENSE for more details.
 */
var Graph = Graph || {};

/**
 * ネットワークトポロジーを描画するためのクラス群
 * @class Graph
 * @constructor
 */
(function() {
    /**
     * ノードスイッチの配置: Baloon layout
     * ノード, スイッチのインスタンス追加時に呼び出し
     * @method layout
     * @static
     * @param switchList {Graph.SwitchList} 現在のスイッチリスト
     * @param nodeList {Graph.NodeList} 現在のノードリスト
     * @param routeList {Graph.RouteList} 現在の物理パスリスト
     */
    var layout = function(switchList, nodeList, routeList) {
        var that = this;
        // setup switch children
        switchList.each(function(e) {
            e.set({
                "children": []
            }, {
                silent: true
            });
        });
        nodeList.each(function(e) {
            var pid = e.get("parent");
            var sw = switchList.get(pid);
            if (sw) {
                var arr = sw.get("children");
                arr.push(e.get("id"));
                sw.set("children", arr);
            }
        });
        // update node/switch positions
        switchList.each(function(e, i) {
            //var a = i/switchList.size()*Math.PI*2.0;
            //var r = 0.14;
            var a = i / switchList.size() * 2 * Math.PI * 2.0;
            var r = 0.10;
            var x = Math.cos(a) * r;
            var y = Math.sin(a) * r;
            //TODO
            switch (e.attributes.label.match(/^\d+\.(\d+)\./)[1]) {
                case "75":
                    x += 0.18;
                    y -= 0.18;
                    break
                case "35":
                    y += 0.18;
                    break
                case "115":
                    x -= 0.18;
                    y -= 0.18;
                    break
            }
            e.set("position", [x, y]);

            var children = e.get("children");
            //TODO
            if (true) { // fair400
                var a0 = a - Math.PI / 10.0;
                var an = a + Math.PI / 10.0;
                var nc = children.length - 1;
                //var rc = 0.16;
                var rc = 0.05;

                //var line = 7;
                var line = 1;
                var no = 0;
            } else { // fair300
                var a0 = a - Math.PI / 2.5;
                var an = a + Math.PI / 2.5;
                var nc = children.length - 1;
                var rc = 0.16;

                var line = 5;
                var no = 0;
            }
            _.each(children, function(nid, j) {
                var ac = j / nc * (an - a0) + a0;
                if (!ac) {
                    ac = Math.PI * 0.5 + a0;
                }
                var cx = Math.cos(ac) * (rc + (no % line) * 0.01) + x;
                var cy = Math.sin(ac) * (rc + (no % line) * 0.01) + y;
                no++;
                nodeList.get(nid).set({
                    "position": [cx, cy],
                    "rotation": Math.PI / 2 + ac //Math.PI/2+c
                });
            });
        });
    };

    // Model
    /**
     * スイッチのモデル
     * @class Graph.Switch
     * @constructor
     * @extends Backbone.Model
     */
    Graph.Switch = Backbone.Model.extend({
        /**
         * スイッチのID
         * @property id
         * @type String
         */
        /**
         * 表示名
         * @property label
         * @type String
         */
        /**
         * TODO
         * @property parent
         * @default null
         */
        /**
         * ぶら下がっているノード
         * @property children
         * @type Array.
         * @default []
         */
        /**
         * 表示上のノード座標
         * @property position
         * @type Array.
         * @default [0,0]
         */
        defaults: function() {
            return {
                id: "nodeId",
                label: "otemachi",
                parent: null,
                children: [],
                position: [0, 0]
            };
        }
    });
    /**
     * スイッチのリスト
     * @class Graph.SwitchList
     * @constructor
     * @extends Backbone.Collection
     */
    Graph.SwitchList = Backbone.Collection.extend({
        /**
         * @property model
         * @type Graph.Switch
         */
        model: Graph.Switch
    });
    /**
     * ノードのモデル
     * @class Graph.Node
     * @constructor
     * @extends Graph.Switch
     */
    Graph.Node = Graph.Switch.extend({
        /**
         * マウスが接触していればtrue
         * @property hover
         * @type boolean
         * @default false
         */
        /**
         * サービスが参加していればtrue
         * @property joined
         * @type boolean
         * @default false
         */
        defaults: function() {
            return {
                hovered: false,
                joined: false
            };
        }
    });
    /**
     * ノードのリスト
     * @class Graph.NodeList
     * @constructor
     * @extends Backbone.Collection
     */
    Graph.NodeList = Backbone.Collection.extend({
        /**
         * @property model
         * @type Graph.NodeList
         */
        model: Graph.Node
    });
    /**
     * 物理パスのモデル
     * @class Graph.Route
     * @constructor
     * @extends Backbone.Model
     */
    Graph.Route = Backbone.Model.extend({
        /**
         * 物理パスのID（往復で異なる）
         * @property id
         * @type String
         */
        /**
         * 送信元のスイッチのID
         * @property sid
         * @type String
         */
        /**
         * 送信先のスイッチのID
         * @property did
         * @type String
         */
        /**
         * バンド幅
         * @property width
         * @type numeric
         */
        /**
         * 描画位置（開始座標、終了座標）
         * @property positions
         * @type Array.
         */
        defaults: function() {
            return {
                id: "routeId",
                sid: "startNodeId",
                eid: "endNodeId",
                width: 1,
                positions: [
                    [0, 0],
                    [1, 1]
                ]
            };
        }
    });
    /**
     * 物理パスのリスト
     * @class Graph.RouteList
     * @constructor
     * @extends Backbone.Collection
     */
    Graph.RouteList = Backbone.Collection.extend({
        /**
         * @property model
         * @type Graph.Route
         */
        model: Graph.Route
    });
    /**
     * サービスパスのモデル
     * @class Graph.Path
     * @constructor
     * @extends Backbone.Model
     */
    Graph.Path = Backbone.Model.extend({
        /**
         * サービスパスID
         * @property id
         * @type String
         */
        /**
         * TODO
         * @property target
         * @type 
         * @default null
         */
        /**
         * 送信元ノード
         * @property snode
         * @type 
         * @default null
         */
        /**
         * 送信先ノード
         * @property dnode
         * @type 
         * @default null
         */
        /**
         * 経由するスイッチのリスト
         * @property switches
         * @type Array.
         * @default []
         */
        /**
         * サービスパスの描画位置
         * @property positions
         * @type Array.
         * @default []
         */
        /**
         * サービスパスの表示中ならture
         * @property selected
         * @type boolean
         * @default false
         */
        /**
         * サービスパスの表示色
         * @property hue1
         * @type numeric
         * @default 0
         */
        /**
         * サービスパスの描画モード（1: 曲線）
         * @property curveMode
         * @type numeric
         * @default 1
         */
        defaults: function() {
            return {
                id: "",
                target: null,
                snode: null,
                dnode: null,
                switches: [],
                positions: [],
                selected: false,
                hue1: 0,
                curveMode: 1
            };
        }
    });
    /**
     * サービスパスのリスト
     * @class Graph.PathList
     * @constructor
     * @extends Backbone.Collection
     */
    Graph.PathList = Backbone.Collection.extend({
        /**
         * @property model
         * @type Graph.Path
         */
        model: Graph.Path
    });

    // View
    /**
     * ネットワークトポロジー画面、スイッチの描画クラス
     * @class Graph.SwitchView
     * @constructor
     * @extends Backbone.View
     */
    Graph.SwitchView = Backbone.View.extend({
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            var that = this;
            this.$el.html(SCNV.templates.switchLabel(
                this.model.toJSON()
            )).addClass("switchLabel").hide();

            /**
             * スイッチの描画オブジェクト
             * @property three
             * @type THREE.Object3D
             */
            this.three = ThreeUtil.switchBox();
            /**
             * 位置情報の変更を反映する。
             * @method listenTo(this.model, "change:position", function(m, p))
             * @param m {Graph.Switch} モデル
             * @param p {Array.} (x, y)座標
             */
            this.listenTo(this.model, "change:position", function(m, p) {
                that.three.position.set(p[0], p[1], 0);
                that.$el.show();
            });
            /**
             * ラベルを非表示する。
             * @method this.listenTo(this.model, "hideLabel", function(m, b)
             * @param m {Graph.Switch} モデル
             * @param b {boolean} 未使用
             */
            this.listenTo(this.model, "hideLabel", function(m, b) {
                that.$el.hide();
            });
            /**
             * ラベルを表示する。
             * @method listenTo(this.model, "updateLabel", function()
             */
            this.listenTo(this.model, "updateLabel", function() {
                var p = options.project(that.three);
                var w = that.$el.width();
                that.$el.css({
                    left: p[0] - w * 0.5 + "px",
                    top: p[1] - 20 + "px"
                }).show();
            });
        }
    });
    /**
     * ネットワークトポロジー画面、ノードの描画クラス
     * @class Graph.NodeView
     * @constructor
     * @extends Graph.SwitchView
     */
    var hoge = 0;
    Graph.NodeView = Graph.SwitchView.extend({
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            var that = this;
            this.$el.html(SCNV.templates.nodeLabel(
                this.model.toJSON()
            )).addClass("nodeLabel").hide();

            /**
             * ノードの描画オブジェクト
             * @property three
             * @type THREE.Object3D
             */
            this.three = new THREE.Object3D();
            if (false) { // fair環境向け、ダミーノードを活性に見せる
                if ((++hoge % 10) < 7) {
                    this.nodebox = ThreeUtil.nodeBox(0xffffff);
                } else {
                    this.nodebox = ThreeUtil.nodeBox(0x000000);
                }
            } else {
                this.nodebox = ThreeUtil.nodeBox(0x000000);
            }
            this.three.add(this.nodebox);
            if (this.model.get("texture")) {
                this.three.add(ThreeUtil.nodeTexture(
                    this.model.get("texture"),
                    this.model.get("textureType")
                ));
            }
            /**
             * 位置情報の変更を反映する。
             * @method listenTo(this.model, "change:position", function(m, p))
             * @param m {Graph.Node} モデル
             * @param p {Array.} (x, y)座標
             */
            this.listenTo(this.model, "change:position", function(m, p) {
                that.three.position.set(p[0], p[1], 0);
                that.three.rotation.z = that.model.get("rotation") || 0;
            });
            /**
             * サービスの参加状態に合わせて、ノードの色を設定する。（参加＝白、非参加＝黒）
             * @method listenTo(this.model, "change:position", function(m, p))
             * @param m {Graph.Node} モデル
             * @param b {boolean} サービスの参加状態。（参加＝true）
             */
            this.listenTo(this.model, "change:joined", function(m, b) {
                that.three.remove(that.nodebox);
                if (b) {
                    that.nodebox = ThreeUtil.nodeBox(0xffffff);
                } else {
                    that.nodebox = ThreeUtil.nodeBox(0x000000);
                }
                that.three.add(that.nodebox);
            });
            /**
             * マウスポインタの接触時、ラベルを表示する。
             * @method listenTo(this.model, "change:hovered", function(m, b))
             * @param m {Graph.Node} モデル
             * @param  b {boolean} マウスポインタの接触状態。（接触＝true）
             */
            this.listenTo(this.model, "change:hovered", function(m, b) {
                that.$el[b ? "show" : "hide"]();
                if (b) {
                    var p = options.project(that.three);
                    var w = that.$el.width();
                    that.$el.css({
                        left: p[0] - w * 0.5 + "px",
                        top: p[1] - 20 + "px"
                    });
                }
            });
        }
    });
    /**
     * ネットワークトポロジー画面、物理パスの描画クラス
     * @class Graph.RouteView
     * @constructor
     * @extends Backbone.View
     */
    Graph.RouteView = Backbone.View.extend({
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            var that = this;
            /**
             * 物理パスの描画オブジェクト
             * @property three
             * @type Three.Object3D
             */
            this.three = ThreeUtil.route();
            /**
             * 位置情報の変更を反映する。
             * @method listenTo(this.model, "change:position", function(m, p))
             * @param m {Graph.Route} モデル
             * @param p {Array.} (x, y)座標
             */
            this.listenTo(this.model, "change:positions", function(m, p) {
                that.three.setPosition(p[0][0], p[0][1], 0.0, p[1][0], p[1][1], 0.0);
            });
            /**
             * バンド幅の変更を反映する。
             * @method listenTo(this.model, "change:width", function(m, w))
             * @param m {Graph.Route} モデル
             * @param w {numeric} バンド幅
             */
            this.listenTo(this.model, "change:width", function(m, w) {
                that.three.setWidth(w);
            });
            options.root.add(this.three);
        }
    });
    /**
     * ネットワークトポロジー画面、サービスパスの描画クラス
     * @class Graph.PathView
     * @constructor
     * @extends Backbone.View
     */
    Graph.PathView = Backbone.View.extend({
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            _.bindAll(this);
            var that = this;
            /**
             * サービスパスの描画オブジェクト
             * @property three
             * @type Three.Object3D
             */
            this.three = ThreeUtil.path(100);
            /**
             * TODO
             * @property root
             */
            this.root = options.root;
            this.root.add(this.three);
            /**
             * オーバーレイの選択上に合わせて、サービスパスの表示・非表示を切り替える。（選択状態＝表示）
             * @method listenTo(this.model, "change:selected", function(m, b))
             * @param m {Graph.Path} モデル
             * @param p {Boolen} 選択状態
             */
            this.listenTo(this.model, "change:selected", function(m, b) {
                that.three.visible = b;
            });
            /**
             * サービスパスを再描画する。
             * @method listenTo(this.model, "change:positions change:curveMode change:hue1", function(m))
             * @param m {Graph.Path} モデル
             */
            this.listenTo(this.model, "change:positions change:curveMode change:hue1", function(m) {
                if (!m.get("selected")) {
                    return;
                }
                var p = m.get("positions");
                switch (m.get("curveMode")) {
                    case 1:
                        that.three.setCatmull(p).setHue(m.get("hue1"));
                        break;
                    default:
                        that.three.setPoints(p).setHue(m.get("hue1"));
                        break;
                }
            });
            /**
             * サービスパスを消す。
             * @method this.listenTo(this.model, "remove", function());
             */
            this.listenTo(this.model, "remove", this.remove);
        },
        remove: function() {
            this.root.remove(this.three);
        }
    });

    /**
     * ネットワークトポロジー画面のモデル
     * @class Graph.Graph
     * @constructor
     * @extends Backbone.Model
     */
    Graph.Graph = Backbone.Model.extend({
        /**
         * @property nodeList
         * @type Graph.NodeList
         */
        /**
         * @property switchList
         * @type Graph.SwitchList
         */
        /**
         * @property routeList
         * @type Graph.RouteList
         */
        /**
         * @property pathList
         * @type Graph.PathList
         */
        defaults: function() {
            return {
                nodeList: new Graph.NodeList(),
                switchList: new Graph.SwitchList(),
                routeList: new Graph.RouteList(),
                pathList: new Graph.PathList()
            };
        }
    });
    /**
     * ネットワークトポロジー画面の描画クラス
     * @class Graph.GraphView
     * @constructor
     * @extends Backbone.View
     */
    Graph.GraphView = Backbone.View.extend({
        /**
         * @property model
         * @type Graph.Graph
         */
        model: Graph.Graph,
        _updateRoute: null,
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function() {
            _.bindAll(this);
            var that = this;
            var ctr = 0;
            var root = new THREE.Object3D();
            var labelUpdateThread = new MyUtil.Thread({
                interval: 100,
                skip: null
            }).start();
            that.threeBase = new ThreeUtil.Base({
                canvas: this.$el,
                width: this.$el.width(),
                height: this.$el.height(),
                position: new THREE.Vector3(0, 1.5, 1.5),
                //position: new THREE.Vector3(0,1,1),
                lookAt: new THREE.Vector3(0, 3, 0),
                init: function(s) {
                    root.rotation.x = -Math.PI / 2;
                    //		    root.position.y = -0.08;
                    root.add(new ThreeUtil.Grid());
                    s.add(root);
                },
                update: function() {
                    ctr += 1;
                    if (ctr % 3 === 0) {
                        // 1秒間隔の処理
                    }
                }
            });
            this.curveMode = 1;

            /**
             * カメラが動かされている間、ラベルを隠す。
             * @method $el.mousedown(function())
             */
            this.$el.mousedown(function() {
                that.model.get("switchList").each(function(m) {
                    m.trigger("hideLabel");
                });
                that.model.get("nodeList").each(function(m) {
                    m.trigger("hideLabel");
                });
            });
            /**
             * カメラが動かされた際に、ラベルの位置を更新する。
             * @method $el.mouseup(function())
             */
            this.$el.mouseup(function() {
                that.model.get("switchList").each(function(m) {
                    m.trigger("updateLabel");
                });
                that.model.get("nodeList").each(function(m) {
                    m.trigger("updateLabel");
                });
            });

            /**
             * スイッチ追加時、レイアウトを更新する。
             * @method listenTo(this.model.get("switchList"), "add", function(m))
             * @param m {Graph.Switch} 追加されたスイッチ
             */
            this.listenTo(this.model.get("switchList"), "add", function(m) {
                var view = new Graph.SwitchView({
                    model: m,
                    project: that.threeBase.project
                });
                layout(
                    this.model.get("switchList"),
                    this.model.get("nodeList")
                );
                root.add(view.three);
                that.$el.append(view.$el);
                that.updateRouteLayout();
            });
            /**
             * ノード追加時、レイアウトを更新する。
             * @method listenTo(this.model.get("nodeList"), "add", function(m))
             * @param m {Graph.Node} 追加されたノード
             */
            this.listenTo(this.model.get("nodeList"), "add", function(m) {
                var view = new Graph.NodeView({
                    model: m,
                    project: that.threeBase.project
                });
                layout(
                    this.model.get("switchList"),
                    this.model.get("nodeList")
                );
                root.add(view.three);
                that.$el.append(view.$el);
                that.updateRouteLayout();
            });
            /**
             * 物理パス追加時、レイアウトを更新する。
             * @method listenTo(this.model.get("routeList"), "add", function(m))
             * @param m {Graph.Route} 追加された物理パス
             */
            this.listenTo(this.model.get("routeList"), "add", function(m) {
                var view = new Graph.RouteView({
                    model: m,
                    root: root
                });
                that.updateRouteLayout();
            });
            /**
             * サービスパス追加時、レイアウトを更新する。
             * @method listenTo(this.model.get("pathList"), "add", function(m))
             * @param m {Graph.Path} 追加されたサービスパス
             */
            this.listenTo(this.model.get("pathList"), "add", function(m) {
                var view = new Graph.PathView({
                    model: m,
                    root: root
                });
            });
            /**
             * サービスパス更新時、レイアウトを更新する。
             * @method listenTo(this.model.get("pathList"), "change:switches change:selected", function())
             * @param m {Graph.Path} 追加されたサービスパス
             */
            this.listenTo(this.model.get("pathList"), "change:switches change:selected",
                this.updatePathLayout);
        },
        /**
         * サービスパスの描画モードをトグルする。（直線<=>曲線）
         * @method toggleCurveMode
         */
        toggleCurveMode: function() {
            var c = this.curveMode = (this.curveMode + 1) % 2;
            this.model.get("pathList").each(function(path) {
                path.set("curveMode", c);
            });
        },
        /**
         * 物理パス、ノード、スイッチのレイアウトを更新する。
         * @method updateRouteLayout
         */
        updateRouteLayout: function() { // 連続更新を抑制するためのラッパー
            if (this._updateRoute) {
                clearTimeout(this._updateRoute);
            }
            // 200ms 更新要求がなかった時に実際に更新する。
            this._updateRoute = setTimeout(this._updateRouteLayout, 200);
        },
        _updateRouteLayout: function() {
            var nodeList = this.model.get("nodeList");
            var switchList = this.model.get("switchList");
            this.model.get("routeList").each(function(route) {
                var src = nodeList.get(route.get("sid")) ||
                    switchList.get(route.get("sid"));
                var dst = nodeList.get(route.get("did")) ||
                    switchList.get(route.get("did"));
                if (src && dst) {
                    var sp = src.get("position");
                    var dp = dst.get("position");
                    route.set("positions", [sp, dp]);
                }
            });
        },
        /**
         * サービスパスのレイアウトを更新する。
         * @method updatePathLayout
         */
        updatePathLayout: function(path) {
            // Overlay, topology双方の情報が揃っているか
            if (!path || !path.get("selected")) {
                return;
            }
            console.log("uppath");

            var nodeList = this.model.get("nodeList");
            var switchList = this.model.get("switchList");
            var hue = path.get("hue1");
            var height = hue * 0.1 + 0.02;
            var arr = [];
            var spos = nodeList.get(path.get("snode")).get("position");
            var dpos = nodeList.get(path.get("dnode")).get("position");
            var sws = path.get("switches");

            arr.push([spos[0], spos[1], 0]);
            for (var i = 0; i < sws.length; i++) {
                var swpos = switchList.get(sws[i]).get("position").slice(0);
                // 往路と復路をずらす
                var last = arr[arr.length - 1];
                var pos = SCNV.shiftLine(last[0], last[1], swpos[0], swpos[1], 0.003, 0);
                arr.push([pos[2], pos[3], height]);
            }
            arr.push([dpos[0], dpos[1], 0]);

            path.set("positions", arr);
        }
    });
})();
