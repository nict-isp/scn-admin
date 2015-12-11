DROP TABLE IF EXISTS `switch` ;
CREATE TABLE `switch` (
  switch_id int NOT NULL,
  switch_ip varchar(50) NOT NULL,
  switch_mac varchar(50),
  switch_latest_time datetime NOT NULL,
  switch_flag enum('Y','N') NOT NULL,
  primary key(switch_id,switch_ip)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;

DROP TABLE IF EXISTS `switchport` ;
CREATE TABLE `switchport` (
  switch_id int NOT NULL,
  switch_ip varchar(50) NOT NULL,
  switchport_mac varchar(50) NOT NULL,
  switchport_port int NOT NULL,
  switchport_ip varchar(50),
  switchport_latest_time datetime NOT NULL,
  switchport_flag enum('Y','N') NOT NULL,
  primary key(switchport_mac, switchport_port),
  index(switch_id,switch_ip),
  foreign key(switch_id,switch_ip) references switch(switch_id,switch_ip)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;

DROP TABLE IF EXISTS `lost_switch` ;
CREATE TABLE `lost_switch` (
  switch_id int NOT NULL,
  switch_ip varchar(50) NOT NULL,
  switch_mac varchar(50),
  switch_latest_time datetime NOT NULL,
  index(switch_id,switch_ip,switch_latest_time)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;

DROP TABLE IF EXISTS `lost_switchport` ;
CREATE TABLE `lost_switchport` (
  switch_id int NOT NULL,
  switch_ip varchar(50) NOT NULL,
  switchport_mac varchar(50) NOT NULL,
  switchport_port int NOT NULL,
  switchport_ip varchar(50),
  switchport_latest_time datetime NOT NULL,
  index(switch_id,switch_ip,switchport_latest_time)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;

