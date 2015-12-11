#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
topology
~~~~~~~~
トポロジ情報を登録するためのアプリケーション

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import os
import datetime
import sys
import time
import logging

# MySQL imports
import MySQLdb
from MySQLdb.cursors import DictCursor
from juggernaut import Juggernaut

# Local library specific imports
from utils.makelog import makelog
from utils.configloader import ConfigLoader
from utils.connector import connect_mysql, connect_redis, pop_redis


# 定数（値を変更したい場合は、各テーブルのflagカラムのenum型も変更する必要がある）
LIVE_FLAG = 'Y'
DEAD_FLAG = 'N'

jug = Juggernaut()


def get_time():
    get_time = datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S')
    return get_time


def select_db_data(cur):
    try:
        # 全てのフラグを'N'にする
        reset_time = get_time()
        reset_flag = DEAD_FLAG
        cur.execute("""
                    UPDATE switch SET switch_latest_time=%s, switch_flag=%s
                    """
                    , (reset_time, reset_flag))
        cur.execute("""
                    UPDATE switchport SET switchport_latest_time=%s,
                                          switchport_flag=%s
                    """
                    , (reset_time, reset_flag))

        cur.execute("""SELECT switch_id, switch_ip, switch_mac FROM switch""")
        db_sdata = cur.fetchall()
        # 後に要素を変更する必要があるため、タプルをリストに変換
        db_sdata = [db_switch for db_switch in db_sdata]
        logging.debug(db_sdata)

        cur.execute("""SELECT switch_id, switch_ip,
                    switchport_mac, switchport_port, switchport_ip
                    FROM switchport
                    """
                    )
        db_spdata = cur.fetchall()
        # 後に要素を変更する必要があるため、タプルをリストに変換
        db_spdata = [db_switchport for db_switchport in db_spdata]
        logging.debug(db_spdata)

        # switchのデータにswitchportのデータを結合
        for db_switch in db_sdata:
            switchport_list = []
            index = 0
            for count in range(len(db_spdata)):
                db_switchport = db_spdata[index]
                if ((int(db_switch['switch_id']) ==
                     int(db_switchport['switch_id'])) and
                    (db_switch['switch_ip'] == db_switchport['switch_ip'])):
                    switchport_list.append(db_switchport)
                    db_spdata.remove(db_switchport)
                else:
                    index += 1
            if switchport_list:
                db_switch['switchport'] = switchport_list

        logging.debug(db_spdata)

    except Exception as e:
        logging.info(e)
        return False

    return db_sdata


def show_switch(switch, switch_latest_time, switch_flag):
    logging.info('switch_id = %s' % switch['id'])
    logging.info('switch_ip = %s' % switch['ip'])
    logging.info('switch_mac = %s' % switch['mac'])
    logging.info('switch_latest_time = %s' % switch_latest_time)
    logging.info('switch_flag = %s' % switch_flag)


def show_switchport(switch, switchport, switchport_latest_time,
                    switchport_flag):
    logging.debug('  switch_id = %s' % switch['id'])
    logging.debug('  switch_ip = %s' % switch['ip'])
    logging.info('  switchport_mac = %s' % switchport['mac'])
    logging.info('  switchport_port = %s' % switchport['port'])
    logging.info('  switchport_ip = %s' % switchport['ip'])
    logging.info('  switchport_latest_time = %s' % switchport_latest_time)
    logging.info('  switchport_flag = %s' % switchport_flag)


def insert_switch_table(switch, cur):
    logging.info('----insert----')
    switch_latest_time = get_time()
    switch_flag = LIVE_FLAG
    if switch['mac'] == 'None':
        switch['mac'] = None
    cur.execute("""
                INSERT INTO switch (
                    switch_id, switch_ip, switch_mac,
                    switch_latest_time, switch_flag)
                VALUES (%s, %s, %s, %s, %s)
                """
                , (switch['id'], switch['ip'], switch['mac'],
                   switch_latest_time, switch_flag))
    show_switch(switch, switch_latest_time, switch_flag)


