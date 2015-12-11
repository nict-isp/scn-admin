# production
mysql -u oflogger -poflogger oflogger < dropall.sql
mysql -u oflogger -poflogger oflogger < bandwidth.sql 
mysql -u oflogger -poflogger oflogger < nodelodation.sql 
mysql -u oflogger -poflogger oflogger < servicelocation.sql 
mysql -u oflogger -poflogger oflogger < servicepath.sql 
mysql -u oflogger -poflogger oflogger < switch.sql
mysql -u oflogger -poflogger oflogger < servicecommand.sql
# test
#mysql -u oflogger -poflogger oflogger_test < dropall.sql
#mysql -u oflogger -poflogger oflogger_test < bandwidth.sql 
#mysql -u oflogger -poflogger oflogger_test < nodelodation.sql 
#mysql -u oflogger -poflogger oflogger_test < servicelocation.sql 
#mysql -u oflogger -poflogger oflogger_test < servicepath.sql 
#mysql -u oflogger -poflogger oflogger_test < switch.sql
#mysql -u oflogger -poflogger oflogger_test < servicecommand.sql
