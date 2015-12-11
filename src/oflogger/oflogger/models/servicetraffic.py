# -*- coding: utf-8 -*-
"""
oflogger.models.servicetraffic
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ネットワークトラフィック情報のログ出力をPublishするモデルクラス
servicetraffic、servicepathテーブルを操作する

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import time
import logging
import simplejson as json
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm.exc import NoResultFound
from sqlsoup import SQLSoup
from .meta import get_engine, get_session

class ServiceTraffic(object):
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
        query = db.entity('servicetraffic')
        path_query = db.entity('servicepath')
        for item in items:
            row = None
            try:
                row = query.filter(query.path_id==str(item['path_id'])).one()
            except NoResultFound:
                pass


            decimal = Decimal(str(item['traffic']))
            item['traffic'] = decimal.quantize(Decimal('.000'),
                                               rounding=ROUND_HALF_UP)

            if row is None:
                try:
                    row = path_query.filter(path_query.path_id==str(item['path_id'])).one()
                    query.insert(path_id=str(item['path_id']),
                                 src_service_name=item['srcService_name'],
                                 dst_service_name=item['dstService_name'],
                                 traffic=item['traffic'])
                    self.publish(item)

                except NoResultFound:
                    msg = 'path_id[{0}] did not exists in servicepath table.'
                    self.log.critical(msg.format(item['path_id']))

            else:
                if row.src_service_name == item['srcService_name'] and \
                        row.dst_service_name == item['dstService_name'] and \
                        row.traffic != item['traffic']:
                    self.publish(item)

                row.src_service_name = item['srcService_name']
                row.dst_service_name = item['dstService_name']
                row.traffic = item['traffic']

            db.commit()

    def publish(self, data):
        pubdata = {
            'path_id': str(data['path_id']),
            'src_service_name': data['srcService_name'],
            'dst_service_name': data['dstService_name'],
            'timestamp': datetime.now().strftime('%Y/%m/%d %H:%M:%S'),
            'traffic': str(data['traffic'])
        }
        self.log.debug('Publish service traffic data {0}'.format(pubdata))
        self.jug.publish('oflogger', {'messageType': 'traffics', 'value': pubdata})

    def execute(self, data):
        self.log.debug('Receive service traffic data {0}'.format(data))
        self.create(json.loads(data['data']))
