Starting SCN Admin
==================

Starting Redis
--------------

Run the following command

::

    $ redis-server /opt/local/projects/openflowlogger/conf/redis.conf


Starting MySQL Server
---------------------

Run the following command

::

    $ /etc/init.d/mysqld start


Starting fluentd
----------------

Run the following command

::

    $ td-agent -c /opt/local/projects/openflowlogger/conf/td-agent.conf -o /opt/local/projects/openflowlogger/var/log/td-agent.log -p /opt/local/projects/openflowlogger/td-agent/plugin



Starting Growthforecast
-----------------------

Run the following command

::

    $ /home/growthforecast/GrowthForecast/growthforecast.pl --port=5125 --data-dir=/home/growthforecast/data > /home/growthforecast/log/growthforecast.log 2> /home/growthforecast/log/growthforecast.err &



Starting nginx
--------------

Run the following command

::

    $ sudo /etc/init.d/nginx start


Starting gunicorn
-----------------

Run the following command

::

    $ gunicorn -c /opt/local/projects/openflowlogger/conf/gunicorn.production.conf.py manage:app


Starting juggernaut
-------------------

Run the following command

::

    $ node /opt/local/projects/openflowlogger/webapp/lib/juggernaut/server.js


Starting supervisor
-------------------

Run the following command

::

    $ /usr/local/sbin/visualizer restart

