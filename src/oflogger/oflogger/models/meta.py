# -*- coding: utf-8 -*-
"""
oflogger.models.meta
~~~~~~~~~~~~~~~~~~~~
SQLAlchemyÇÃèâä˙ê›íË

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
from sqlalchemy import create_engine
from sqlahelper import get_base, get_session, add_engine, get_engine

__all__ = ['Base', 'Session', 'init_engine', 'get_engine']

Base = get_base()
Session = get_session()
engine = get_engine()


def init_engine(config):
    engine = create_engine(
        config['uri'],
        echo=config['echo'],
        pool_recycle=config['pool_recycle'],
        convert_unicode=True
    )

    add_engine(engine)
