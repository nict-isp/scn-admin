# -*- coding: utf-8 -*-
"""
oflogviewer.utils.method_rewrite
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
see http://flask.pocoo.org/snippets/38/ more details.

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
from werkzeug import url_decode

class MethodRewrite(object):
    def __init__(self, app, input_name='_method'):
        self.app = app.wsgi_app
        self.input_name = input_name

    def __call__(self, environ, start_response):
        if self.input_name in environ.get('QUERY_STRING', ''):
            args = url_decode(environ['QUERY_STRING'])
            method = args.get(self.input_name)
            if method:
                method = method.encode('ascii', 'replace')
                environ['REQUEST_METHOD'] = method

        return self.app(environ, start_response)
