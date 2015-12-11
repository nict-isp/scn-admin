# -*- coding: utf-8 -*-
"""
oflogger.views.frontend.topology
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
トポロジー情報取得のエントリポイント

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import simplejson as json
from flask import Blueprint, current_app, redirect
from oflogviewer.models.topology import Topology

view_topology = Blueprint('topology', __name__)

@view_topology.route('/api/topology/', strict_slashes=False)
def topology():
    logger = current_app.logger
    logger.debug('topology loading')

    model = Topology()
    response = model.topology()

    return "TEST" #json.dumps(response)
