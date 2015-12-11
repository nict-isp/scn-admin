# -*- coding: utf-8 -*-
"""
oflogger.models.bandwidth
~~~~~~~~~~~~~~~~~~~~~~~~~
ネットワークコマンドのログ出力をPublishするモデルクラス
servicecommandテーブルを操作する

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import re
import logging
import time
import datetime
import tablib
import simplejson as json
from sqlalchemy.orm.exc import NoResultFound
from sqlsoup import SQLSoup
from .meta import get_engine, get_session

class ServiceCommand(object):
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
        query = db.entity('servicecommand')

        def tm2dt(tm):
            return datetime.datetime.fromtimestamp(int(tm))

        def dt2tm(dt):
            return time.mktime(dt.timetuple())


        def replace(data):
            data = re.sub(r'^i,', 'RGT(', data)
            data = re.sub(r'^s,', 'SRH(', data)
            data = re.sub(r'^cm,', 'CP(', data) 

            ret = '{0})'.format(data)

            return ret

        for item in items:
            rows = []
            try:
                rows = query.filter(query.service_name==item['service_key']) \
                            .all()

            except NoResultFound:
                pass

            ret = False
            if len(rows) > 0:
                commands = [
                    {
                        'service_name': data.service_name,
                        'commands': data.commands,
                        'command_created_at': int(dt2tm(data.command_created_at))
                    }
                    for data in rows
                ]

            new_commands = [
                {
                    'service_name': item['service_key'],
                    'command': data['command'],
                    'timestamp': int(data['timestamp'])
                }
                for data in item['commands']
            ]

            item['commands'] = new_commands

            query.filter(query.service_name==item['service_key']) \
                 .delete()
            for cmd in item['commands']:

                query.insert(service_name=item['service_key'],
                             commands=cmd['command'],
                             command_created_at=tm2dt(cmd['timestamp']))

                self.publish(cmd)

            db.commit()

    def publish(self, item):
        item['commands'] = item['command']
        item['timestamp'] = datetime.datetime.fromtimestamp(item['timestamp']) \
                                    .strftime("%Y/%m/%d %H:%M:%S")
        del item['command']

        self.log.info('Publish command data {0}'.format(item['commands']))
        self.jug.publish('oflogger', {'messageType': 'commands', 'value': item})


    def is_diff(self, original_data, new_data):
        """
        Diff DB data and new data.

        :param original_data:
        :param new_data:
        """
        headers = ['service_name', 'commands', 'command_created_at']
        ds1 = tablib.Dataset(headers=headers)
        for d in original_data:
            ds1.rpush([d['service_name'], d['commands'], d['command_created_at']])

        ds2 = tablib.Dataset(headers=headers)
        for d in new_data:
            ds2.rpush([d['service_name'], d['commands'], d['timestamp']])

        d1 = json.loads(ds1.json)
        d2 = json.loads(ds2.json)

        d1.sort()
        d2.sort()

        return d1 == d2

    def execute(self, data):
        self.log.debug('Receive servicecommand data {0}'.format(data))
        self.create(json.loads(data['data']))
