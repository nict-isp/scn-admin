#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
manage
~~~~~~
Webアプリケーションの実行クラス

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
from flask.ext.script import Manager
from oflogviewer.app import create_app

app = create_app()
manager = Manager(app)


@manager.command
def initdb():
    """Creates all database tables."""
    pass


@manager.command
def dropdb():
    """Drops all database tables."""
    pass

@manager.command
def pub():
    import simplejson as json
    from juggernaut import Juggernaut
    jug = Juggernaut()
    d = {'foo': 'bar'}

    jug.publish('switch', json.dumps(d))

if __name__ == '__main__':
    manager.run()
