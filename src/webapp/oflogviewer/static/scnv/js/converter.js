/*!
 * Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
 * GPL3, see LICENSE for more details.
 */

/**
 * メッセージタイプが確認できるログへ変換する
 * !!!他の変換処理はしない!!!
 * !!!ログの解釈箇所は分離しない!!!
 * @class Converter
 */
(function(window) {
    var SCNV = window.SCNV || (window.SCNV = {});

    /**
     * @method SCNV.aligner
     * @param {string} log ログメッセージ
     * @return 入力されたログメッセージ（変換しない）
     */
    SCNV.aligner = function(log) {
        if (!log.data) {
            throw "no data log: " + JSON.stringify(log);
        }
        if (!log.data.messageType) {
            throw "no messageType: " + JSON.stringify(log);
        }
        return log;
    };

})(window);
