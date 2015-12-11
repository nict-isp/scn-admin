# -*- coding: utf-8 -*-
"""
oflogger.tests.test_app
~~~~~~~~~~~~~~~~~~~~~~~
アプリケーションの動作確認用クラス

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import os
import ConfigParser
from unittest import TestCase
from oflogger.app import App
from oflogger.models.meta import Session, Base

class TestApp(TestCase):
    def setUp(self):
        self.app = App()
        root_path = os.path.dirname(os.path.abspath(__file__))
        self.config_path = root_path + '/test.ini'
        self.app.load_config(self.config_path)

    def _load_mysql_conf(self, path):
        loader = ConfigParser.SafeConfigParser()
        loader.read(path)
        host = loader.get('MySQL', 'host')
        db = loader.get('MySQL', 'db')
        user = loader.get('MySQL', 'user')
        password = loader.get('MySQL', 'passwd')

        return host, db, user, password


    def _load_redis_conf(self, path):
        loader = ConfigParser.SafeConfigParser()
        loader.read(self.config_path)
        host = loader.get('Redis', 'host')
        port = loader.get('Redis', 'port')
        db = loader.get('Redis', 'db')
        key = loader.get('Redis', 'key')

        return host, port, db, key

    def test_load_redis_config(self):
        """ load_config() should load Redis conf from test.ini. """
        host, port, db, key = self._load_redis_conf(self.config_path)

        self.assertEquals(self.app.config['redis'].host, host)
        self.assertEquals(self.app.config['redis'].port, int(port))
        self.assertEquals(self.app.config['redis'].db, int(db))
        self.assertEquals(self.app.config['redis'].key, key)

    def test_load_mysql_config(self):
        """ load_config() should load Redis conf from test.ini. """
        host, db, user, password = self._load_mysql_conf(self.config_path)

        self.assertEquals(self.app.config['mysql'].host, host)
        self.assertEquals(self.app.config['mysql'].db, db)
        self.assertEquals(self.app.config['mysql'].user, user)
        self.assertEquals(self.app.config['mysql'].passwd, password)

    def test_configuire_db(self):
        """ configure_db() should create db engine. """
        host, db, user, password = self._load_mysql_conf(self.config_path)
        excepted = 'mysql://{0}:{1}@{2}/{3}?charset=utf8&use_unicode=0'
        excepted = excepted.format(user, password, host, db)

        self.app.configure_db(self.app.config['mysql'])
        url = Session.connection().engine.url
        self.assertEquals(str(url), excepted)

    def test_configuire_redis(self):
        """ configure_redis() should create redis client. """
        from redis import Redis

        client = self.app.configure_redis(self.app.config['redis'])
        self.assertTrue(isinstance(client, Redis))


