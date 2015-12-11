/*!
 * Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
 * GPL3, see LICENSE for more details.
 */
var SCNV = SCNV || {};

/**
 * オーバーレイグラフ描画用のヘルパー群
 * @class OverlaySVGHelper
 */
(function() {
    /**
     * 矢印作成メソッド (Raphael ヘルパー)
     * @method Raphael.fn.arrow
     * @param {number} x0 始点x座標
     * @param {number} y0 始点y座標
     * @param {number} x1 終点x座標
     * @param {number} y1 終点y座標
     * @param {number} lineWidth 線幅
     * @param {number} headWidth 矢頭幅
     * @param {number} headLenght 矢頭長
     * @return {object} 作成した矢印
     */
    Raphael.fn.arrow = function(x0, y0, x1, y1, lineWidth, headWidth, headLength) {
        headLength = headLength || 3;
        headWidth = headWidth || 2;
        lineWidth = lineWidth || 1;
        var dx = x1 - x0;
        var dy = y1 - y0;
        var ln = Math.sqrt(dx * dx + dy * dy);
        var nx = dx / ln;
        var ny = dy / ln;
        var lwx = -ny * lineWidth;
        var lwy = nx * lineWidth;
        var hwx = -ny * headWidth;
        var hwy = nx * headWidth;
        var hlx = nx * headLength;
        var hly = ny * headLength;
        return this.path(
            "M" + (x0 - lwx) + "," + (y0 - lwy) +
            "L" + (x0 + lwx) + "," + (y0 + lwy) +
            "L" + (x1 + lwx - hlx) + "," + (y1 + lwy - hly) +
            "L" + (x1 + hwx - hlx) + "," + (y1 + hwy - hly) +
            "L" + (x1) + "," + (y1) +
            "L" + (x1 - hwx - hlx) + "," + (y1 - hwy - hly) +
            "L" + (x1 - lwx - hlx) + "," + (y1 - lwy - hly) +
            "L" + (x0 - lwx) + "," + (y0 - lwy));
    };
    /**
     * 束縛解除メソッド (Raphael ヘルパー)
     * @method Raphael.el.unbindAll
     */
    Raphael.el.unbindAll = function() {
        while (this.events.length) {
            var e = this.events.pop();
            e.unbind();
        }
    };

    /**
     * 矢印を平行移動、短縮関数
     * @method SCNV.shiftLine
     * @param {number} x0 始点x座標
     * @param {number} y0 始点y座標
     * @param {number} x1 終点x座標
     * @param {number} y1 終点y座標
     * @param {number} shift 平行移動距離
     * @param {number} radius 短縮長さ
     * @return {Array} 平行移動、短縮した座標
     */
    SCNV.shiftLine = function(x0, y0, x1, y1, shift, radius, radius2) {
        radius2 = radius2 || radius;
        var dx = x1 - x0;
        var dy = y1 - y0;
        var ln = 1.0 / Math.sqrt(dx * dx + dy * dy);
        var ax = dx * ln;
        var ay = dy * ln;
        var bx = -ay;
        var by = ax;
        return [
            x0 + shift * bx + radius * ax,
            y0 + shift * by + radius2 * ay,
            x1 + shift * bx - radius * ax,
            y1 + shift * by - radius2 * ay
        ];
    };

    function pathid(src, dst) {
        return src + "@@" + dst;
    };

    // animation loop
    var graphs = [];
    var svgDThread = new MyUtil.DelayThread({
        interval: 500
    }).start();

    /**
     * オーバーレイグラフ描画クラス
     * @class SCNV.OverlayGraph
     * @constructor 
     */
    SCNV.OverlayGraph = function(options) {
        var that = this;
        options = $.extend({}, {
            paper: null,
            circles: {},
            paths: {},
            baseColor: [0, 1, 0.5],
            blinkColor: [0, 1, 0.8]
        }, options);
        graphs.push(this);
    
        /**
         * @method release
         */
        this.release = function() {
            if (options.paper !== null) {
                options.paper.clear();
                options.paper.remove();
                options.paper = null;
                options.circles = {};
                options.paths = {};
            }
        };
        /**
         * @method setColor
         * @param c0 ベースの色
         * @param c1 点滅時の色
         */
        this.setColor = function(c0, c1) {
            options.baseColor = Raphael.hsl(c0[0], c0[1], c0[2]);
            options.blinkColor = Raphael.hsl(c1[0], c1[1], c1[2]);
            if (options.paper !== null) {
                options.paper.forEach(function(e) {
                    e.attr({
                        "fill": options.baseColor
                    });
                });
            }
        };
        /**
         * @method resetColor
         */
        this.resetColor = function() {
            if (options.paper !== null) {
                options.paper.forEach(function(e) {
                    e.attr({
                        fill: options.baseColor
                    });
                });
            }
        };
        /**
         * @method blinkService
         * @param s サービス
         */
        this.blinkService = function(s) {
            if (options.circles[s]) {
                var o = options.circles[s];
                svgDThread.push(function() {
                    if (o) {
                        o.attr({
                            fill: options.blinkColor
                        });
                    }
                }, 0);
                svgDThread.push(function() {
                    if (o) {
                        o.attr({
                            fill: options.baseColor
                        });
                    }
                }, 500);
            }
        };
        /**
         * @method blinkPath
         * @param src
         * @param dst
         */
        this.blinkPath = function(src, dst) {
            var id = pathid(src, dst);
            if (options.paths[id]) {
                var o = options.paths[id];
                svgDThread.push(function() {
                    if (o) {
                        o.attr({
                            fill: options.blinkColor
                        });
                    }
                }, 0);
                svgDThread.push(function() {
                    if (o) {
                        o.attr({
                            fill: options.baseColor
                        });
                    }
                }, 500);
            }
        };
        /**
         * @method create
         * @param el
         * @param size
         * @param services
         * @param rules
         */
        this.create = function(el, size, services, rules) {
            that.release();
            options.paper = Raphael(el, size, size);
            var width = size;
            var height = size;
            var radius = width / 2.5;
            var cx = width / 2;
            var cy = height / 2;
            var radStart = Math.PI * 0.5;
            var servicePositions = {};
            // render services
            for (var i = 0; i < services.length; i++) {
                var rad = Math.PI * 2.0 * i / services.length - radStart;
                var x = Math.cos(rad) * radius + cx;
                var y = Math.sin(rad) * radius + cy;
                servicePositions[services[i]] = [x, y];
                var c = options.paper.circle(x, y, 4).attr({
                    fill: options.baseColor,
                    opacity: 1,
                    stroke: "none"
                });
                options.circles[services[i]] = c;
                // render rules
            }
            for (var key in rules) {
                var o = rules[key];
                var x0 = servicePositions[o[0]][0];
                var y0 = servicePositions[o[0]][1];
                var x1 = servicePositions[o[1]][0];
                var y1 = servicePositions[o[1]][1];
                var p = SCNV.shiftLine(x0, y0, x1, y1, 2, 8);
                var l = options.paper.arrow(p[0], p[1], p[2], p[3], 1.0, 3.0, 6.0).attr({
                    fill: options.baseColor,
                    stroke: "none"
                });
                options.paths[pathid(o[0], o[1])] = l;
            }
        };
    };

    /**
     * オーバーレイグラフ描画クラス２
     * @class SCNV.OverlayGraph2
     * @constructor 
     */
    SCNV.OverlayGraph2 = function(options) {
        var that = this;
        options = $.extend({}, {
            paper: null,
            circles: {},
            paths: {},
            baseColor: [0, 1, 0.5],
            blinkColor: [0, 1, 0.8]
        }, options);
        graphs.push(this);

        /**
         * @method release
         */
        this.release = function() {
            if (options.paper !== null) {
                options.paper.clear();
                options.paper.remove();
                options.paper = null;
                options.circles = {};
                options.paths = {};
            }
        };

        /**
         * @method create
         * @param el
         * @param size
         * @param services
         * @param rules
         * @param c
         */
        this.create = function(el, width, height, services, rules, c) {
            that.release();
            options.baseColor = Raphael.hsl(c[0][0], c[0][1], c[0][2]);
            options.blinkColor = Raphael.hsl(c[1][0], c[1][1], c[1][2]);
            options.paper = Raphael(el, width, height);
            var cx = width / 2;
            var cy = height / 2;
            var radStart = Math.PI * 0.5;
            var servicePositions = {};
            // render services
            for (var i = 0; i < services.length; i++) {
                var rad = Math.PI * 2.0 * i / services.length - radStart;
                var x = Math.cos(rad) / 2 * width * 0.6 + width / 2;
                var y = Math.sin(rad) / 2 * height * 0.6 + height / 2;
                servicePositions[services[i]] = [x, y];
                var t = options.paper.text(x + 6, y / 2 + 2, services[i]).attr({
                    fill: "#fff",
                    opacity: 1,
                    stroke: "none"
                });
            }
            for (var key in rules) {
                var o = rules[key];
                var x0 = servicePositions[o[0]][0];
                var y0 = servicePositions[o[0]][1];
                var x1 = servicePositions[o[1]][0];
                var y1 = servicePositions[o[1]][1];
                var dx = x0 - x1,
                    dy = y0 - y1;
                var cutoff = Math.abs(dx) / Math.sqrt(dx * dx + dy * dy); // x 成分
                cutoff = cutoff * cutoff * cutoff;

                var p = SCNV.shiftLine(x0, y0, x1, y1, 4, 10 + 40 * cutoff);
                var l = options.paper.arrow(p[0], p[1], p[2], p[3], 2.0, 6.0, 12.0).attr({
                    fill: options.baseColor,
                    stroke: "none"
                });
            }
        };
    };
})();
