/*!
 * Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
 * GPL3, see LICENSE for more details.
 */
/**
 * アニメーション用のワーカー
 * @class Animator
 */
/**
 * @method onmessage
 * @param e
 */
var timerId = 0;
onmessage = function(e) {
    if (timerId !== 0) {
        clearInterval(timerId);
        timerId = 0;
    }
    if (e.data > 0) {
        timerId = setInterval(function() {
            postMessage(null);
        }, e.data);
    }
};
