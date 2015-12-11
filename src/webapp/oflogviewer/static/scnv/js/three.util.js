/*!
 * Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
 * GPL3, see LICENSE for more details.
 */
var ThreeUtil = ThreeUtil || {};

/**
 * Three.jsユーティリティ
 * @class ThreeUtil
 */
(function() {
    /**
     * @method factorial
     * @param [number] n
     * @return {number} 
     */
    function factorial(n) {
        var r = 1;
        for (; n > 0; n--) {
            r *= n;
        }
        return r;
    };

    /**
     * @method combination
     * @param {number} m
     * @param {number} n
     * @return {number} 
     */
    function combination(m, n) {
        return factorial(m) / factorial(m - n) / factorial(n);
    };

    /**
     * @method bernsteinPolynomial
     * @param {number} n
     * @param {number} i
     * @return {function} 
     */
    function bernsteinPolynomial(n, i) {
        var c = combination(n, i);
        return function(t) {
            return c * Math.pow(t, i) * Math.pow(1 - t, n - i);
        };
    };

    /**
     * @method bezierFunc3D
     * @param {object} b 
     * @return {function}
     */
    function bezierFunc3D(b) {
        var funcs = [];
        for (var i = 0; i < b.length; i++) {
            funcs.push(bernsteinPolynomial(b.length - 1, i));
        }
        return function(t) {
            var r = [0, 0, 0];
            for (var i = 0; i < b.length; i++) {
                var k = funcs[i](t);
                r[0] += b[i][0] * k;
                r[1] += b[i][1] * k;
                r[2] += b[i][2] * k;
            }
            return r;
        };
    };

    /**
     * Three.jsシーンコンストラクタ
     * @class ThreeUtil
     * @constructor 
     */
    ThreeUtil.Base = function(options) {
        options = $.extend({
            init: function(scene) {},
            width: 300,
            height: 300,
            canvas: $(document.body),
            background: "black",
            opacity: 0,
            position: new THREE.Vector3(0, 1, 1),
            lookAt: new THREE.Vector3(0, 0, 0),
            angle: 15,
            light: true,
            renderer: {
                antialias: true
            }
        }, options);

        var renderer = new THREE.WebGLRenderer(options.renderer);
        renderer.setSize(options.width, options.height);
        renderer.setClearColor(options.background, options.opacity);
        options.canvas.append(renderer.domElement);

        // (2)シーンの作成
        this.scene = new THREE.Scene();
        var temp = new THREE.Object3D();
        this.scene.add(temp);

        // (3)カメラの作成
        this.camera = new THREE.PerspectiveCamera(
            options.angle, options.width / options.height);
        this.camera.position = options.position;
        this.camera.lookAt(options.lookAt);
        this.scene.add(this.camera);

        var that = this;
        var prj = new THREE.Projector();
        var whalf = options.width * 0.5;
        var hhalf = options.height * 0.5;

        this.project = function(obj) {
            var mat = new THREE.Vector3();
            mat.getPositionFromMatrix(obj.matrixWorld);
            var vec = prj.projectVector(
                mat.clone(),
                that.camera);
            vec.x = (vec.x * whalf) + whalf + options.canvas.position().left;
            vec.y = (-vec.y * hhalf) + hhalf + options.canvas.position().top;
            return [Math.floor(vec.x), Math.floor(vec.y)];
        };

        // カメラコントロールを作成
        var controls = new THREE.OrbitControls(
            this.camera,
            renderer.domElement);
        controls.center = new THREE.Vector3(0, 0, 0);
        controls.userRotateSpeed = 3.0;
        controls.userZomSpeed = 2.0;

        if (options.light) {
            // (4)ライトの作成
            var ambient = new THREE.AmbientLight(0x333333);
            this.scene.add(ambient);

            var light1 = new THREE.DirectionalLight(0xffffff, 0.5);
            var pl1 = new THREE.DirectionalLightHelper(light1, 0.05);
            light1.position.set(0, 0, -1).normalize();
            this.camera.add(light1);
            //	    this.scene.add(pl1);

            //	    var light2 = new THREE.PointLight(0xffffff,10,100);
            //	    light2.position.set(0,0.1,-0.2);
            ///	    this.scene.add(light2);
        }

        // ついか
        //	options.init(this.scene);
        options.init(temp);

        // (6)レンダリング
        var webglThread = new MyUtil.Thread({
            interval: 100,
            skip: null,
            loopRunner: function() {
                //temp.rotation.x += 0.01;
                controls.update();
                renderer.render(that.scene, that.camera);
            }
        }).start();
    };

    /**
     * @method Grid
     * @param {object} options グリッドの設定
     * @return グリッドの描画 
     */
    ThreeUtil.Grid = function(options) {
        options = $.extend({
            xmin: -1.5,
            xmax: 1.5,
            xnum: 128,
            ymin: -1.5,
            ymax: 1.5,
            ynum: 128,
            z: -0.001,
            color: "#000000",
            opacity: 0.15,
            width: 1
        }, options);

        var geom = new THREE.Geometry();
        for (var ix = 0; ix <= options.xnum; ix++) {
            var x = ix / options.xnum * (options.xmax - options.xmin) + options.xmin;
            geom.vertices.push(new THREE.Vector3(x, options.ymin, options.z));
            geom.vertices.push(new THREE.Vector3(x, options.ymax, options.z));
        }
        for (var iy = 0; iy <= options.ynum; iy++) {
            var y = iy / options.ynum * (options.ymax - options.ymin) + options.ymin;
            geom.vertices.push(new THREE.Vector3(options.xmin, y, options.z));
            geom.vertices.push(new THREE.Vector3(options.xmax, y, options.z));
        }
        var mat = new THREE.LineBasicMaterial({
            color: options.color,
            linewidth: options.width,
            opacity: options.opacity
        });
        return new THREE.Line(geom, mat, THREE.LinePieces);
    };
    /**
     * @method nodeBox
     * @param c ノードの色
     * @return ノードの描画
     */
    ThreeUtil.nodeBox = function(c) {
        var mat2 = new THREE.MeshPhongMaterial({
            color: c,
            specular: 0x888888,
            shininess: 60,
            ambient: 0x888888,
            side: THREE.DoubleSide
        });
        var geom = new THREE.CubeGeometry(
            0.003, 0.006, 0.006
        );
        var mesh = new THREE.Mesh(geom, mat2);
        var slider = new THREE.Object3D();
        slider.position.z = 0.003;
        slider.rotation.z = Math.PI / 1.5;
        slider.add(mesh);
        var obj = new THREE.Object3D();
        obj.add(slider);
        return obj;
    };
    /**
     * @method nodeTexture
     * @param {string} fname ノード名
     * @param {string} type ラベル種別
     * @return ノードラベルの描画
     */
    ThreeUtil.nodeTexture = function(fname, type) {
        var texture = THREE.ImageUtils.loadTexture(fname);
        var w, h, y;
        switch (type) {
            case "network":
                w = 0.1;
                h = 0.2;
                y = -0.1;
                break;
            default:
                w = 0.030;
                h = 0.036;
                y = -0.025;
                break;
        };
        texture.needsUpdate = true;
        var geometry = new THREE.PlaneGeometry(w, h);
        if (type === "network") {
            geometry.faces[0].vertexColors[0] = new THREE.Color(0xffffff);
            geometry.faces[0].vertexColors[1] = new THREE.Color(0x333333);
            geometry.faces[0].vertexColors[2] = new THREE.Color(0x333333);
            geometry.faces[0].vertexColors[3] = new THREE.Color(0xffffff);
        }
        var material = new THREE.MeshBasicMaterial({
            vertexColors: THREE.VertexColors,
            //              color: 0xffffff,                                                                                                                                                                                                                              
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(geometry, material);
        var slider = new THREE.Object3D();
        slider.position.y = y;
        slider.add(mesh);
        var obj = new THREE.Object3D();
        obj.add(slider);
        return obj;
    };
    /*
      // not used
    ThreeUtil.nodeTexture = function(fname) {
	var texture = THREE.ImageUtils.loadTexture(fname);
	texture.needsUpdate = true;
	var geometry = new THREE.PlaneGeometry(0.030,0.036);
	var material = new THREE.MeshBasicMaterial({
		color: 0xffffff, 
		map: texture, 
		transparent: true,
		side: THREE.DoubleSide });
	var mesh = new THREE.Mesh(geometry, material);
	var slider = new THREE.Object3D();
	slider.position.y = -0.025;
	slider.add(mesh);
	var obj = new THREE.Object3D();
	obj.add(slider);
	return obj;	
    };
    */
    /**
     * @method switchBox
     * @return スイッチの描画
     */
    ThreeUtil.switchBox = function() {
        var mat2 = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0x888888,
            shininess: 40,
            ambient: 0x888888,
            side: THREE.DoubleSide
        });
        var geom = new THREE.CubeGeometry(
            0.02, 0.012, 0.003
        );
        var mesh = new THREE.Mesh(geom, mat2);
        var slider = new THREE.Object3D();
        slider.rotation.z = Math.PI / 1.5;
        slider.position.z = 0.0015;
        slider.add(mesh);
        var obj = new THREE.Object3D();
        obj.add(slider);
        return obj;
    };
    /**
     * @method route
     * @param {object} options ルートの設定
     * @return ルートの描画
     */
    ThreeUtil.route = function(options) {
        var geom = new THREE.Geometry();
        geom.vertices.push(new THREE.Vector3());
        geom.vertices.push(new THREE.Vector3());
        geom.vertices.push(new THREE.Vector3());
        geom.vertices.push(new THREE.Vector3());
        geom.faces.push(new THREE.Face4(0, 1, 2, 3));
        var mat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        var obj = new THREE.Mesh(geom, mat);
        var w = 0.0005;
        var p = [0, 0, 0, 1, 1, 0];

        function calc() {
            var a = SCNV.shiftLine(p[0], p[1], p[3], p[4], -w, 0);
            var b = SCNV.shiftLine(p[0], p[1], p[3], p[4], w, 0);
            geom.vertices[0].set(a[0], a[1], p[2]);
            geom.vertices[1].set(a[2], a[3], p[5]);
            geom.vertices[2].set(b[2], b[3], p[5]);
            geom.vertices[3].set(b[0], b[1], p[2]);
            geom.verticesNeedUpdate = true;
        }
        obj.setPosition = function(x0, y0, z0, x1, y1, z1) {
            p = [x0, y0, z0, x1, y1, z1];
            calc();
        };
        obj.setWidth = function(width) {
            w = Math.max(0.0005, Math.min(1, width)) * 0.005;
            calc();
        };
        return obj;
    };
    /**
     * @method pat
     * @param {number} num 
     * @return パスの描画
     */
    ThreeUtil.path = function(num) {
        num = num || 10;
        var geom = new THREE.Geometry();
        for (var i = 0; i < num; i++) {
            geom.vertices.push(new THREE.Vector3(0, 0, 0));
        }
        var mat = new THREE.LineBasicMaterial({
            color: 0x000000,
            //	    opacity: 0.7,
            //	    transparent: true,
            //	    blending: THREE.AdditiveBlending,
            linewidth: 3
        });
        var line = new THREE.Line(geom, mat, THREE.LineStrip);
        line.setPoints = function(arr) {
            var last = arr[arr.length - 1];
            var verts = this.geometry.vertices;
            for (var i = 0; i < verts.length; i++) {
                verts[i].set(last[0], last[1], last[2]);
            }
            for (var i = 0; i < arr.length; i++) {
                verts[i].set(arr[i][0], arr[i][1], arr[i][2]);
            }
            line.geometry.verticesNeedUpdate = true;
            return this;
        };
        line.setBezier = function(arr) {
            var last = arr[arr.length - 1];
            var verts = this.geometry.vertices;
            // reset by last point
            for (var i = 0; i < verts.length; i++) {
                verts[i].set(last[0], last[1], last[2]);
            }
            // curve 計算 bezier
            var f = bezierFunc3D(arr);
            var n_sub = 12;
            var length = Math.min(verts.length, n_sub * arr.length);
            for (var i = 0; i < length; i++) {
                var p = f(i / length);
                verts[i].set(p[0], p[1], p[2]);
            }
            line.geometry.verticesNeedUpdate = true;
            return this;
        };
        line.setCatmull = function(arr) {
            var last = arr[arr.length - 1];
            var verts = this.geometry.vertices;
            // reset by last point
            for (var i = 0; i < verts.length; i++) {
                verts[i].set(last[0], last[1], last[2]);
            }
            // curve 計算 catmull-rom
            var points = [];
            for (var i = 0; i < arr.length; i++) {
                points.push(new THREE.Vector3(arr[i][0], arr[i][1], arr[i][2]));
            }
            var spline = new THREE.Spline(points);
            var n_sub = 12;
            var length = Math.min(verts.length, n_sub * points.length);
            for (var i = 0; i < length; i++) {
                var position = spline.getPoint(i / length);
                verts[i].set(position.x, position.y, position.z);
            }
            line.geometry.verticesNeedUpdate = true;
            return this;
        };
        line.setHue = function(h) {
            var c = new THREE.Color();
            c.setHSL(h, 1.0, 0.5);
            line.material.color = c;
            line.material.needsUpdate = true;
            return this;
        };
        return line;
    };

})();
