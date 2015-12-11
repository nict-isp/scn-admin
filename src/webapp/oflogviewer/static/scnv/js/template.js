/*!
 * Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
 * GPL3, see LICENSE for more details.
 */
var SCNV = SCNV || {};

/**
 * テンプレートクラス 
 * @class SCNV.templates
 */
SCNV.templates = {};

/**
 * 日付表示形式関数
 * @method formatTimestamp
 * @param {number} unixtime UNIX時刻ミリ秒
 */
SCNV.templates.formatTimestamp = _.template(' \
    <%= h %>:<%= m %>:<%= s %> \
');

/**
 * @method timeHHMMSS
 * @param {number} unixtime UNIX時刻ミリ秒
 * @return タイプスタンプオブジェクト
 */
SCNV.templates.timeHHMMSS = function(unixtime) {
    var t = new Date();
    t.setTime(unixtime);
    return SCNV.templates.formatTimestamp({
        h: ("0" + t.getHours()).slice(-2),
        m: ("0" + t.getMinutes()).slice(-2),
        s: ("0" + t.getSeconds()).slice(-2)
    });
};

/**
 * @method shorting
 * @param {string} str
 * @return {string} 入力文字列（処理なし） 
 */
SCNV.templates.shorting = function(str) {
    return str;
    //
    //  sample function! it should be replace
    //  user defined table or so.
    //
    //  Sample
    //
    //    GeoTwitter_queryif
    //    GeoTwitter_dbm
    //    GeoSocialWeb
    //    Earthquake_sensing
    //    Earthquake_process
    //    Earthquake_queryif
    //    Earthquake_dbm
    //    EarthquakeOverlay
    //    Be_some_02
    //  
    //  Rule
    //
    //  - Devide str to words by capital or under-bar
    //  - Use first word first 2 chars
    //  - Use last word first 2 chars
    //  - if first or last word lenght==1 then
    //    second word used (Ex someDB -> SoDB
    //
    var token = str.replace(/([A-Z])/g, "_$1").split("_");
    var first = null;
    var second = null;
    var ntol = null;
    var last = null;
    for (var i = 0; i < token.length; i++) {
        if (token[i] !== null && token[i] !== undefined && token[i] !== "") {
            if (second === null && first !== null) {
                second = token[i];
            }
            if (first === null) {
                first = token[i];
            }
            ntol = last;
            last = token[i];
        }
    }
    var word = "";
    if (first.length === 1) {
        word += first.toUpperCase() + second[0].toLowerCase();
    } else {
        word += first[0].toUpperCase() + first[1].toLowerCase();
    }
    if (last.length === 1) {
        word += ntol[0].toUpperCase() + last[0].toUpperCase();
    } else {
        word += last[0].toUpperCase() + last[1].toUpperCase();
    }
    return word;
};

/**
 * @property debugCounter
 * @type {string} HTML
 */
SCNV.templates.debugCounter = _.template(' \
    Log counter debug dialog<br /> \
    <table> \
    <tr> \
        <td><b></b></td> \
        <td><b>total count</b></td> \
        <td><b>count/sec</b></td> \
    </tr><tr> \
        <td>receive log</td> \
        <td><%= stats.recv %></td> \
        <td><%= (1000*stats.recv_ps).toFixed(0) %></td> \
    </tr><tr> \
        <td>processed logs</td> \
        <td><%= stats.proc %></td> \
        <td><%= (1000*stats.proc_ps).toFixed(0) %></td> \
    </tr> \
    </table> \
    receive logs<br /> \
    <table> \
    <tr> \
        <td><b></b></td> \
        <td><b>redis</b></td> \
        <td><b>mysql</b></td> \
        <td><b>total</b></td> \
     <% _.each(redis, function(v,k) { %> \
        <% if (!_.isNumber(v)) { return true; } %> \
        </tr><tr> \
        <td><%= k  %></td> \
        <td><%= redis[k] %></td> \
        <td><%= mysql[k] %></td> \
        <td><%= redis[k]+mysql[k] %></td> \
    <%}); %> \
     <% _.each(redis.overlay_types, function(v,k) { %> \
        </tr><tr> \
        <td><%= k  %></td> \
        <td><%= redis.overlay_types[k] %></td> \
        <td><%= mysql.overlay_types[k] %></td> \
        <td><%= redis.overlay_types[k]+mysql.overlay_types[k] %></td> \
    <%}); %> \
     <% _.each(redis.commands_types, function(v,k) { %> \
        </tr><tr> \
        <td><%= k  %></td> \
        <td><%= redis.commands_types[k] %></td> \
        <td><%= mysql.commands_types[k] %></td> \
        <td><%= redis.commands_types[k]+mysql.commands_types[k] %></td> \
    <%}); %> \
    </tr> \
    </table> \
    <div style="float: right">!! Double click to hide the dialog !!</div> \
');

SCNV.templates.switchLabel = _.template(' \
    <%= label %> \
');
SCNV.templates.nodeLabel = _.template(' \
    <%= label %> \
');

/**
 * @property button
 * @type {string} HTML
 */
SCNV.templates.button = _.template(' \
    <%= label %> \
');

/**
 * @property overlayDetail
 * @type {string} HTML
 */
SCNV.templates.overlayDetail = _.template(' \
    <div class="graph"></div> \
    <div class="label"><%= label %></div> \
    <div class="text"> \
        <% _.each(ruleList, function(v) {  %> \
            <%= v[0] %> &rarr;<br /> <%= v[1]  %><br /> \
        <% });  %> \
    </div> \
');

/**
 * @property overlayDetailText
 * @type {string} HTML
 */
SCNV.templates.overlayDetailText = _.template(' \
');

/**
 * @property newIcon
 * @type {string} HTML
 */
SCNV.templates.newIcon = _.template(' \
    <span class="newIcon">new!</span>&nbsp; \
');

/**
 * @property trafficChip
 * @type {string} HTML
 */
SCNV.templates.trafficChip = _.template(' \
<div class="trafficChip">  \
    <span class="traffic"><%= value %></span>&nbsp; \
    <span style="color:<%= color %>" class="srcLabel"><%= SCNV.templates.shorting(src) %></span> \
    <span style="color:<%= color %>" class="dstLabel"><%= SCNV.templates.shorting(dst) %></span> \
</div> \
');

/**
 * @property commandChip
 * @type {string} HTML
 */
SCNV.templates.commandChip = _.template(' \
<div class="commandChip">  \
    <span class="timestamp"><%= SCNV.templates.timeHHMMSS(time) %></span> &nbsp; \
    <span class="<%= type %>"><%= type %></span> \
    <span class="text">  \
        <%= SCNV.templates.shorting(src) %>&nbsp  \
        <%= SCNV.templates.shorting(dst) %> \
    </span>  \
</div> \
');

/**
 * @property overlayChip
 * @type {string} HTML
 */
SCNV.templates.overlayChip = _.template(' \
<div class="overlayChip">  \
    <span class="timestamp"><%= SCNV.templates.timeHHMMSS(time) %></span> &nbsp; \
    <span class="text" style="color: <%= color %>"><%= text %></span> \
</div> \
');

//    <span class="type">[<%= rule %>, <%= SCNV.templates.shorting(src) %>]</span> \
