# -*- coding: utf-8 -*-
"""
oflogviewer.models.meta
~~~~~~~~~~~~~~~~~~~~~~~
SQLAlchemyの初期化

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
from sqlalchemy import create_engine
from sqlahelper import get_base, get_session, add_engine

__all__ = ['Base', 'Session', 'init_engine']

Base = get_base()
Session = get_session()


def init_engine(config):
    engine = create_engine(
        config.get('SQLALCHEMY_DATABASE_URI'),
            echo=config.get('SQLALCHEMY_ECHO'),
            pool_recycle=config.get('SQLALCHEMY_POOL_RECYCLE'),
            convert_unicode=True
        )

    add_engine(engine)

