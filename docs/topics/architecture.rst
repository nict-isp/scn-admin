Architecture
===============

.. _Flask: http://flask.pocoo.org/
.. _nginx: http://nginx.org/en/
.. _gunicorn: http://gunicorn.org/
.. _MySQL: http://www-jp.mysql.com/
.. _Redis: http://redis.io/
.. _node.js: https://nodejs.org/
.. _juggernaut: https://github.com/maccman/juggernaut
.. _fluentd: http://www.fluentd.org/
.. _GrowthForecast: http://kazeburo.github.io/GrowthForecast/

.. _Backbone.js: http://backbonejs.org/
.. _jQuery: https://jquery.com/
.. _Raphael.js: http://raphaeljs.com/
.. _three.js: http://threejs.org/


System configuration
====================
* SCN Admin consists of the following tools and libraries.

+---------------------+----------------------------------------------------------------+---------------------+
| Server/Client       | Tool/Library                                                   | Called in SCN Admin |
+=====================+================================================================+=====================+
| Server side         | Web application framework                                      | `Flask`_            |
|                     +----------------------------------------------------------------+---------------------+
|                     | Web server                                                     | `nginx`_            |
|                     +----------------------------------------------------------------+---------------------+
|                     | HTTP server                                                    | `gunicorn`_         |
|                     +----------------------------------------------------------------+---------------------+
|                     | RDBMS                                                          | `MySQL`_            |
|                     +----------------------------------------------------------------+---------------------+
|                     | NoSQL                                                          | `Redis`_            |
|                     +----------------------------------------------------------------+---------------------+
|                     | JavaScript Interpreter at server side                          | `node.js`_          |
|                     +----------------------------------------------------------------+---------------------+
|                     | Realtime connection tool                                       | `juggernaut`_       |
|                     +----------------------------------------------------------------+---------------------+
|                     | Data collection tool                                           | `fluentd`_          |
|                     +----------------------------------------------------------------+---------------------+
|                     | Graphing tool                                                  | `GrowthForecast`_   |
+---------------------+----------------------------------------------------------------+---------------------+
| Client side         | Framework that enables client MVC                              | `Backbone.js`_      |
|                     +----------------------------------------------------------------+---------------------+
|                     | Light JavaScript library                                       | `jQuery`_           |
|                     +----------------------------------------------------------------+---------------------+
|                     | SVG graphics                                                   | `Raphael.js`_       |
|                     +----------------------------------------------------------------+---------------------+
|                     | WebGL graphics                                                 | `three.js`_         |
+---------------------+----------------------------------------------------------------+---------------------+

* The entire system configuration is shown below.。

.. image:: img/fig-architecture-1.png
      :width: 800px
      :align: center


Server side
-------------
* The SCN Admin server side enables log output from each node to be visualized.
* Customization will be done for the data collection tool plug-in or the Web application.

Data collection tool
^^^^^^^^^^^^^^^^^^^^
* Log output from each node is received at the data collection tool first.
* Plugin for NoSQL transfers log output to the NoSQL server.
* Plugin for the Graphing tool adds up log output temporarily to produce a graph (the summed results will be sent to the graphing tool), and produces HTML code to show the results.
* When new information must be visualized, add a plugin here.

Web application
^^^^^^^^^^^^^^^^^^^^
* It subscribes input to the NoSQL server, modifies it for the client side, and publishes it.
* For the log output, such as topology, which is required when displaying a page, register it in RDBMS temporarily and enable its acquisition from the Web application API.

File configuration
^^^^^^^^^^^^^^^^^^
* SCN Admin server side consists of the following files.

::

  / （route of repository）
  |
  +- /conf
  |  +- redis.conf                   - Setting of Redis
  |  +- td-agent.conf                - Setting of Fluentd
  |  +- supervisord.conf             - Setting for starting Web application
  |  +- gunicorn.production.conf.py  - Setting of Web application server
  |
  +- /oflogger
  |  +- topology.py                  - Application that stores topology information in MySQL
  |  +- manage.py                    - Class that makes model class an application
  |  +- /oflogger/models             - Model class group that outputs all sorts of log output information to Juggernaut and MySQL
  |  +- /configs                     - Configuration of application
  |
  +- /webapp
  |  +- manage.py                    - Class that makes it an application
  |  +- /oflogviewer
  |     +- app.py                    - Loader of Web application
  |     +- /configs                  - Setting of Web application
  |     +- /views/frontend           - Access setting of Web application API (such as /api/topology)
  |     +- /models                   - Processing core of Web application API (such as topology.py)
  |
  +- /td-agent/plugin
     +- redis_output.rb              - Relaying plugin for Redis
     +- statistics_output.rb         - Graphing output plugin for Growthforecast


