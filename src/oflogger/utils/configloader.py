# -*- coding: utf-8 -*-
"""
configloader
~~~~~~~~~~~~
コンフィグファイルのローダー

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import logging
import ConfigParser


class TcpConfig(object):
    """ TCPの接続設定ブロックを読み出す
    """
    def __init__(self, host=None, port=None, interval=None, retry=None,
                 cmd=None):
        self.host = host
        self.port = port
        self.interval = interval
        self.retry = retry
        self.cmd = cmd


class MysqlConfig(object):
    """ MySQLの接続設定ブロックを読み出す
    """
    def __init__(self, db=None, host=None, user=None, passwd=None,
                 interval=None):
        self.db = db
        self.host = host
        self.user = user
        self.passwd = passwd


class RedisConfig(object):
    """ Redisの接続設定ブロックを読み出す
    """
    def __init__(self, host=None, port=None, db=None, key=None, interval=None):
        self.host = host
        self.port = port
        self.db = db
        self.key = key
        self.interval = interval


class NoneError(Exception):
    """ 必須キーの不足を示すエラー
    """
    pass


class ConfigLoader(object):
    """ コンフィグファイルのローダー
    """

    def __init__(self, file_name):
        self.conf = ConfigParser.SafeConfigParser()
        self.conf.read(file_name)

    def tcp_configloder(self):
        """ TCPの接続設定を読み出す
        """
        self.tcp = TcpConfig()

        try:
            self.tcp.host = self.conf.get('TCP', 'host')
            self.tcp.port = self.conf.get('TCP', 'port')
            self.tcp.interval = self.conf.get('TCP', 'interval')
            self.tcp.retry = self.conf.get('TCP', 'retry')
            self.tcp.cmd = self.conf.get('TCP', 'cmd')

            if self.tcp.host == '':
                raise NoneError('host is None. Set \"config.ini\".')

            if self.tcp.port == '':
                raise NoneError('port is None. Set \"config.ini\".')
            self.tcp.port = int(self.tcp.port)

            if self.tcp.interval == '':
                raise NoneError('interval is None. Set \"config.ini\".')
            self.tcp.interval = float(self.tcp.interval)

            if self.tcp.retry == '':
                raise NoneError('retry is None. Set \"config.ini\".')
            self.tcp.retry = int(self.tcp.retry)

            if self.tcp.cmd == '':
                raise NoneError('cmd is None. Set \"config.ini\".')

            return True

        except Exception as e:
            logging.error('Config_Error(TCP):%s' % e)
            return False


    def redis_configloder(self):
        """ Redisの接続設定を読み出す
        """
        self.redis = RedisConfig()

        try:
            self.redis.host = self.conf.get('Redis', 'host')
            self.redis.port = self.conf.get('Redis', 'port')
            self.redis.db = self.conf.get('Redis', 'db')
            self.redis.key = self.conf.get('Redis', 'key')

            if self.redis.host == '':
                raise NoneError('host is None. Set \"config.ini\".')

            if self.redis.port == '':
                raise NoneError('port is None. Set \"config.ini\".')
            self.redis.port = int(self.redis.port)

            if self.redis.db == '':
                raise NoneError('db is None. Set \"config.ini\".')
            self.redis.db = int(self.redis.db)

            if self.redis.key == '':
                raise NoneError('key is None. Set \"config.ini\".')

            return True

        except Exception as e:
            logging.error('Config_Error(Redis):%s' % e)
            return False


    def mysql_configloder(self):
        """ MySQLの接続設定を読み出す
        """
        self.mysql = MysqlConfig()

        try:
            self.mysql.db = self.conf.get('MySQL', 'db')
            self.mysql.host = self.conf.get('MySQL', 'host')
            self.mysql.user = self.conf.get('MySQL', 'user')
            self.mysql.passwd = self.conf.get('MySQL', 'passwd')
            self.mysql.interval = self.conf.get('MySQL', 'interval')

            if self.mysql.db == '':
                raise NoneError('db is None. Set \"config.ini\".')

            if self.mysql.host == '':
                raise NoneError('host is None. Set \"config.ini\".')

            if self.mysql.user == '':
                raise NoneError('user is None. Set \"config.ini\".')

            if self.mysql.passwd == '':
                raise NoneError('passwd is None. Set \"config.ini\".')

            if self.mysql.interval == '':
                raise NoneError('interval is None. Set \"config.ini\".')
            self.mysql.interval = float(self.mysql.interval)

            return True

        except Exception as e:
            logging.error('Config_Error(MySQL):%s' % e)
            return False