def insert_switchport_table(switch, switchport, cur):
    logging.info('  ----insert----')
    switchport_latest_time = get_time()
    switchport_flag = LIVE_FLAG
    if switchport['ip'] == 'None':
        switchport['ip'] = None
    cur.execute("""
                INSERT INTO switchport (
                    switch_id, switch_ip, switchport_mac,
                    switchport_port, switchport_ip,
                    switchport_latest_time, switchport_flag)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                , (switch['id'], switch['ip'],
                   switchport['mac'], switchport['port'], switchport['ip'],
                   switchport_latest_time, switchport_flag))
    show_switchport(switch, switchport, switchport_latest_time,
                    switchport_flag)


def update_switch_table(switch, cur):
    logging.info('----update----')
    switch_latest_time = get_time()
    switch_flag = LIVE_FLAG
    if switch['mac'] == 'None':
        switch['mac'] = None
    cur.execute("""
                UPDATE switch SET switch_mac=%s,
                                  switch_latest_time=%s,
                                  switch_flag=%s
                WHERE switch_id=%s and switch_ip=%s
                """
                , (switch['mac'], switch_latest_time, switch_flag,
                   switch['id'], switch['ip']))
    show_switch(switch, switch_latest_time, switch_flag)


def update_switchport_table(switch, switchport, cur):
    logging.info('  ----update----')
    switchport_latest_time = get_time()
    switchport_flag = LIVE_FLAG
    if switchport['ip'] == 'None':
        switchport['ip'] = None
    cur.execute("""
                UPDATE switchport SET switchport_ip=%s,
                                      switchport_latest_time=%s,
                                      switchport_flag=%s
                WHERE (switch_id=%s and switch_ip=%s) and
                      (switchport_mac=%s and switchport_port=%s)
                """
                , (switchport['ip'], switchport_latest_time, switchport_flag,
                   switch['id'], switch['ip'], switchport['mac'],
                   switchport['port']))
    show_switchport(switch, switchport, switchport_latest_time,
                    switchport_flag)


def insert_lost_switch_table(db_switch, cur):
    logging.info('----lost----<insert lost_switch table>')
    switch_latest_time = get_time()
    cur.execute("""
                INSERT INTO lost_switch (
                switch_id, switch_ip, switch_mac,
                switch_latest_time)
                VALUES (%s, %s, %s, %s)
                """
                , (db_switch['switch_id'],
                   db_switch['switch_ip'],
                   db_switch['switch_mac'],
                   switch_latest_time))
    logging.info('switch_id = %s' % db_switch['switch_id'])
    logging.info('switch_ip = %s' % db_switch['switch_ip'])
    logging.info('switch_latest_time = %s' % switch_latest_time)


def insert_lost_switchport_table(db_switchport, cur):
    logging.info('  ----lost----<insert lost_switchport table>')
    switchport_latest_time = get_time()
    cur.execute("""
                INSERT INTO lost_switchport (
                switch_id, switch_ip, switchport_mac,
                switchport_port, switchport_ip, switchport_latest_time)
                VALUES (%s, %s, %s, %s, %s, %s)
                """
                , (db_switchport['switch_id'],
                   db_switchport['switch_ip'],
                   db_switchport['switchport_mac'],
                   db_switchport['switchport_port'],
                   db_switchport['switchport_ip'],
                   switchport_latest_time))
    logging.info('  switchport_mac = %s' % db_switchport['switchport_mac'])
    logging.info('  switchport_port = %s' % db_switchport['switchport_port'])
    logging.info('  switchport_latest_time = %s' % switchport_latest_time)


def parse_data(new_data, cur):
    try:
        db_data = select_db_data(cur)
        if db_data is False:
            return False

        """ DBに格納されているswitchの旧データと新データを照合 """
        # 旧switchあり
        for db_switch in db_data:
            find_switch = False

            # 新switchあり
            for switch_unit in new_data:
                switch = switch_unit['switch']

                # 旧switch == 新switch
                if ((int(db_switch['switch_id']) == int(switch['id'])) and
                    (db_switch['switch_ip'] == switch['ip'])):

                    find_switch = True
                    update_switch_table(switch, cur)

                    if 'switchport' in db_switch:
                        # 旧switchportあり
                        for db_switchport in db_switch['switchport']:
                            find_switchport = False

                            if 'switchport' in switch:
                                # 新switchportあり
                                for switchport in switch['switchport']:

                                    # 旧switchport == 新switchport
                                    if ((db_switchport['switchport_mac']
                                         == switchport['mac']) and
                                        (int(db_switchport['switchport_port'])
                                         == int(switchport['port']))):

                                        find_switchport = True
                                        update_switchport_table(switch,
                                                                switchport,
                                                                cur)

                                        switch['switchport'].remove(switchport)
                                        break

                            # 旧switchportなし & 一致する新switchportなし
                            if find_switchport is False:
                                insert_lost_switchport_table(db_switchport,
                                                             cur)

                    # 旧switchportなし & 新switchportありの場合
                    if 'switchport' in switch:
                        for switchport in switch['switchport']:
                            insert_switchport_table(switch, switchport, cur)

                    new_data.remove(switch_unit)
                    break

            # 旧switchあり & 新switchなし
            if find_switch is False:
                insert_lost_switch_table(db_switch, cur)

                # 旧switchportあり & 新switchportなし(新switchがなかったので必然)
                for db_switchport in db_switch['switchport']:
                    insert_lost_switchport_table(db_switchport, cur)

        # 旧switchなし & 新switchありの場合
        for switch_unit in new_data:
            switch = switch_unit['switch']
            insert_switch_table(switch, cur)

            # 旧switchportなし(旧switchがなかったので必然) & 新switchportありの場合
            if 'switchport' in switch:
                for switchport in switch['switchport']:
                    insert_switchport_table(switch, switchport, cur)

    except MySQLdb.Error as e:
        logging.error('Error:%s' % e)
        return False

    return True


class ConfigError(Exception):
    pass


if __name__ == "__main__":

    try:
        makelog('topologyMysql')

        logging.info('START---------------')

        root_path = os.path.dirname(os.path.abspath(__file__))
        config_file = os.path.join(root_path, 'configs', 'topology.ini')

        conf = ConfigLoader(config_file)
        result_redis = conf.redis_configloder()
        result_mysql = conf.mysql_configloder()

        if result_redis is False or result_mysql is False:
            raise ConfigError('Failed configloader...')

        mysql_client = connect_mysql(conf)
        if mysql_client:
            cur = mysql_client.cursor(DictCursor)

            connect_redis = connect_redis(conf)
            if connect_redis:
                while True:
                    try:
                        data = pop_redis(connect_redis, conf)
                        logging.debug('data = %s' % data)

                        if data:
                            succsess_parse_data = parse_data(data, cur)
                            logging.debug('succsess_parse_data = %s'
                                          % succsess_parse_data)

                            if succsess_parse_data is True:
                                mysql_client.commit()
                                logging.info('-----------COMMIT-----------')
                            else:
                                mysql_client.rollback()
                                logging.info('----------ROLLBACK----------')

                    except Exception as e:
                        logging.critical(e)

                    time.sleep(conf.mysql.interval)

            else:
                logging.debug('connect_redis = %s' % connect_redis)

            cur.close()
            logging.info('MySQLcursor is closed')
            mysql_client.close()
            logging.info('MySQLconnection is closed')

        else:
            logging.debug('mysql_client = %s' % mysql_client)

    except Exception as e:
        logging.critical(e)

    logging.info('END---------------')
    sys.exit()
