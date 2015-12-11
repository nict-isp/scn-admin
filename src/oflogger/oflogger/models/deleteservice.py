# -*- coding: utf-8 -*-
"""
oflogger.models.deleteservice
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
サービス離脱情報のログ出力をPublishするモデルクラス（未使用・未実装）

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import time
import logging
import simplejson as json
from redis import Redis

class DeleteService(object):
    log = logging.getLogger('deleteservice')
    def __init__(self):
        """ Initialize. """
        self.client = Redis(host='172.18.102.1')
        self.jug = None

    def set_publisher(self, client):
        self.jug = client

    def execute(self, data):
        client = self.client
        log = self.log
        print data

        #delete_data = json.loads(data['data'])
