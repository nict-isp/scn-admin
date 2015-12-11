/*!
 * Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
 * GPL3, see LICENSE for more details.
 */
var SCNV = SCNV || {};

/**
 * ネットワークトポロジー画面以外を描画するためのクラス群
 * @class SCNV
 * @constructor
 */
(function() {

    /**
     * @method sortChildren
     * @static
     */
    function sortChildren(parent, children) {
        var items = children.sort(function(a, b) {
            var vA = $(a).text();
            var vB = $(b).text();
            return (vA < vB) ? -1 : (vA > vB) ? 1 : 0;
        });
        parent.append(items);
    };

    /**
     * マウスの接触を取るビュー
     * @class SCNV.HoverView
     * @constructor
     * @extends Backbone.View
     */
    SCNV.HoverView = Backbone.View.extend({
        /**
         * 制御するイベントの参照。
         * @property events
         * @type Object
         */
        events: {
            mouseover: "hover",
            mouseout: "hover"
        },
        /**
         * マウス接触時のイベント
         * @property hover
         * @param e {Event} イベントの情報
         */
        hover: function(e) {
            e.preventDefault();
            var b = e.type === "mouseover";
            this.model.set({
                hovered: b
            });
            this.trigger("hovered", e, {
                view: this,
                value: b
            });
        }
    });
    /**
     * ボタンのモデル
     * @class SCNV.Button
     * @constructor
     * @extends Backbone.Model
     */
    SCNV.Button = Backbone.Model.extend({
        /**
         * @property id
         * @type Object
         */
        /**
         * @property label 
         * @type String
         */
        /**
         * @property hovered
         * @type Boolean
         */
        defaults: function() {
            return {
                id: "no id",
                label: "no label",
                hovered: false
            };
        }
    });
    /**
     * ボタンのビュー
     * @class HoverView
     * @constructor
     * @extends SCNV.HoverView
     */
    SCNV.ButtonView = SCNV.HoverView.extend({
        /**
         * @property tagName
         * @type String
         * @default div
         */
        tagName: "div",
        /**
         * TODO
         * @property template
         */
        template: null,
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            _.bindAll(this);
            this.$el.addClass("button").data("id", this.model.get("id"));
            this.template = options.template;
            this.listenTo(this.model, "destroy", this.onDestory);
            this.listenTo(this.model, "change:hovered", function(m, b) {
                this.$el[b ? "addClass" : "removeClass"]("hovered");
            });
        },
        /**
         * レンダリング用処理
         * @method render
         * @chainable
         */
        render: function() {
            this.$el.html(
                this.template(this.model.toJSON())
            );
            return this;
        },
        /**
         * 後処理
         * @method onDestory
         */
        onDestory: function() {
            //this.remove();
        }
    });
    /**
     * ボタンのリスト
     * @class SCNV.ButtonList
     * @constructor
     * @extends Backbone.Collection
     */
    SCNV.ButtonList = Backbone.Collection.extend({
        /**
         * @property model
         * @type SCNV.Button
         */
        model: SCNV.Button
    });
    /**
     * ボタンリストのビュー
     * TODO hover連鎖の循環防止のため、hoverは2系統を持つ
     * @class SCNV.ButtonListView
     * @constructor
     * @extends Backbone.View
     */
    SCNV.ButtonListView = Backbone.View.extend({
        /**
         * 制御するイベントの参照。
         * @property events
         * @type Object
         */
        events: {
            "click .button": function(e) {
                this.trigger("clicked", e);
            }
        },
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            _.bindAll(this);
            this.items = [];
            this.listenTo(this.collection, "add", this.addButton);
            this.listenTo(this.collection, "remove", this.removeButton);
            this.template = options.template || function(str) {
                return str;
            };
            this.sorting = options.sorting;
        },
        addButton: function(model) {
            var that = this;
            var view = new SCNV.ButtonView({
                model: model,
                template: this.template
            }).render();
            view.on("hovered", function(e, a) {
                that.trigger("hovered", e, a);
            });
            this.$el.prepend(view.$el);
            if (this.sorting) {
                sortChildren(this.$el, this.$el.children(".button"));
            }
            this.items.push(view);
        },
        removeButton: function(model, collection, options) {
            this.items[options.index].remove();
            this.items.splice(options.index, 1);
            //this.$el.children(".button").remove(":contains('" + model.attributes.label + "')");
        }
    });

    /**
     * トグルボタンのモデル
     * @class SCNV.ToggleButton
     * @constructor
     * @extends Backbone.Model
     */
    SCNV.ToggleButton = Backbone.Model.extend({
        /**
         * @property id
         * @type String
         */
        /**
         * 表示名
         * @property label
         * @type String
         */
        /**
         * 選択状態ならtrue
         * @property selected
         * @type boolean
         * @default false
         */
        /**
         * マウス接触状態ならtrue
         * @property hovered
         * @type boolean
         * @default false
         */
        defaults: function() {
            return {
                id: "no id",
                label: "no label",
                selected: false,
                hovered: false
            };
        }
    });
    /**
     * トグルボタンのビュー
     * @class SCNV.ToggleButtonView
     * @constructor
     * @extends SCNV.HoverView
     */
    SCNV.ToggleButtonView = SCNV.HoverView.extend({
        tagName: "div",
        template: null,
        /**
         * 制御するイベントの参照。
         * @property events
         * @type Object
         */
        events: {
            mouseout: "hover", // for HoverView.hover
            mouseover: "hover", // for HoverView.hover
            click: "toggleSelected"
        },
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            _.bindAll(this);
            this.$el.addClass("button").data("id", this.model.get("id"));
            this.template = options.template;
            this.listenTo(this.model, "change:selected", function(m, b) {
                this.$el[b ? "addClass" : "removeClass"]("selected");
            });
            this.listenTo(this.model, "change:hovered", function(m, b) {
                this.$el[b ? "addClass" : "removeClass"]("hovered");
            });
        },
        render: function() {
            this.$el.html(
                this.template(this.model.toJSON())
            );
            return this;
        },
        toggleSelected: function(m) {
            this.model.set({
                selected: !this.model.get("selected")
            });
        }
    });
    /**
     * @class SCNV.ToggleButtonList
     * @constructor
     * @extends Backbone.Collection
     */
    SCNV.ToggleButtonList = Backbone.Collection.extend({
        /**
         * @property model
         * @type SCNV.Button
         */
        model: SCNV.Button
    });
    /**
     * @class SCNV.ToggleButtonListView
     * @constructor
     * @extends Backbone.View
     */
    SCNV.ToggleButtonListView = Backbone.View.extend({
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            _.bindAll(this);
            var that = this;
            this.listenTo(this.collection, "add", this.addButton);
            this.template = options.template || function(str) {
                return str;
            };
            this.sorting = options.sorting;
            this.newIcon = options.newIcon;
        },
        addButton: function(model) {
            var that = this;
            var view = new SCNV.ToggleButtonView({
                model: model,
                template: this.template
            }).render();
            view.on("hovered", function(e, a) {
                that.trigger("hovered", e, a);
            });
            if (this.newIcon) {
                var newIcon = $($.parseHTML(SCNV.templates.newIcon()));
                view.$el.prepend(newIcon);
                setTimeout(function() {
                    newIcon.remove();
                }, 10000);
            }
            this.$el.prepend(view.$el);
            if (this.sorting) {
                sortChildren(this.$el, this.$el.children(".button"));
            }
        }
    });

    /**
     * Stream 表示
     * @class SCNV.StreamView
     * @constructor
     * @extends Backbone.View
     */
    SCNV.StreamView = Backbone.View.extend({
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            var that = this;
            this.capacity = options.capacity || 10;
            this.template = options.template || function(str) {
                return str;
            };
            for (var i = 0; i < this.capacity; i++) {
                this.$el.append($("<div />"));
            }
        },
        add: function(html) {
            this.$el.prepend(
                this.$el.children().last().html(this.template(html))
            );
        }
    });
    /**
     * @class SCNV.ServiceManager
     * @constructor
     * @extends Backbone.Model
     */
    SCNV.ServiceManager = Backbone.Model.extend({
        /**
         *　サービスのリスト
         * @property services
         * @type 
         */
        /**
         * サービスパスのリスト
         * @property paths
         * @type 
         */
        defaults: function() {
            return {
                services: {},
                paths: {},
            };
        },
        addService: function(sid, sname) {
            this.get("services")[sid] = sname;
        },
        getService: function(sid, sname) {
            return this.get("services")[sid];
        },
        addPath: function(pid, ssid, dsid) {
            this.get("paths")[pid] = [ssid, dsid]; //TODO 名前解決
        },
        getPath: function(pid) {
            return this.get("paths")[pid];
        },
        delPath: function(pid) {
            delete this.get("paths")[pid];
        },
    });
    /**
     * @class SCNV.ColorManager
     * @constructor
     * @extends Backbone.Model
     */
    SCNV.ColorManager = Backbone.Model.extend({
        /**
         * オーバーレイに対するナンバリング
         * @property oidIdx
         * @type Object
         */
        /**
         * オーバーレイに対する色情報
         * @property oidToHue
         * @type Object
         */
        /**
         * オーバーレイに対するCSS
         * @property oidToCSS
         * @type Object
         */
        /**
         * オーバーレイに対するパスのペア
         * @property oidToPids
         * @type Object
         */
        /**
         * オーバーレイの選択状態
         * @property oidSelected
         * @type Object
         */
        /**
         * パスに対する色
         * @property pidToHue
         * @type Object
         */
        /**
         * パスに対するCSS
         * @property pidToCSS
         * @type Object
         */
        /**
         * パスに対するオーバーレイ
         * @property pidToOid
         * @type Object 
         */
        /**
         * パスの選択状態
         * @property pidSelected
         * @type Object
         */
        defaults: function() {
            return {
                oidIdx: {},
                // overlay id
                oidToHue: {},
                oidToCSS: {},
                oidToPids: {},
                oidSelected: {},
                // path id
                pidToHue: {},
                pidToCSS: {},
                pidToOid: {},
                pidSelected: {},
            };
        },
        // oid
        /**
         * @method hueByOid
         * @param oid オーバーレイID
         * @return オーバーレイの色
         */
        hueByOid: function(oid) {
            return this.get("oidToHue")[oid];
        },
        /**
         * @method cssByOid
         * @param oid オーバーレイID
         * @return オーバーレイのCSS
         */
        cssByOid: function(oid) {
            return this.get("oidToCSS")[oid] || "inherit";
        },
        /**
         * @method pidsByOid
         * @param oid オーバーレイID
         * @return オーバーレイのパス
         */
        pidsByOid: function(oid) {
            return this.get("oidToPids")[oid];
        },
        /**
         * @method oidSelected
         * @param oid オーバーレイID
         * @return {boolean} オーバーレイの選択状態
         */
        oidSelected: function(oid) {
            return this.get("oidSelected")[oid];
        },
        /**
         * @method numOidSelected
         * @return 選択中のオーバーレイの数
         */
        numOidSelected: function() {
            return _.size(this.get("oidSelected"));
        },
        // pid
        /**
         * @method hueByPid
         * @param pid パスID
         * @return パスの色情報
         */
        hueByPid: function(pid) {
            return this.get("pidToHue")[pid];
        },
        /**
         * @method cssByPid
         * @param pid パスID
         * @return パスのCSS
         */
        cssByPid: function(pid) {
            return this.get("pidToCSS")[pid] || "inherit";
        },
        /**
         * @method oidByPid
         * @param pid パスID
         * @return パスのオーバーレイ
         */
        oidByPid: function(pid) {
            return this.get("pidToOid")[pid];
        },
        /**
         * @method pidSelected
         * @param pid パスID
         * @return {boolean} パスの選択状態
         */
        pidSelected: function(pid) {
            return this.get("pidSelected")[pid];
        },
        /**
         * @method numPidSelected
         * @return 選択中のパスの数
         */
        numPidSelected: function() {
            return _.size(this.get("pidSelected"));
        },
        /**
         * オーバーレイを追加する。
         * @method setOverlay
         * @param oid オーバーレイID
         */
        setOverlay: function(oid) {

            if (this.get("oidToPids")[oid]) {
                return;
            }
            // silent
            this.get("oidIdx")[oid] = _.size(this.get("oidIdx"));
            console.log(oid, this.get("oidIdx")[oid]);
            //	    console.log(_.size(this.get("oidIdx")));
            this.get("oidToHue")[oid] = 0;
            this.get("oidToCSS")[oid] = "inherit";
            this.get("oidToPids")[oid] = [];
            // trigger
            this.trigger("add");
        },
        /**
         * オーバーレイにパスを追加する。
         * @method addPath
         * @param oid オーバーレイID
         * @param pid パスID
         */
        addPath: function(oid, pid) {
            // silent
            if (!this.get("oidToPids")[oid]) {
                this.setOverlay(oid);
            }
            if (_.contains(this.get("oidToPids")[oid], pid)) {
                return;
            }
            this.get("oidToPids")[oid].push(pid);
            this.get("pidToOid")[pid] = oid;
            this.get("pidToHue")[pid] = this.get("oidToHue")[oid];
            this.get("pidToCSS")[pid] = this.get("oidToCSS")[oid];
            this.get("pidSelected")[pid] = this.get("oidSelected")[oid];
        },
        /**
         * オーバーレイからパスを削除する。
         * @method removePath
         * @param oid オーバーレイID
         * @param pid パスID
         */
        removePath: function(oid, pid) {
            this.get("oidToPids")[oid] = _.reject(this.get("oidToPids")[oid], function(num) {
                return num === pid
            });
            delete this.get("pidToOid")[pid];
            delete this.get("pidToHue")[pid];
            delete this.get("pidToCSS")[pid];
            delete this.get("pidSelected")[pid];
        },
        /**
         * すべての色情報を更新する。
         * @method updateColors
         * @param selected {Object} 選択状態のオーバーレイ一覧
         */
        updateColors: function(selected) {
            var that = this;
            var inherit = "inherit";
            this.set({
                "oidSelected": {}
            });
            this.set({
                "pidSelected": {}
            });

            // reset colors
            for (var oid in this.get("oidToHue")) {
                this.get("oidToHue")[oid] = 0;
                this.get("oidToCSS")[oid] = inherit;
            }
            // set colors
            _.each(selected, function(a, i) {
                var oid = a.get("id");
                var hue = (that.get("oidIdx")[oid] % 7) / 7.0;
                that.get("oidToHue")[oid] = hue;
                that.get("oidToCSS")[oid] = "hsl(" + (hue * 360) + ",100%,50%)";
                that.get("oidSelected")[oid] = true;
            });
            // copy
            for (var pid in this.get("pidToOid")) {
                var oid = this.get("pidToOid")[pid];
                this.get("pidToHue")[pid] = this.get("oidToHue")[oid];
                this.get("pidToCSS")[pid] = this.get("oidToCSS")[oid];
                this.get("pidSelected")[pid] = this.get("oidSelected")[oid];
            }
            // trigger
            this.trigger("update");
        }
    });
    /**
     * オーバーレイ情報
     * @class SCNV.OverlayDetail
     * @constructor
     * @extends SCNV.ToggleButton
     */
    SCNV.OverlayDetail = SCNV.ToggleButton.extend({
        /**
         * サービスのリスト
         * @property serviceList
         * @type Array.
         */
        /**
         * パスのリスト
         * @property ruleList
         * @type Object
         */
        /**
         * @property colors
         * @type Array.
         */
        defaults: function() {
            return {
                "serviceList": [],
                "ruleList": {},
                "colors": [
                    [0, 0, 0],
                    [0, 0, 0]
                ]
            };
        },
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function() {
            _.bindAll(this);
        },
        /**
         * @method hasService
         * @param id サービスID
         * @return {boolean} サービスを持っていればtrue
         */
        hasService: function(id) {
            return _.contains(this.get("serviceList"), id);
        },
        /**
         * 設定されたパスからサービスのリストを更新
         * @method updateServiceRules
         */
        updateServiceRules: function() {
            var services = [];
            _.each(this.get("ruleList"), function(rule) {
                services.push(rule[0], rule[1]);
            });
            this.set("serviceList", _.uniq(services));
            this.trigger("updateList", this);
        },
        /**
         * オーバーレイにパスを追加する。
         * @method addRule
         * @param id パスのID
         * @param s1 送信元のサービスID
         * @param s2 送信先のサービスID
         */
        addRule: function(id, s1, s2) {
            // silent
            if (!id || !s1 || !s2) {
                throw "wrong rule";
            }
            console.log("add rule", id, s1, s2);

            this.get("ruleList")[id + ""] = [s1, s2];
            this.updateServiceRules();
        },
        /**
         * オーバーレイからパスを削除する。
         * @method delRule
         * @param id パスのID
         */
        delRule: function(id) {
            if (this.get("ruleList").hasOwnProperty(id)) {
                delete this.get("ruleList")[id + ""];
                this.updateServiceRules();
            }
        },
        /**
         * @method setColors
         * @param オーバーレイの色
         */
        setColors: function(c) {
            this.set("colors", c);
        }
    });
    /**
     * オーバーレイ詳細情報のビュー
     * @class SCNV.OverlayDetailView
     * @constructor
     * @extends SCNV.HoverView
     */
    SCNV.OverlayDetailView = SCNV.HoverView.extend({
        /**
         * 制御するイベントの参照。
         * @property events
         * @type Object
         */
        events: {
            mouseout: "hover", // for HoverView.hover
            mouseover: "hover", // for HoverView.hover
            click: "toggleSelected"
        },
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            _.bindAll(this);
            var that = this;
            this.template = options.template;
            // selected: toggle button attribute
            this.listenTo(this.model, "updateList change:selected", this.updateModel);
            this.listenTo(this.model, "change:hovered", function(e, b) {
                if (this.model.get("selected")) {
                    that.$el.find(".label")[b ? "addClass" : "removeClass"]("hovered");
                }
            });
            // graph reaction
            /**
             * @property graph
             * @type SCNV.OverlayGraph
             */
            this.graph = new SCNV.OverlayGraph();
            var color = [
                [0, 0, 0],
                [0, 0, 0]
            ];
            /**
             * オーバーレイの色情報を反映する。
             * @method listenTo(this.model, "change:colors", function(m, c))
             * @param m モデル
             * @param c {Array.} 色情報
             */
            this.listenTo(this.model, "change:colors", function(m, c) {
                color = c;
                that.graph.setColor(c[0], c[1]);
                if (that.graph2) {
                    that.graph2.svg.release();
                    that.graph2.el.remove();
                    that.graph2 = null;
                }
            });
            /**
             * サービスを点滅させる。
             * @method listenTo(this.model, "blinkService", function(s))
             * @param s サービス
             */
            this.listenTo(this.model, "blinkService", function(s) {
                if (this.model.get("selected")) {
                    that.graph.blinkService(s);
                }
            });
            /**
             * パスを点滅させる。
             * @method listenTo(this.model, "blinkPath", function(s, d))
             * @param s サービス
             * @param d パス
             */
            this.listenTo(this.model, "blinkPath", function(s, d) {
                if (this.model.get("selected")) {
                    that.graph.blinkPath(s, d);
                }
            });

            /**
             * クリック時、オーバーレイの詳細グラフを表示する。
             * 再度クリックで非表示。
             * @method $("overlayDetail").click
             * @param e {Event} イベント情報
             */
            this.graph2 = null;
            this.$el.addClass("overlayDetail").hide().click(function(e) {
                if (that.graph2) {
                    that.graph2.svg.release();
                    that.graph2.el.remove();
                    that.graph2 = null;
                } else {
                    var x = e.pageX + 10;
                    var y = e.pageY - 10;
                    that.graph2 = {
                        el: $("<div />").css({
                            "width": 280,
                            "height": 150,
                            "position": "absolute",
                            "top": y,
                            "left": x,
                            "border": "4px solid rgba(0,0,0,0.8)",
                            "border-radius": 5,
                            "background": "rgba(0,0,0,0.6)",
                            "z-index": 100
                        }),
                        svg: new SCNV.OverlayGraph2()
                    };
                    that.graph2.svg.create(
                        that.graph2.el[0],
                        280, 150,
                        that.model.get("serviceList"),
                        that.model.get("ruleList"),
                        color
                    );
                    that.$el.append(that.graph2.el);
                }
            });
        },
        /**
         * モデルの情報を反映する。
         * @method updateModel
         */
        updateModel: function() {
            if (this.model.get("selected")) {
                this.$el.html(this.template(this.model.toJSON())).show();
                this.graph.create(
                    this.$el.find(".graph").eq(0)[0],
                    80,
                    this.model.get("serviceList"),
                    this.model.get("ruleList")
                );
            } else {
                this.graph.release();
                // remove process
                this.$el.html("").hide();
            }
        }
    });
    /**
     * @class SCNV.OverlayDetailList
     * @constructor
     * @extends Backbone.Collection
     */
    SCNV.OverlayDetailList = Backbone.Collection.extend({
        /**
         * @property model
         * @type SCNV.OverlayDetail
         */
        model: SCNV.OverlayDetail
    });
    /**
     * @class SCNV.OverlayDetailListView
     * @constructor
     * @extends Backbone.View
     */
    SCNV.OverlayDetailListView = Backbone.View.extend({
        /**
         * モデルをビューに反映する。また、リスナを設定する。
         * @method initialize
         * @param options {Object} オプション
         */
        initialize: function(options) {
            _.bindAll(this);
            this.listenTo(this.collection, "add", this.addModel);
            this.template = options.template || function(str) {
                return str;
            };
        },
        /**
         * @method clicked
         * @param e
         */
        clicked: function(e) {
            e.preventDefault();
            var id = $(e.currentTarget).data("id");
            var model = this.collection.get(id);
            if (model) {
                this.trigger("click", id);
            }
        },
        /**
         * @method addModel
         * @param model
         */
        addModel: function(model) {
            var that = this;
            var view = new SCNV.OverlayDetailView({
                template: this.template,
                model: model
            });
            view.on("hovered", function(e, a) {
                that.trigger("hovered", e, a);
            });
            this.$el.prepend(view.$el); //this.template(model.toJSON()));
        }
    });

})();
