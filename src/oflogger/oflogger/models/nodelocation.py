# -*- coding: utf-8 -*-
"""
oflogger.models.nodelocation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ノード位置情報のログ出力をPublishするモデルクラス
nodelocationテーブルを操作する

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import logging
import simplejson as json
from sqlalchemy.orm.exc import NoResultFound
from sqlsoup import SQLSoup
from .meta import get_engine, get_session

class NodeLocation(object):
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
        query = db.entity('nodelocation')
        for item in items:
            row = None
            try:
                row = query.filter(query.node_mac==item['node_mac']) \
                           .filter(query.node_ip==item['node_ip']).one()
            except NoResultFound:
                pass

            if row is None:
                query.insert(node_ip=item['node_ip'],
                             node_mac=item['node_mac'],
                             node_alive=item['node_alive'],
                             switch_id=item['sw_id'],
                             switch_port=item['sw_port'],
                             switch_port_name=item['sw_portName'],
                             vgw_ip=item['vGW_IP'])

                self.publish(item)
            else:
                if row.node_ip == item['node_ip'] and \
                        row.node_mac == item['node_mac'] and \
                        row.node_alive == item['node_alive'] and \
                        row.switch_id == long(item['sw_id']) and \
                        row.switch_port == long(item['sw_port']) and \
                        row.switch_port_name == item['sw_portName'] and \
                        row.vgw_ip == item['vGW_IP']:
                    pass
                else:
                    self.publish(item)

                row.node_ip = item['node_ip']
                row.node_mac = item['node_mac']
                row.node_alive = item['node_alive']
                row.switch_id = item['sw_id']
                row.switch_port = item['sw_port']
                row.switch_port_name = item['sw_portName']
                row.vgw_ip = item['vGW_IP']

            db.commit()

    def publish(self, data):
        pubdata = {
            'node_ip': data['node_ip'],
            'node_mac': data['node_mac'],
            'node_alive': data['node_alive'],
            'switch_id': data['sw_id'],
            'switch_port': data['sw_port'],
            'switch_port_name': data['sw_portName'],
            'vgw_ip': data['vGW_IP'],
        }
        self.log.debug('Publish node location data {0}'.format(pubdata))
        self.jug.publish('oflogger', {'messageType': 'nodes', 'value': pubdata})

    def execute(self, data):
        self.log.debug('Receive node location data {0}'.format(data))
        self.create(json.loads(data['data']))