Database
=============
* MySQL table that SCN Admin uses is the following.

::

    +--------------------------+
    | Tables_in_oflogger       |
    +--------------------------+
    | latest_route             |
    | lost_switch              |
    | lost_switchport          |
    | nodelocation             |
    | route                    |
    | servicecommand           |
    | servicelocation          |
    | servicepath              |
    | servicepath_switch_relay |
    | servicetraffic           |
    | switch                   |
    | switchport               |
    +--------------------------+

* Column information of each table is the following.

::

    latest_route
    +-----------------+----------+------+-----+---------+----------------+
    | Field           | Type     | Null | Key | Default | Extra          |
    +-----------------+----------+------+-----+---------+----------------+
    | id              | int(11)  | NO   | PRI | NULL    | auto_increment |
    | src_switch_id   | int(11)  | NO   |     | NULL    |                |
    | src_switch_port | int(11)  | NO   |     | NULL    |                |
    | dst_switch_id   | int(11)  | NO   |     | NULL    |                |
    | dst_switch_port | int(11)  | NO   |     | NULL    |                |
    | bandwidth       | int(11)  | NO   |     | NULL    |                |
    | get_data_time   | datetime | NO   | MUL | NULL    |                |
    +-----------------+----------+------+-----+---------+----------------+

    lost_switch
    +--------------------+-------------+------+-----+---------+-------+
    | Field              | Type        | Null | Key | Default | Extra |
    +--------------------+-------------+------+-----+---------+-------+
    | switch_id          | int(11)     | NO   | MUL | NULL    |       |
    | switch_ip          | varchar(50) | NO   |     | NULL    |       |
    | switch_mac         | varchar(50) | YES  |     | NULL    |       |
    | switch_latest_time | datetime    | NO   |     | NULL    |       |
    +--------------------+-------------+------+-----+---------+-------+

    lost_switchport
    +------------------------+-------------+------+-----+---------+-------+
    | Field                  | Type        | Null | Key | Default | Extra |
    +------------------------+-------------+------+-----+---------+-------+
    | switch_id              | int(11)     | NO   | MUL | NULL    |       |
    | switch_ip              | varchar(50) | NO   |     | NULL    |       |
    | switchport_mac         | varchar(50) | NO   |     | NULL    |       |
    | switchport_port        | int(11)     | NO   |     | NULL    |       |
    | switchport_ip          | varchar(50) | YES  |     | NULL    |       |
    | switchport_latest_time | datetime    | NO   |     | NULL    |       |
    +------------------------+-------------+------+-----+---------+-------+

    nodelocation
    +------------------+-------------+------+-----+---------+-------+
    | Field            | Type        | Null | Key | Default | Extra |
    +------------------+-------------+------+-----+---------+-------+
    | node_ip          | varchar(50) | NO   | PRI | NULL    |       |
    | node_mac         | varchar(50) | NO   | PRI | NULL    |       |
    | node_alive       | tinyint(1)  | NO   |     | NULL    |       |
    | switch_id        | int(11)     | NO   | MUL | NULL    |       |
    | switch_port      | int(11)     | NO   |     | NULL    |       |
    | switch_port_name | varchar(20) | YES  |     | NULL    |       |
    | vgw_ip           | varchar(50) | NO   |     | NULL    |       |
    +------------------+-------------+------+-----+---------+-------+

    route
    +-----------------+----------+------+-----+---------+----------------+
    | Field           | Type     | Null | Key | Default | Extra          |
    +-----------------+----------+------+-----+---------+----------------+
    | table_id        | int(11)  | NO   | PRI | NULL    | auto_increment |
    | src_switch_id   | int(11)  | NO   |     | NULL    |                |
    | src_switch_port | int(11)  | NO   |     | NULL    |                |
    | dst_switch_id   | int(11)  | NO   |     | NULL    |                |
    | dst_switch_port | int(11)  | NO   |     | NULL    |                |
    | bandwidth       | int(11)  | NO   |     | NULL    |                |
    | get_data_time   | datetime | NO   | MUL | NULL    |                |
    +-----------------+----------+------+-----+---------+----------------+

    servicecommand
    +--------------------+-------------+------+-----+-------------------+-----------------------------+
    | Field              | Type        | Null | Key | Default           | Extra                       |
    +--------------------+-------------+------+-----+-------------------+-----------------------------+
    | id                 | int(11)     | NO   | PRI | NULL              | auto_increment              |
    | service_name       | varchar(50) | NO   | MUL | NULL              |                             |
    | commands           | text        | YES  |     | NULL              |                             |
    | command_created_at | timestamp   | NO   |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |
    +--------------------+-------------+------+-----+-------------------+-----------------------------+

    servicelocation
    +--------------+-------------+------+-----+---------+----------------+
    | Field        | Type        | Null | Key | Default | Extra          |
    +--------------+-------------+------+-----+---------+----------------+
    | id           | int(11)     | NO   | PRI | NULL    | auto_increment |
    | node_ip      | varchar(50) | NO   |     | NULL    |                |
    | service_key  | varchar(50) | NO   | MUL | NULL    |                |
    | service_name | varchar(50) | YES  |     | NULL    |                |
    +--------------+-------------+------+-----+---------+----------------+

    servicepath
    +------------------+-------------+------+-----+---------+----------------+
    | Field            | Type        | Null | Key | Default | Extra          |
    +------------------+-------------+------+-----+---------+----------------+
    | id               | int(11)     | NO   | PRI | NULL    | auto_increment |
    | path_id          | varchar(50) | NO   | MUL | NULL    |                |
    | src_node_mac     | varchar(50) | NO   |     | NULL    |                |
    | src_service_key  | varchar(50) | NO   |     | NULL    |                |
    | src_service_name | varchar(50) | NO   |     | NULL    |                |
    | dst_node_mac     | varchar(50) | NO   |     | NULL    |                |
    | dst_service_key  | varchar(50) | NO   |     | NULL    |                |
    | dst_service_name | varchar(50) | NO   |     | NULL    |                |
    +------------------+-------------+------+-----+---------+----------------+

    servicepath_switch_relay
    +------------------+-------------+------+-----+---------+-------+
    | Field            | Type        | Null | Key | Default | Extra |
    +------------------+-------------+------+-----+---------+-------+
    | path_id          | varchar(50) | NO   | PRI | NULL    |       |
    | switch_id        | int(11)     | NO   | PRI | NULL    |       |
    | switch_port      | int(11)     | NO   | PRI | NULL    |       |
    | switch_port_name | varchar(50) | NO   |     | NULL    |       |
    | ordered_id       | int(11)     | NO   | PRI | NULL    |       |
    +------------------+-------------+------+-----+---------+-------+

    servicetraffic
    +------------------+---------------+------+-----+---------+-------+
    | Field            | Type          | Null | Key | Default | Extra |
    +------------------+---------------+------+-----+---------+-------+
    | path_id          | varchar(50)   | NO   | PRI | NULL    |       |
    | src_service_name | varchar(50)   | NO   | PRI | NULL    |       |
    | dst_service_name | varchar(50)   | NO   | PRI | NULL    |       |
    | traffic          | decimal(10,3) | NO   |     | NULL    |       |
    +------------------+---------------+------+-----+---------+-------+

    switch
    +--------------------+---------------+------+-----+---------+-------+
    | Field              | Type          | Null | Key | Default | Extra |
    +--------------------+---------------+------+-----+---------+-------+
    | switch_id          | int(11)       | NO   | PRI | NULL    |       |
    | switch_ip          | varchar(50)   | NO   | PRI | NULL    |       |
    | switch_mac         | varchar(50)   | YES  |     | NULL    |       |
    | switch_latest_time | datetime      | NO   |     | NULL    |       |
    | switch_flag        | enum('Y','N') | NO   |     | NULL    |       |
    +--------------------+---------------+------+-----+---------+-------+

    switchport
    +------------------------+---------------+------+-----+---------+-------+
    | Field                  | Type          | Null | Key | Default | Extra |
    +------------------------+---------------+------+-----+---------+-------+
    | switch_id              | int(11)       | NO   | MUL | NULL    |       |
    | switch_ip              | varchar(50)   | NO   |     | NULL    |       |
    | switchport_mac         | varchar(50)   | NO   | PRI | NULL    |       |
    | switchport_port        | int(11)       | NO   | PRI | NULL    |       |
    | switchport_ip          | varchar(50)   | YES  |     | NULL    |       |
    | switchport_latest_time | datetime      | NO   |     | NULL    |       |
    | switchport_flag        | enum('Y','N') | NO   |     | NULL    |       |
    +------------------------+---------------+------+-----+---------+-------+


