# -*- coding: utf-8 -*-
"""
oflogger.models.topology
~~~~~~~~~~~~~~~~~~~~~~~~
トポロジー情報のログ出力をPublishするモデルクラス（未使用）

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import logging
import datetime
import simplejson as json
from sqlalchemy.orm.exc import NoResultFound
from sqlsoup import SQLSoup
from .meta import get_engine, get_session

class Topology(object):
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
        query_switch = db.entity('switch')
        query_swport = db.entity('switchport')

        for item in items:
            created_at = datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S')

            sw = item['switch']
            row = None
            try:
                row = query_switch.filter(query_switch.switch_id==sw['id']) \
                                  .one()
                row.switch_flag = 'N'
                row.switch_latest_time = created_at
            except NoResultFound:
                pass

            for port in item['switchport']:
                print port

    def execute(self, data):
        self.log.debug('Receive topology data {0}'.format(data))
        self.create(json.loads(data['data']))
