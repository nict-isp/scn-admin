/*!
 * Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
 * GPL3, see LICENSE for more details.
 */
function loadApp(router) {
    'use strict';
    var Topology = Backbone.Model.extend({});
    var Topologies = Backbone.Collection.extend({
        model: Topology,
        initialize: function() {
            this.url = '/api/topology/'
        },
        parse: function(res) {
            return res;
        }
    });

    var Update = Backbone.Model.extend({});

    function repairTypeLessData(data) {
        if (typeof(data.messageType) == 'undefined') {
            var key = Object.keys(data)[0];
            data = {
                messageType: key,
                value: data[key]
            };
            console.log(key);
        }
        return data;
    }

    var AppView = Backbone.View.extend({
        router: null,
        initialize: function() {
            _.bindAll(this, 'render');
            this.collection = new Topologies();
            //      this.collection.bind('add', this.render, this);
            var jug = new Juggernaut;
            jug.subscribe('oflogger', this.oflogger);
            jug.subscribe('oflogger-overlay', this.overlay);
        },
        oflogger: function(data) {
            data = repairTypeLessData(data);
            if (data.messageType == 'paths') {
                //console.log(data.value.src_service_name, data.value.path_id);
            }
            router.append({
                data: data,
                isInit: false
            });
        },
        overlay: function(data) {
            router.append({
                data: data,
                isInit: false
            });
        },
        add: function(collection, res) {
            router.append({
                data: res,
                isInit: true
            });
        },
        render: function() {
            this.collection.fetch({
                dataType: 'json',
                success: $.proxy(this.add, this)
            });
            return this;
        }
    });

    var AppRouter = Backbone.Router.extend({
        routes: {
            '': 'root'
        },
        root: function() {
            var app = new AppView();
            app.router = router;
            app.render();
        }
    });

    new AppRouter();
    Backbone.history.start();
}
