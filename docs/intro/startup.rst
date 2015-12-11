================
SCN Adminの起動
================

Redisの起動
------------

下記のコマンドを実行します。

::

    $ redis-server /opt/local/projects/openflowlogger/conf/redis.conf


MySQLサーバの起動
------------------

下記のコマンドを実行します。

::

    $ /etc/init.d/mysqld start


fluentdの起動
--------------

下記のコマンドを実行します。

::

    $ td-agent -c /opt/local/projects/openflowlogger/conf/td-agent.conf -o /opt/local/projects/openflowlogger/var/log/td-agent.log -p /opt/local/projects/openflowlogger/td-agent/plugin



Growthforecastの起動
---------------------

下記のコマンドを実行します。

::

    $ /home/growthforecast/GrowthForecast/growthforecast.pl --port=5125 --data-dir=/home/growthforecast/data > /home/growthforecast/log/growthforecast.log 2> /home/growthforecast/log/growthforecast.err &



nginxの起動
------------

下記のコマンドを実行します。

::

    $ sudo /etc/init.d/nginx start


gunicornの起動
---------------

下記のコマンドを実行します。

::

    $ gunicorn -c /opt/local/projects/openflowlogger/conf/gunicorn.production.conf.py manage:app


juggernautの起動
-----------------

下記のコマンドを実行します。

::

    $ node /opt/local/projects/openflowlogger/webapp/lib/juggernaut/server.js


supervisorの起動
-----------------

下記のコマンドを実行します。

::

    $ /usr/local/sbin/visualizer restart



