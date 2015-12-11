#!/bin/sh

FOLDER="/opt/local/projects/openflowlogger"

cd $FOLDER

cd scripts
echo -e "\n\033[1;35misp@172.18.102.1 \033[0m\033[1;34mscripts\033[0m$ mysql -u oflogger oflogger < dump.sql"
mysql -u oflogger -poflogger oflogger < dump.sql

exit 0

