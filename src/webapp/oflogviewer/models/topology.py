# -*- coding: utf-8 -*-
"""
oflogviewer.models.topology
~~~~~~~~~~~~~~~~~~~~~~~~~~~
MySQLよりトポロジー情報をロードするクラス

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import re
from sqlsoup import SQLSoup
from oflogviewer.models.sqlahelper import get_engine, get_session
from oflogviewer.models.overlay import Overlay

class Topology(object):
    def __init__(self):
        """ Initialize. """
        engine = get_engine()
        session = get_session()
        self.db = SQLSoup(engine, session=session)
        self.overlay = Overlay()

    def topology(self):
        """ Get topology. """
        switches = self.switches()
        routes = self.routes()
        #: Todo: Add node, service, location path
        nodes = self.nodes()
        services = self.services()
        paths = self.paths()
        traffics = self.traffics()
        overlay = self.overlay.search()
        commands = self.commands()
        response = [
          {
            'messageType': 'switches',
            'value': switches,
          },
          {
            'messageType': 'routes',
            'value': routes,
          },
          { 
            'messageType': 'nodes',
            'value': nodes,
          },
          {
            'messageType': 'services',
            'value': services,
          },
          {
            'messageType': 'paths',
            'value': paths,
          },
          {
            'messageType': 'traffics',
            'value': traffics,
          },
          {
            'messageType': 'overlay',
            'value': overlay,
          },
          {
            'messageType': 'commands',
            'value': commands,
          }
        ]

        return  response

    def switches(self):
        """ Switches and switch ports. """
        db = self.db
        swport = db.with_labels(db.switchport)
        switches = db.join(db.switch, swport,
                           db.switch.switch_id==swport.switchport_switch_id,
                           isouter=False).all()

        #: ToDo: Use bpmappers?
        strftime = lambda x: x.strftime('%Y-%m-%d %H:%M:%S')
        def flag(x):
            if x == 'Y':
                return True
            return False

        switch_list = [
            {
                'switch_id': row.switch_id,
                'switch_ip': row.switch_ip,
                'switch_updated_at': strftime(row.switch_latest_time),
                'switch_enable_flag': flag(row.switch_flag),
                'switch_port_mac': row.switchport_switchport_mac,
                'switch_port_port': row.switchport_switchport_port,
                'switch_port_ip': row.switchport_switchport_ip,
                'switch_port_updated_at':
                    strftime(row.switchport_switchport_latest_time),
                'switch_port_enable_flag': flag(row.switchport_switchport_flag)
            }
            for row in switches
        ]

        return switch_list

    def routes(self):
        """ Latest routings. """
        #: FIXME
        #: Byte to bit,
        #: Convert should be OpenFlow Controller.
        db = self.db
        routes = db.latest_route.all()
        def convert(bandwidth):
            data = (float(bandwidth) * 8) / 1000

            return data

        routes_list = [
            {
                'src_switch_id': row.src_switch_id,
                'src_switch_port': row.src_switch_port,
                'dst_switch_id': row.dst_switch_id,
                'dst_switch_port': row.dst_switch_port,
                'bandwitdh': convert(row.bandwidth)
            }
            for row in routes
        ]

        return routes_list


    def nodes(self):
        """ Nodes location. """
        db = self.db
        nodes = db.nodelocation.all()
        nodes_list = [
            {
                'node_ip': row.node_ip,
                'node_mac': row.node_mac,
                'node_alive': row.node_alive,
                'switch_id': row.switch_id,
                'switch_port': row.switch_port,
                'switch_port_name': row.switch_port_name,
                'vgw_ip': row.vgw_ip
            }
            for row in nodes
        ]

        return nodes_list

    def services(self):
        """ Service locations."""
        db = self.db
        services = db.servicelocation.all()
        services_list = [
            {
                'node_ip': row.node_ip,
                'service_key': row.service_key,
                'service_name': row.service_name
            }
            for row in services
        ]

        return services_list

    def paths(self):
        """ Service routing paths. """
        db = self.db
        paths = db.servicepath.order_by(db.servicepath.id).all()
        service_paths = []
        #: FIXME
        for p in paths:
            relay = db.servicepath_switch_relay \
                      .filter(db.servicepath_switch_relay.path_id==p.path_id) \
                      .order_by(db.servicepath_switch_relay.ordered_id) \
                      .all()
            switch = [
                {
                    'switch_id': row.switch_id,
                    'switch_port': row.switch_port,
                    'switch_port_name': row.switch_port_name
                }
                for row in relay
            ]
            service_paths.append({
                'path_id': p.path_id,
                'src_node_mac': p.src_node_mac,
                'src_service_key': p.src_service_key,
                'src_service_name': p.src_service_name,
                'dst_node_mac': p.dst_node_mac,
                'dst_service_key': p.dst_service_key,
                'dst_service_name': p.dst_service_name,
                'switch': switch
            })

        return service_paths

    def traffics(self):
        """ Service path traffics. """
        db = self.db
        traffics = db.servicetraffic.all()
        traffic_list = [
            {
                'path_id': row.path_id,
                'src_service_name': row.src_service_name,
                'dst_service_name': row.dst_service_name,
                'traffic': row.traffic
            }
            for row in traffics
        ]

        return traffic_list

    def format(self, data):
        ret = {}
        data = data.replace(')', '')

        def split_location(data):
            location = data.split(':')
            return {
                'protocol': location[0],
                'src_service_location': location[1],
                'listen_port': location[2]
            }

        if re.search(r'^RGT\(', data):
            command = re.sub(r'^RGT\(', '', data).split(',')
            ret = {
                'command': 'i',
                'sender': split_location(command[0]),
                'key': command[1],
                'namespace': command[2],
                'class': command[3],
                'attribute': command[4],
                'behavior': command[5],
                'service_location': split_location(command[6])
            }
        elif re.search(r'^SRH\(', data):
            command = re.sub(r'^SRH\(', '', data).split(',')
            ret = {
                'command': 's',
                'behavior': command[0],
                'service_location': split_location(command[1])
            }
        elif re.search(r'^CP\(', data):
            command = re.sub(r'^CP\(', '', data).split(',')
            ret = {
                'command': 'cm',
                'src_service_location': split_location(command[0]),
                'dst_service_location': split_location(command[1]),
                'tos': command[2],
                'bw': command[3],
                'receive_service': command[4],
                'src_service_name': command[5],
                'dst_service_name': command[6]
            }

        return ret

    def commands(self):
        """ Service commands. """
        db = self.db
        commands = db.servicecommand \
                     .group_by(db.servicecommand.commands) \
                     .all()
        strftime = lambda x: x.strftime('%Y-%m-%d %H:%M:%S')


        command_list = [
            {
                'service_name': row.service_name,
                'commands': self.format(row.commands),
                'timestamp': strftime(row.command_created_at)
            }
            for row in commands
        ]

        return command_list 
