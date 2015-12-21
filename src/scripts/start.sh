#!/bin/sh

#sudo /etc/init.d/nginx start

#/etc/init.d/mysqld start

redis-server /opt/local/projects/openflowlogger/conf/redis.conf

td-agent -c /opt/local/projects/openflowlogger/conf/td-agent.conf -o /opt/local/projects/openflowlogger/var/log/td-agent.log -p /opt/local/projects/openflowlogger/td-agent/plugin &

supervisord -c /opt/local/projects/openflowlogger/conf/supervisord.conf

/usr/local/sbin/visualizer restart


