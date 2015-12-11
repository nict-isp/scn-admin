# -*- coding: utf-8 -*-
"""
oflogger.models.servicepath
~~~~~~~~~~~~~~~~~~~~~~~~~~~
フロー情報のログ出力をPublishするモデルクラス
servicepath、servicepath_switch_relayテーブルを操作する

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import time
import logging
import tablib
import simplejson as json
from datetime import datetime
from sqlalchemy.orm.exc import NoResultFound
from sqlsoup import SQLSoup
from .meta import get_engine, get_session

class ServicePath(object):
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
        log = self.log
        db = self.db
        query = db.entity('servicepath')
        switch_query = db.entity('servicepath_switch_relay')
        for item in items:
            update = True
            pubdata = {
                'path_id': str(item['path_id']),
                'src_node_mac': item['srcNode_Mac'],
                'src_service_key': item['srcService_key'],
                'src_service_name': item['srcService_name'],
                'dst_node_mac': item['dstNode_Mac'],
                'dst_service_key': item['dstService_key'],
                'dst_service_name': item['dstService_name']
            }

            row = None
            try:
                row = query.filter(query.path_id==str(item['path_id'])).one()
            except NoResultFound:
                pass
            if row is None:
                log.info('Insert servicepath data[{0}]'.format(str(item['path_id'])))
                query.insert(path_id=str(item['path_id']),
                             src_node_mac=item['srcNode_Mac'],
                             src_service_key=item['srcService_key'],
                             src_service_name=item['srcService_name'],
                             dst_node_mac=item['dstNode_Mac'],
                             dst_service_key=item['dstService_key'],
                             dst_service_name=item['dstService_name'])
                update = True
            else:
                log.info('Update servicepath data[{0}]'.format(str(item['path_id'])))
                row.src_node_mac = item['srcNode_Mac']
                row.src_service_key = item['srcService_key']
                row.src_service_name = item['srcService_name']
                row.dst_node_mac = item['dstNode_Mac']
                row.dst_service_key = item['dstService_key']
                row.dst_service_name = item['dstService_name']


            switch = switch_query.filter(switch_query.path_id==str(item['path_id']))
            rows = switch.all()
            rows = [
                {
                    'path_id': str(row.path_id),
                    'switch_id': row.switch_id,
                    'switch_port': row.switch_port,
                    'switch_port_name': row.switch_port_name
                }
                for row in rows
            ]

            ret = self.is_diff(rows, item['switch'])
            switch.delete()
            switch_relay = []
            for i, s in enumerate(item['switch']):
                created_at = datetime.today().strftime('%Y-%m-%d %H:%M:%S')
                switch_query.insert(path_id=str(item['path_id']),
                                    switch_id=s['id'],
                                    switch_port=s['sw_port'],
                                    switch_port_name=s['sw_portName'],
                                    ordered_id=i
                                    )

                switch_relay.append({
                    'switch_id': s['id'],
                    'switch_port': s['sw_port'],
                    'switch_port_name': s['sw_portName']
                })


            if ret is True or update is True:
                pubdata['switch'] = switch_relay
                self.log.info('Publish service path data {0}'.format(pubdata))
                self.jug.publish('oflogger', {'messageType': 'paths', 'value': pubdata})

            db.commit()

    def is_diff(self, original_data, new_data):
        """
        Diff DB data and new data.

        :param original_data:
        :param new_data:
        """
        headers = ['switch_id', 'switch_port', 'switch_port_name']
        ds1 = tablib.Dataset(headers=headers)
        for d in original_data:
            ds1.rpush([d['switch_id'], d['switch_port'], d['switch_port_name']])

        ds2 = tablib.Dataset(headers=headers)
        for d in new_data:
            ds2.rpush([d[u'id'], int(d[u'sw_port']), d[u'sw_portName']])

        d1 = json.loads(ds1.json)
        d2 = json.loads(ds2.json)

        d1.sort()
        d2.sort()

        return d1 == d2

    def execute(self, data):
        self.log.info('Receive service path data {0}'.format(data))
        self.create(json.loads(data['data']))
