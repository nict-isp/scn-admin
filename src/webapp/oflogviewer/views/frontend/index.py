# -*- coding: utf-8 -*-
"""
oflogger.views.frontend.topology
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Webアプリケーションのエントリポイント

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import simplejson as json
from flask import Blueprint, current_app, redirect
from oflogviewer.models.topology import Topology

app = Blueprint('index', __name__)


@app.route('/', strict_slashes=False)
def index():
    uri = '/static/scnv/index.html'

    return redirect(uri)


@app.route('/api/topology/', strict_slashes=False)
def topology():
    logger = current_app.logger
    logger.debug('topology loading')

    model = Topology()
    response = model.topology()

    return json.dumps(response)
