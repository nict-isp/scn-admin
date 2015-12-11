# -*- coding: utf-8 -*-
"""
bandwidth
~~~~~~~~~
バンド幅のログ出力をInsert・Publishするモデルクラス

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import time
import logging
import datetime
import simplejson as json
from sqlsoup import SQLSoup
from .meta import get_engine, get_session

class Bandwidth(object):
    log = logging.getLogger('oflogger')

    def __init__(self):
        """ Initialize. """
        engine = get_engine()
        session = get_session()
        self.db = SQLSoup(engine, session=session)
        self.jug = None

    def set_publisher(self, client):
        self.jug = client

    def create(self, items):
        db = self.db
        query = db.entity('latest_route')
        query_route = db.entity('route')

        query.delete()
        for item in items:
            created_at = datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S')
            query.insert(src_switch_id=item['src_switch_id'],
                         src_switch_port=item['src_switch_port'],
                         dst_switch_id=item['dst_switch_id'],
                         dst_switch_port=item['dst_switch_port'],
                         bandwidth=item['bandwidth'],
                         get_data_time=created_at)


            query_route.insert(src_switch_id=item['src_switch_id'],
                               src_switch_port=item['src_switch_port'],
                               dst_switch_id=item['dst_switch_id'],
                               dst_switch_port=item['dst_switch_port'],
                               bandwidth=item['bandwidth'],
                               get_data_time=created_at)

            item['bandwidth'] = (float(item['bandwidth']) * 8) / 1000

            self.log.debug('Publish bandwidth data {0}'.format(item))
            self.jug.publish('oflogger', {'messageType': 'routes', 'value': item})

            db.commit()

    def execute(self, data):
        self.log.debug('Receive bandwidth data {0}'.format(data))
        self.create(json.loads(data['data']))
