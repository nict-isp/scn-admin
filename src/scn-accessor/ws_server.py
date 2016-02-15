#!/usr/bin/python
#-*- coding: utf-8 -*-
from autobahn.twisted.websocket import WebSocketServerProtocol, \
                                       WebSocketServerFactory
from twisted.python import log
from twisted.internet import reactor
from twisted.internet.protocol import Protocol, Factory

import sys
import time
import json
import scn

scnm = scn.SCNManager()
seq = 0

#デバッグモード用フラグ
is_mode_debug=False

class DsnWebSocketServerProtocol(WebSocketServerProtocol):
    """ DSN実行用WebSocketサーバ
    """
    def onConnect(self, request):
        print "Client connecting: {0}".format(request.peer)

    def onOpen(self):
        print "Client connection open."

    def onMessage(self, payload, isBinary):
        """ メッセージ受信時処理
        payload  [str]     -- 受信データ（JSON）
        isBinary [Boolean] -- false.（バイナリデータは未対応）
        """
        if isBinary:
            pass
        else:
            print "Text message received: {0}".format(payload)

            jsonData = json.loads(payload)
            print json.dumps(jsonData, sort_keys=True,indent=4)
            global seq
            seq += 1
            _seq = seq
            def receive_message(message):
                self.sendMessage("{{\"log_seq\":{0}, \"log_data\":{1}}}".format(_seq, message))

            try:
                method = jsonData.get("method")
                if method == "create_overlay" :
                    overlay_name  = jsonData["overlay_name"]
                    dsn_text      = jsonData["dsn"]
                    overlay_id    = scnm.create_overlay(overlay_name, dsn_text, receive_message)
                    print "create overlay_id: {0}, overlay_name: {1}, dsn_text: {2}".format(overlay_id, overlay_name, dsn_text)
                    overlay_json  = json.dumps({"overlay_id":overlay_id})
                    self.sendMessage(overlay_json)

                elif method == "modify_overlay":
                    overlay_name  = jsonData["overlay_name"]
                    dsn_text      = jsonData["dsn"]
                    overlay_id    = jsonData["overlay_id"]
                    scnm.modify_overlay(overlay_name, overlay_id, dsn_text)
                    print "modify overlay_id: {0}, overlay_name: {1}, dsn_text: {2}".format(overlay_id, overlay_name, dsn_text)

                elif method == "delete_overlay":
                    overlay_id    = jsonData["overlay_id"]
                    print "delete overlay_id:{0}".format(overlay_id)
                    scnm.delete_overlay(overlay_id)
            
                elif method == "discovery_service":
                    query         = jsonData.get("query", {})
                    services      = scnm.discovery_service(query)
                    services_json = json.dumps(services)
                    self.sendMessage(services_json)

                return

                type = jsonData.get("type", "overlay")
                if type == "overlay":
                    is_close = jsonData.get("is_close", False)
                    if is_close:
                        if jsonData.has_key("overlay_id"):
                            overlay_id = jsonData["overlay_id"]
                            print "delete overlay_id:{0}".format(overlay_id)
                            scnm.delete_overlay(overlay_id)
                    else:
                        overlay_name = jsonData["overlay_name"]
                        dsn_text = jsonData["dsn"]
                        if jsonData.has_key("overlay_id"):
                            overlay_id = jsonData["overlay_id"]
                            if is_mode_debug:
                                scnm.dev_modify_overlay(overlay_name, overlay_id, dsn_text)
                            else:
                                scnm.modify_overlay(overlay_name, overlay_id, dsn_text)
                            print "modify overlay_id: {0}, overlay_name: {1}, dsn_text: {2}".format(overlay_id, overlay_name, dsn_text)
                        else:
                            if is_mode_debug:
                                overlay_id = scnm.dev_create_overlay(overlay_name, dsn_text, receive_message)
                            else:
                                overlay_id = scnm.create_overlay(overlay_name, dsn_text, receive_message)
                            print "create overlay_id: {0}, overlay_name: {1}, dsn_text: {2}".format(overlay_id, overlay_name, dsn_text)
                            overlayid_data = {"overlay_id":overlay_id}
                            overlay_json = json.dumps(overlayid_data)
                            self.sendMessage(overlay_json)

                elif type == "lookup":
                    query = jsonData.get("query", {})
                    services = scnm.discovery_service(query)
                    services_json = json.dumps(services)
                    self.sendMessage(services_json)

            except Exception as e:
                e_data = {"exception":str(e)}
                e_json = json.dumps(e_data);
                self.sendMessage(e_json)
                #self.sendMessage("exception:{0}".format(str(e)))

    def onClose(self, wasClean, code, reason):
        print "Client connection closed: {0}".format(reason)

if __name__ == '__main__':
    factory = WebSocketServerFactory("ws://localhost:55555", debug = False)
    factory.protocol = DsnWebSocketServerProtocol
    reactor.listenTCP(55555, factory)
    reactor.run()

