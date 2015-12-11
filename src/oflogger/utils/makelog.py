# -*- coding: utf-8 -*-
"""
makelog
~~~~~~~
ロガーにログファイルを設定する

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""

import os
import logging
from logging.handlers import RotatingFileHandler


def makelog(file_name):
    # Console
    stream_log = logging.StreamHandler()
    stream_log.setLevel(logging.INFO)

    formatter = logging.Formatter('%(asctime)s %(levelname)s: %(message)s '
                                  '[in %(pathname)s:%(lineno)d]')

    stream_log.setFormatter(formatter)

    root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.dirname(root_path)
    log_path = os.path.join(path, 'logs')
    if not os.path.exists(log_path):
        os.mkdir(log_path)

    file_path = '%s/%s.log' % (log_path, file_name)
    file_log = RotatingFileHandler(file_path, maxBytes=100000, backupCount=10)

    # File
    #file_log = logging.FileHandler(filename=file_path)
    file_log.setLevel(logging.DEBUG)
    file_log.setFormatter(logging.Formatter(
                          '%(asctime)s %(levelname)s %(message)s'))

    # File (Error)
    file_path = '%s/%s_error.log' % (log_path, file_name)
    error_log = RotatingFileHandler(file_path, maxBytes=100000, backupCount=10)
    error_log.setLevel(logging.WARNING)
    error_log.setFormatter(logging.Formatter(
                           '%(asctime)s %(levelname)s %(message)s'))

    # Set handler
    logger = logging.getLogger()
    logger.addHandler(stream_log)
    logger.addHandler(file_log)
    logger.addHandler(error_log)
    logger.setLevel(logging.DEBUG)
