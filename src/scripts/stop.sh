#!/bin/sh

pkill -KILL supervisord

pkill -KILL python

sudo pkill -KILL -f /opt/local/projects/openflowlogger/conf/gunicorn.production.conf.py

pkill -KILL -f /opt/local/projects/openflowlogger/conf/td-agent.conf

pkill -KILL -f /opt/local/projects/openflowlogger/conf/redis.conf

#/etc/init.d/mysqld stop

# sudo /etc/init.d/nginx stop


