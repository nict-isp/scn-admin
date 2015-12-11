#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
manage
~~~~~~
モデルクラスをアプリケーション化するためのクラス群

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import os
import sys
import logging
from cliff.app import App as CliffApp
from cliff.commandmanager import CommandManager
from cliff.command import Command
from oflogger.app import App


class BaseCommand(Command):
    log = logging.getLogger('oflogger')
    oflogger = App()

    def initialize_app(self, ini_file_name):
        self.log.info('Start receiving data...')
        self.load_config(ini_file_name)
        self.init_engine()
        self.init_redis()

    def load_config(self, ini_file_name):
        path = os.path
        dirname = path.dirname
        filepath = path.join(dirname(path.abspath(__file__)),
                             'configs', ini_file_name + '.ini')

        self.oflogger.load_config(filepath)

    def init_engine(self):
        app = self.oflogger
        config = app.config['mysql']
        app.configure_db(config)

    def init_redis(self):
        app = self.oflogger
        app.configure_redis(app.config['redis'])
        app.configure_publisher()

    def execute(self, model):
        app = self.oflogger
        app.run(model)

    def listen(self, model, channel):
        app = self.oflogger
        app.listen(model, channel)

    def take_action(self, parsed_args):
        pass


class TopologyCommand(BaseCommand):
    def run(self, parsed_args):
        from oflogger.models.topology import Topology
        self.log.debug('Running TopologyCommand...')
        self.initialize_app('topology')
        self.listen(Topology, channel='topology')


class BandwidthCommand(BaseCommand):
    def run(self, parsed_args):
        from oflogger.models.bandwidth import Bandwidth
        self.log.debug('Running Bandwidth...')
        self.initialize_app('bandwidth')
        self.listen(Bandwidth, channel='bandwidth')


class NodeLocationCommand(BaseCommand):
    def run(self, parsed_args):
        from oflogger.models.nodelocation import NodeLocation
        self.log.debug('Running NodeLocation...')
        self.initialize_app('nodelocation')
        self.listen(NodeLocation, channel='nodelocation')


class ServiceLocationCommand(BaseCommand):
    def run(self, parsed_args):
        from oflogger.models.servicelocation import ServiceLocation
        self.log.debug('Running ServiceLocation...')
        self.initialize_app('servicelocation')
        self.listen(ServiceLocation, channel='servicelocation')


class ServicePathCommand(BaseCommand):
    def run(self, parsed_args):
        from oflogger.models.servicepath import ServicePath
        self.log.debug('Running ServicePath...')
        self.initialize_app('servicepath')
        self.listen(ServicePath, channel='path')


class ServiceTrafficCommand(BaseCommand):
    def run(self, parsed_args):
        from oflogger.models.servicetraffic import ServiceTraffic
        self.log.debug('Running ServiceTraffic...')
        self.initialize_app('servicetraffic')
        self.listen(ServiceTraffic, channel='traffic')


class ServiceCmdCommand(BaseCommand):
    def run(self, parsed_args):
        from oflogger.models.servicecommand import ServiceCommand
        self.log.debug('Running Command...')
        self.initialize_app('command')
        self.listen(ServiceCommand, channel='command')


class OverlayCommand(BaseCommand):
    def run(self, parsed_args):
        from oflogger.models.overlay import Overlay
        self.log.debug('Running Overlay worker...')
        self.initialize_app('overlay')
        self.listen(Overlay, channel='overlay')


class DeleteServiceCommand(BaseCommand):
    def run(self, parsed_args):
        from oflogger.models.deleteservice import DeleteService
        self.log.debug('Running Delete Service worker...')
        self.initialize_app('deleteservice')
        self.listen(DeleteService, channel='deleteservice')


class OfloggerApp(CliffApp):
    log = logging.getLogger('oflogger')

    def __init__(self):
        command = CommandManager('oflogger.command')
        super(OfloggerApp, self).__init__(
            description='OpenFlow logger',
            version='0.1',
            command_manager=command,
        )
        self.log.info('Start running...')
        commands = {
            'topology': TopologyCommand,
            'bandwidth': BandwidthCommand,
            'nodelocation': NodeLocationCommand,
            'servicelocation': ServiceLocationCommand,
            'servicepath': ServicePathCommand,
            'servicetraffic': ServiceTrafficCommand,
            'command': ServiceCmdCommand,
            'overlay': OverlayCommand,
            'deleteservice': DeleteServiceCommand
        }
        for k, v in commands.iteritems():
            command.add_command(k, v)

    def initialize_app(self, argv):
        self.log.debug('initialize_app')

    def prepare_to_run_command(self, cmd):
        self.log.debug('prepare_to_run_command %s', cmd.__class__.__name__)

    def clean_up(self, cmd, result, err):
        self.log.debug('clean_up %s', cmd.__class__.__name__)
        if err:
            self.log.debug('got an error: %s', err)

    def configure_logging(self):
        """Create logging handlers for any log output.
        """
        root_logger = logging.getLogger('')

        path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(path, 'var/log/oflogger') + '/' + self.NAME + '.log'

        # Set up logging to a file
        root_logger.setLevel(logging.INFO)
        file_handler = logging.handlers.RotatingFileHandler(
            path, maxBytes=10000, backupCount=5,
        )
        formatter = logging.Formatter(self.LOG_FILE_MESSAGE_FORMAT)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

        # Send higher-level messages to the console via stderr
        console = logging.StreamHandler(self.stderr)
        console_level = {0: logging.WARNING,
                         1: logging.INFO,
                         2: logging.DEBUG,
                         }.get(self.options.verbose_level, logging.DEBUG)
        console.setLevel(console_level)
        formatter = logging.Formatter(self.CONSOLE_MESSAGE_FORMAT)
        console.setFormatter(formatter)
        root_logger.addHandler(console)
        return

def main(argv=sys.argv[1:]):
    app = OfloggerApp()
    return app.run(argv)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