Client side
-------------------
* SCN Admin client side visualizes log output from each node that is created by the server side.
* Customization will be done after /scnv.

File configuration
^^^^^^^^^^^^^^^^^^
* SCN Admin client side consists of the following files.

::

  / (Route of repository)
  |
  +- /conf
  |  +- /nginx                       - Settings of Web server
  |
  +- /webapp/oflogviewer/static      - The following files are those accessed directly from the Web
     +- /js                          - Settings for Web application and library group
     +- /scnv
        +- application.js            - Settings for Juggernaut
        +- index.html                - User page of SCN-Visualizer (DOM configuration)
        +- admin.html                - Administrator page of SCN-Visualizer
        +- /css                      - CSS group of SCN-Visualizer
        |  +- default.css            - Applied style
        |
        +- /img                      - Image group of SCN-Visualizer
        +- /js
           +- app.js                 - Entry point of application (User/Administrator page)
           +- template.js            - Template
           +- (Others).js            - Others class group. Refer to document
           +- /vendor                - Library group


Communication data
==================

* Data that are sent to the web server from the service node and the OpenFlow controller node are in JSON format.
* Using a key and rule that are included in the data, perform display processing. 

Sent data from service node to web server
-----------------------------------------

Log display
^^^^^^^^^^^
::

    (Format)
    {
        "type": Method type,
        "key" : NoSQL Key,
        "data": {
            "Code"     : DSN Run command,
            "Rule"     : Rule ID (“dummy” fixed),
            "Src"      : Data transmission source (“dummy” fixed),
            "Time"     : Time stamp when data sent,
            "Timestamp": Millisecond of the time stamp when data sent
        }
    }

    (Example)
    {
        "type": "publish",
        "key" : "overlay",
        "data": {
            "Code"     : "DISCOVERY_RESPONSE : [\"EventWarehouseService\"]",
            "Rule"     : "dummy",
            "Src"      : "dummy",
            "Time"     : "10:07:12.457",
            "Timestamp": 457
        }
    }


