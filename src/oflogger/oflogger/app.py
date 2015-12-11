# -*- coding: utf-8 -*-
"""
oflogger.app
~~~~~~~~~~~~
アプリケーションの基底クラス

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import time
import logging
from juggernaut import Juggernaut
from oflogger.models.meta import init_engine
from oflogger.utils.configloader import ConfigLoader
from oflogger.utils.connector import connect_redis
from oflogger.utils.connector import pop_redis as dequeue

from datetime import datetime

class App(object):
    log = logging.getLogger('oflogger')

    def __init__(self):
        self.config = {}

    def load_config(self, path):
        loader = ConfigLoader(path)

        #: TCP section did not use in Redis -> MySQL
        if loader.redis_configloder() is True:
            self.config['redis'] = loader.redis

        if loader.mysql_configloder() is True:
            self.config['mysql'] = loader.mysql

    def configure_logger(self, config):
        """
        Configure logger.

        :param config:
        """
        pass

    def configure_db(self, config):
        """
        Configure database settings.

        :param config: Config object
        """
        db = config.db
        host = config.host
        user = config.user
        password = config.passwd

        uri = 'mysql://{0}:{1}@{2}/{3}?charset=utf8&use_unicode=0'
        uri = uri.format(user, password, host, db)
        config = {'uri': uri, 'echo': False, 'pool_recycle': 3600}
        init_engine(config)

    def configure_redis(self, config):
        """
        Configure Redis settings.

        :param config: Config object
        """
        client = connect_redis(config)
        self.client = client

        return client

    def configure_publisher(self):
        client = self.client
        jug = Juggernaut(client)
        self.jug = jug

    def run(self, model):
        """
        Execute model object.

        :param model: Model object
        """
        config = self.config
        client = self.client

        m = model()
        m.set_publisher(self.jug)
        message = False
        for data in self.subscribe(client, config):
            if message:
                m.execute(data)
	    message = True

    def subscribe(self, client, config):
        """
        Subscribe Redis database.

        :param client:
        :param config:
        """
        redis_config = config['redis']
        interval = config['mysql'].interval
        try:
            while True:
                t1 = datetime.now()
                data = dequeue(client, redis_config)
                if len(data) > 0:
                    yield data
                t2 = datetime.now()
                dt = t2-t1
                secs = dt.seconds
                if (secs > interval): continue
                time.sleep(interval - secs)
        except KeyboardInterrupt:
            self.log.info('Ctr-c pressed. Quit receiving data from redis.')

    def subscribe_listen(self, client, channel='overlay'):
        pubsub = client.pubsub()
        pubsub.subscribe(channel)
        message = False
        for item in pubsub.listen():
            if message:
                yield item
	    message = True

    def listen(self, model, channel='overlay'):
        """
        listen

        :param client:
        """
        client = self.client
        m = model()
        m.set_publisher(self.jug)
        try:
            for item in self.subscribe_listen(client, channel):
                m.execute(item)
        except KeyboardInterrupt:
            self.log.info('Ctr-c pressed. Quit Redis pubsub.')
