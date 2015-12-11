# -*- coding: utf-8 -*-
"""
oflogviewer.models.overlay
~~~~~~~~~~~~~~~~~~~~~~~~~~
Redisよりオーバーレイ情報のログを取得するクラス

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import simplejson as json
from redis import Redis


class Overlay(object):
    client = Redis(host='172.18.102.1')

    def __init__(self):
        pass

    def search(self, key='overlay_*'):
        client = self.client
        keys = client.keys(key)
        response = []
        if len(keys) > 0:
            for k in keys:
                data = client.get(k)
                output = json.loads(data)

                response.append(output)

        return response