Notification of joining service
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
::

    (Format)
    {
        "type": Method type,
        "key" : NoSQL Key,
        "data": {
            "Code"     : DSN Run command,
            "Rule"     : Rule ID,
            "Src"      : Service name,
            "Time"     : Time stamp when data sent,
            "Timestamp": Millisecond of the time stamp when data sent
        }
    }

    (Example)
    {
        "type": "publish",
        "key" : "overlay",
        "data": {
            "Code"     : "INSERT_SERVICE : DataStoreService",
            "Rule"     : "r1",
            "Src"      : "DataStoreService",
            "Time"     : "10:07:12.219",
            "Timestamp": 219
        }
    }


Notification of leaving service
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
::

    (Format)
    {
        "type": Method type,
        "key" : NoSQL Key,
        "data": {
            "Code"     : DSN Run command,
            "Rule"     : Rule ID,
            "Src"      : Name of leaving service,
            "Time"     : Time stamp when data sent,
            "Timestamp": Millisecond of the time stamp when data sent
        }
    }

    (Example)
    {
        "type": "publish",
        "key" : "overlay",
        "data": {
            "Code"     : "LEAVE_SERVICE : SoratenaUvaSensor_5",
            "Rule"     : "r7",
            "Src"      : "SoratenaUvaSensor_5",
            "Time"     : "10:23:10.071",
            "Timestamp": 71
        }
    }


