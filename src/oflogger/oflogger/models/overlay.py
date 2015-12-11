# -*- coding: utf-8 -*-
"""
oflogger.models.overlay
~~~~~~~~~~~~~~~~~~~~~~~
オーバーレイ情報のログ出力をPublishするモデルクラス
オーバーレイ情報はRedisで記憶する

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import time
import logging
import simplejson as json
from redis import Redis

class Overlay(object):
    log = logging.getLogger('overlay')
    def __init__(self):
        """ Initialize. """
        self.client = Redis(host='172.18.102.1')
        self.jug = None

    def set_publisher(self, client):
        self.jug = client

    def execute(self, data):
        client = self.client
        log = self.log

        overlay_data = json.loads(data['data'])
        src = overlay_data['Src']
        rule = overlay_data['Rule']

        if rule == 'r1' or rule == 'r7':
            redis_key = 'overlay_{0}_{1}'.format(src, rule)
        elif rule == 'r2':
            no = overlay_data['Value']['add.no']
            uid = overlay_data['Value']['add.uid']
            src = overlay_data['Value']['add.src']
            dst = overlay_data['Value']['add.dst']
            redis_key = 'overlay_{0}_{1}_{2}_{3}_{4}'.format(no, uid, src, dst, rule)
        elif rule == 'r3' or rule == 'r4':
            no = overlay_data['Value']['seq.no']
            uid = overlay_data['Value']['seq.uid']
            src = overlay_data['Value']['seq.src']
            dst = overlay_data['Value']['seq.dst']
            redis_key = 'overlay_{0}_{1}_{2}_{3}_{4}'.format(no, uid, src, dst, rule)
        elif rule == 'cr' or rule == 'dr':
            # dst = overlay_data['Dst']
            srcpath = overlay_data['Value']['src.path'] 
            dstpath = overlay_data['Value']['dst.path']
            # redis_key = 'overlay_{0}_{1}_{2}'.format(src, dst, rule)
            redis_key = 'overlay_{0}_{1}_{2}'.format(srcpath, dstpath, rule)

        if rule == 'r1' or rule == 'r2' or rule == 'r3' or rule == 'r4' or rule == 'r7':
            #: r1:insert, r2:add rule, r3:delete rule, r4:mod rule, r7:leave
            client.set(redis_key, json.dumps(overlay_data))
            log.debug('Save overlay data[{0}] to Redis'.format(rule))
        elif rule == 'cr' or rule == 'dr':
            #: cr:Create path
            client.set(redis_key, json.dumps(overlay_data))
            log.debug('Save overlay data[{0}] to Redis'.format(rule))
        elif rule == 'r0' or rule == 'r6':
            pass
        elif rule == 's1' or rule == 's2' or rule == 's3':
            pass

        self.jug.publish('oflogger-overlay', {'messageType': 'overlay', 'value': overlay_data})
        log.debug('Publish overlay data {0}'.format(overlay_data))
