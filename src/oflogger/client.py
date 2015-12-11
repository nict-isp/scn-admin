#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
client
~~~~~~
モデルクラスをクライアント化するためのクラス群

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import os
import time
import logging
import argparse
import twisted
import simplejson as json
from twisted.internet.protocol import Protocol, ReconnectingClientFactory
from twisted.protocols.basic import LineReceiver
from twisted.internet import reactor

# Local library specific imports
from utils.makelog import makelog
from utils.configloader import ConfigLoader
from utils.connector import connect_redis

__version__ = '0.0.1'

REDIS_CACHE_THRESHOLD = 100


class App(object):
    def __init__(self):
        self.redis = None
        self.conf = None
        self.type = None

    def build_option_parser(self):
        parser = argparse.ArgumentParser(
            description='Put OpenFlow log data to Redis server',
            add_help=False,
        )
        parser.add_argument(
            '--version',
            action='version',
            version='%(prog)s {0}'.format(__version__),
        )
        parser.add_argument(
            '-t',
            action='store',
            dest='type',
            default='topology'
        )

        args = parser.parse_args()
        self.type = args.type

        return args

    def load(self, conf_file):
        conf = ConfigLoader(conf_file)
        result_tcp = conf.tcp_configloder()
        result_redis = conf.redis_configloder()

        if result_tcp is False or result_redis is False:
            logging.critical('Failed configloder...')

            return False

        self.conf = conf

        return True

    def clear_redis(self):
        self.redis = None

    def connect(self, conf):
        if self.redis is None:
            client = connect_redis(conf)
            self.redis = client

            return client

        return self.redis


app = App()


class NictLineReceiver(Protocol):
    def __init__(self, *args, **kwargs):
        self.buf = ""
        self.limit = 1500

    def dataReceived(self, data):
        self.buf = '%s%s' % (self.buf, str(data))
        try:
            if '\r\n' in self.buf:
                items = self.buf.split('\r\n')
                self.buf = items[0]
            else:
                return
        except Exception as inst:
            print str(inst)
            return
        self.lineReceived(self.buf)
        self.buf = ""


class OpenFlowClient(Protocol):
    # Override
    def connectionMade(self):
        host = self.transport.getPeer().host
        port = self.transport.getPeer().port
        logging.info('Connected:host=%s port=%s' % (host, port))
        self._send_command()

    def _send_command(self):
        cmd = app.conf.tcp.cmd
        logging.info('Command:%s' % cmd)
        self.transport.write(cmd)

    # Override
    def dataReceived(self, s):
        self.data = s
        self._push_redis(s)

    def _push_redis(self, data):
        logging.info('-----\n %s \n-----' % data)
        logging.info('Recieved date from push into redis...')
        r = app.connect(app.conf)
        try:
            r.rpush(app.conf.redis.key, data)
            logging.info('OK')

        except Exception, e:
            logging.info('Failed')
            logging.critical('Redis_Error:%s' % e)

        time.sleep(app.conf.tcp.interval)
        self._send_command()


#class OpenFlowClientLine(LineReceiver):
class OpenFlowClientLine(NictLineReceiver):
    # Override
    def connectionMade(self):
        host = self.transport.getPeer().host
        port = self.transport.getPeer().port
        logging.info('Connected:host=%s port=%s' % (host, port))
        self._send_command()

    def _send_command(self):
        cmd = app.conf.tcp.cmd
        logging.info('Command:%s' % cmd)
        self.transport.write(cmd)

    def lineReceived(self, s):
        logging.info('-----------Data receive-----------')
        self._push_redis(s)

    def _push_redis(self, data):
        logging.info('-----\n %s \n-----' % data)
        logging.info('Recieved date from push into redis...')
        r = app.connect(app.conf)
        try:
            if len(json.loads(data)) > 0:
                #length = r.llen(app.conf.redis.key)
                #if length > REDIS_CACHE_THRESHOLD:
                #    start = length - REDIS_CACHE_THRESHOLD
                #    r.ltrim(app.conf.redis.key, start, length)

                r.rpush(app.conf.redis.key, data)
                logging.info('OK')

        except Exception, e:
            logging.info('Failed')
            logging.critical('Redis_Error:%s' % e)

        #time.sleep(app.conf.tcp.interval)
        #self._send_command()
        reactor.callLater(app.conf.tcp.interval, self._send_command)


class OpenFlowClientFactory(ReconnectingClientFactory):
    def __init__(self):
        # Set Max retries
        self.maxRetries = app.conf.tcp.retry

    def startedConnecting(self, connector):
        logging.info('Connect to OpenFlow...')

    def buildProtocol(self, addr):
        logging.info('Before build protocol...OK')
        logging.info("self.protocol = %s" % self.protocol.__name__)
        p = self.protocol()
        logging.info('Protocol was built.')
        p.factory = self
        # Reset number of retries
        self.resetDelay()
        return p

    def retry_connecting(self, connector, reason):
        logging.info('...Retry...')
        # Call clientConnectionFailed method
        ReconnectingClientFactory.clientConnectionFailed(self, connector, reason)

    def clientConnectionFailed(self, connector, reason):
        logging.error('Failed: %s' % reason)
        if self.retries < self.maxRetries:
            self.retry_connecting(connector, reason)
        else:
            logging.critical('...Max retryies %s' % self.maxRetries)
            reactor.stop()

    def clientConnectionLost(self, connector, reason):
        logging.info('...Connection lost: %s' % reason)
        self.retry_connecting(connector, reason)


def run():
    clientFactory = OpenFlowClientFactory()
    clientFactory.protocol = OpenFlowClientLine
    logging.info("protocol = %s" % OpenFlowClientLine.__name__)
    try:
        reactor.connectTCP(app.conf.tcp.host, app.conf.tcp.port, clientFactory)
        logging.debug('Reactor start...')
        reactor.run()
        logging.debug('...Reactor stop')

    except twisted.internet.error.ServiceNameUnknownError as e:
        # Host:port Error
        logging.critical('twisted_ServiceNameUnknownError:%s' % e)

    except Exception as e:
        logging.critical(e)

    return


if __name__ == '__main__':
    args = app.build_option_parser()
    root_path = os.path.dirname(os.path.abspath(__file__))
    config_file = os.path.join(root_path, 'configs', args.type + '.ini')
    makelog(args.type)
    ret = app.load(config_file)

    if ret is True and app.connect(app.conf):
        run()

    logging.info('reactor stop...exit')