Notification of channel creation (service cooperation)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
::

    (Format)
    {
        "type": Method type,
        "key" : NoSQL Key,
        "data": {
            "Code"     : DSN Run command,
            "Rule"     : Rule ID,
            "Src"      : Service name of data transmission source,
            "Dst"      : Service name of data transmission destination,
            "Uid"      : Service cooperation name,
            "Time"     : Time stamp when data sent,
            "Timestamp": Millisecond of the time stamp when data sent,
            "Value"    : {
                "add.src" : Service name of data transmission source,
                "add.dst" : Service name of data transmission destination,
                "add.uid" : Service cooperation name,
                "add.no"  : Bidirectional path ID,
                "src.path": Transmission source path ID,
                "dst.path": Transmission destination path ID
            }
        }
    }

    (Example)
    {
        "type": "publish",
        "key" : "overlay",
        "data": {
            "Code"     : "CREATE_SERVICE_LINK : UV Alarm(SoratenaSunSensor_5 -> DataStoreService)",
            "Rule"     : "r2",
            "Src"      : "SoratenaSunSensor_5",
            "Dst"      : "DataStoreService",
            "Uid"      : "UV Alarm",
            "Time"     : "10:12:53.623",
            "Timestamp": 623,
            "Value"    : {
                "add.src" : "SoratenaSunSensor_5",
                "add.dst" : "DataStoreService",
                "add.uid" : "UV Alarm",
                "add.no"  : "241_bi_242",
                "src.path": "241",
                "dst.path": "242"
            }
        }
    }


Notification of channel creation (path)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
::

    (Format)
    {
        "type": Method type,
        "key" : NoSQL Key,
        "data": {
            "Code"     : DSN Run command(null fixed),
            "Rule"     : Rule ID,
            "Src"      : Service name of data transmission source,
            "Dst"      : Service name of data transmission destination,
            "Uid"      : Service cooperation name,
            "Time"     : Time stamp when data sent,
            "Timestamp": Millisecond of the time stamp when data sent,
            "Value"    : {
                "src.path": Transmission source path ID,
                "dst.path": Transmission destination path ID
            }
        }
    }

    (Example)
    {
        "type": "publish",
        "key" : "overlay",
        "data": {
            "Code"     : null,
            "Rule"     : "cr",
            "Src"      : "SoratenaUvaSensor_4",
            "Dst"      : "DataStoreService",
            "Uid"      : "UV Alarm",
            "Time"     : "10:07:54.729",
            "Timestamp": 729,
            "Value"    : {
                "src.path": "231",
                "dst.path": "232"
            }
        }
    }


Notification of deletion channel (service cooperation)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
::

    (Format)
    {
        "type": Method type,
        "key" : NoSQL Key,
        "data": {
            "Code"     : DSN Run command,
            "Rule"     : Rule ID,
            "Src"      : Service name of data transmission source,
            "Dst"      : Service name of data transmission destination,
            "Uid"      : Service cooperation name,
            "Time"     : Time stamp when data sent,
            "Timestamp": Millisecond of the time stamp when data sent,
            "Value"    : {
                "seq.src" : Service name of data transmission source,
                "seq.dst" : Service name of data transmission destination,
                "seq.uid" : Service cooperation name,
                "seq.no"  : Bidirectional path ID,
                "src.path": Transmission source path ID,
                "dst.path": Transmission destination path ID
            }
        }
    }

    (Example)
    {
        "type": "publish",
        "key" : "overlay",
        "data": {
            "Code"     : "DELETE_SERVICE_LINK : UV Alarm(SoratenaUvaSensor_4 -> DataStoreService)",
            "Rule"     : "r3",
            "Src"      : "SoratenaUvaSensor_4",
            "Dst"      : "DataStoreService",
            "Uid"      : "UV Alarm",
            "Time"     : "10:12:58.236",
            "Timestamp": 236,
            "Value"    : {
                "seq.src" : "SoratenaUvaSensor_4",
                "seq.dst" : "DataStoreService",
                "seq.uid" : "UV Alarm",
                "seq.no"  : "231_bi_232",
                "src.path": "231",
                "dst.path": "232"
            }
        }
    }


Notification of deletion channel (path)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
::

    (Format)
    {
        "type": Method type,
        "key" : NoSQL Key,
        "data": {
            "Code"     : DSN Run command(null fixed),
            "Rule"     : Rule ID,
            "Src"      : Service name of data transmission source,
            "Dst"      : Service name of data transmission destination,
            "Uid"      : Service cooperation name,
            "Time"     : Time stamp when data sent,
            "Timestamp": Millisecond of the time stamp when data sent,
            "Value"    : {
                "src.path": Transmission source path ID,
                "dst.path": Transmission destination path ID
            }
        }
    }

    (Example)
    {
        "type": "publish",
        "key" : "overlay",
        "data": {
            "Code"     : null,
            "Rule"     : "dr",
            "Src"      : "SoratenaSunSensor_4",
            "Dst"      : "DataStoreService",
            "Uid"      : "UV Alarm",
            "Time"     : "10:12:52.015",
            "Timestamp": 15,

