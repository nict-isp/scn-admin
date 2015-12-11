# -*- coding: utf-8 -*-
"""
oflogger.models.servicelocation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
サービス位置情報のログ出力をPublishするモデルクラス
servicelocationテーブルを操作する

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import logging
import simplejson as json
from sqlalchemy.orm.exc import NoResultFound
from sqlsoup import SQLSoup
from .meta import get_engine, get_session

class ServiceLocation(object):
    log = logging.getLogger('oflogger')
    def __init__(self):
        """ Initialize. """
        engine = get_engine()
        session = get_session()
        self.db = SQLSoup(engine, session=session)
        self.jug = None

    def set_publisher(self, client):
        self.jug = client

    def create(self, item):
        db = self.db
        query = db.entity('servicelocation')

        #for item in items:
        row = None
        try:
            self.log.info('before query item = [{0}]'.format(item))
            row = query.filter(query.node_ip==item['node_ip']) \
                       .filter(query.service_name==item['service_name']).first()
        except NoResultFound:
            pass

        self.log.info('found item = [{0}]'.format(item))

        if item['mode'] == 'ADD':
            if row is None:
                self.log.info('NEW DATA')

                query.insert(node_ip=item['node_ip'],
                             service_key=item['service_key'],
                             service_name=item['service_name'])
                self.publish(item)
            else:
                self.log.info('EXISTING DATA')

                # if row.service_key != item['service_key']:
                self.log.info('UPDATE')
                self.publish(item)

                row.service_key = item['service_key']

        elif item['mode'] == 'DEL':
            if row is None:
              pass

            else:
                db.delete(row)
                self.publish(item)

        else:
            pass

        db.commit()

    def publish(self, data):
        self.jug.publish('oflogger', {'messageType': 'services', 'value': data})
        self.log.info('publish service location data {0}'.format(data))

    def execute(self, data):
        self.log.info('Receive service location data {0}'.format(data))
        self.create(json.loads(data['data']))
