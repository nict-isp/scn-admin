# -*- coding: utf-8 -*-
"""
oflogger.models.modelutil
~~~~~~~~~~~~~~~~~~~~~~~~~
モデルクラス用のユーティリティクラス

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import os
import simplejson as json
from redis import Redis

class ModelUtil(object):
    client = Redis(host='172.18.102.1')

    def __init__(self):
        self.connect(self)

    def connect(self):
        connect_redis = redis.StrictRedis(host="172.18.102.1", port=6379)

    def initialize_table(self):
        f = open(os.path.dirname(__file__) + "/servicetable.json","r")
        data = f.read()
        connect_redis.set("serviceTable",data)

        f = open(os.path.dirname(__file__) + "/overlaytable.json","r")
        data = f.read()
        connect_redis.set("overlayTable",data)
        
    def get_overlay_table(self):
        data = connect_redis.get("overlayTable")
        if data:
            overlay_table = json.loads(data)
        else:
            overlay_table = []
        return overlay_table

    def get_service_table(self):
        data = connect_redis.get("serviceTable")
        if data:
            service_table = json.loads(data)
        else:
            service_table = []
        return service_table

    def set_filter(self, pub_data):
        connect_redis.publish("viewfilter", json.dumps(pub_data))

