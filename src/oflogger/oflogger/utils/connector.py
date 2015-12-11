#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
oflogger.utils.connector
~~~~~~~~~~~~~~~~~~~~~~~~

データベース等への接続ユーティリティ

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import logging
import datetime
import json
import redis
import MySQLdb


def get_time():
    get_time = datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S')
    return get_time


def connect_mysql(conf):
    db = conf.mysql.db
    host = conf.mysql.host
    user = conf.mysql.user
    passwd = conf.mysql.passwd
    logging.debug('MySQL:db=%s host=%s user=%s passwd=%s'
                  % (db, host, user, passwd))
    try:
        mysql_client = MySQLdb.connect(db=db, host=host,
                                       user=user, passwd=passwd,
                                       charset='utf8')
        logging.info('Connect to MySQL...OK')
    except MySQLdb.Error as e:
        mysql_client = False
        logging.error('MySQL_ConnectionError:%s' % e)
    except Exception as e:
        mysql_client = False
        logging.error('MySQL_Error:%s' % e)
    return mysql_client


def connect_redis(conf):
    host = conf.host
    port = conf.port
    db = conf.db
    key = conf.key
    logging.debug('Redis:host=%s port=%s db=%s key=%s'
                  % (host, port, db, key))
    connect_redis = redis.Redis(host=host, port=port, db=db)
    try:
        # Connection check
        is_exists_key = connect_redis.exists(key)
        logging.debug('Connect to Redis...OK')
        logging.debug('Redis key exists?[%s]' % is_exists_key)
    except redis.exceptions.ConnectionError as e:  # Host:port Error
        connect_redis = False
        logging.error('Redis_ConnectionError:%s' % e)
    except redis.exceptions.ResponseError as e:  # DB index Error
        connect_redis = False
        logging.error('Redis_ResponseError:%s' % e)
    except Exception as e:
        connect_redis = False
        logging.critical('Redis_Error:%s' % e)
    return connect_redis


def pop_redis(connect_redis, conf):
    json_data = ''
    data = []
    try:
        json_data = connect_redis.lpop(conf.key)
        if json_data is None:
            pop_time = get_time()
            logging.debug('No Data in Redis<%s>' % pop_time)
        else:
            data = json.loads(json_data)
    except Exception as e:
        logging.debug('json_data = %s' % json_data)
        data = False
        logging.critical('Error(pop_redis):%s' % e)
    return data
