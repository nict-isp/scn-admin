# -*- coding: utf-8 -*-
"""
oflogger.tests.models.test_meta
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import os
from unittest import TestCase
from oflogger.app import App
from oflogger.models.meta import Session, Base

class TestMeta(TestCase):
    def setUp(self):
        app = App()
        root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = root_path + '/test.ini'
        app.load_config(config_path)

    def test_db_session(self):
        """ DBSession should get. """
        print dir(Session)

    def test_db_base(self):
        """ Declaretive_Base should get. """
        print dir(Base.metadata)



