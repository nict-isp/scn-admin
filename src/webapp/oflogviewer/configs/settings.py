# -*- coding: utf-8 -*-
"""
oflogviewer.configs.settings
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
アプリケーション設定

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import logging

class Settings(object):
    #: Debug mode
    DEBUG = True

    #: Secret key.
    SECRET_KEY = 'secret'

    #: SQLAlchemy settings.
    SQLALCHEMY_DATABASE_URI = 'mysql://oflogger:oflogger@localhost/oflogger?charset=utf8&use_unicode=0'
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_POOL_RECYCLE = 3600

    #: Logger.
    LOG_LEVEL = logging.DEBUG
    #DEBUG_LOG = 'var/log/debug.log'
    #ERROR_LOG = 'var/log/error.log'
    DEBUG_LOG = '../var/log/webapp_debug.log'
    ERROR_LOG = '../var/log/webapp_error.log'

    #: Cache settings.
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300

    #: Lang
    LANGS = ['ja', 'ja_JP', 'en']

    DATA_DIR = '%(root)s/data/sql/'

    STATIC_PATH = 'static/'

    MIDDLEWARES = ('oflogviewer.utils.method_rewrite.MethodRewrite',)
    PLUGINS_PATH = 'plugins/'

    REDIS_HOST = 'localhost'
    REDIS_PORT = 6379
    REDIS_SERVICE_EXPIRE = 60 * 60 * 24
    REDIS_DB = 10

class TestSettings(Settings):
    SQLALCHEMY_DATABASE_URI = 'mysql://oflogger:oflogger@localhost/oflogger_test?charset=utf8&use_unicode=0'
    SQLALCHEMY_ECHO = False

    DEBUG = False

    REDIS_HOST = 'localhost'
    REDIS_PORT = 6379
    REDIS_SERVICE_EXPIRE = 60 * 60 * 24
    REDIS_DB = 11

