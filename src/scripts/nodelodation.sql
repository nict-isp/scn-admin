DROP TABLE IF EXISTS `nodelocation` ;
CREATE TABLE `nodelocation` (
  node_ip varchar(50) NOT NULL,
  node_mac varchar(50) NOT NULL,
  node_alive boolean NOT NULL,
  switch_id int NOT NULL,
  switch_port int NOT NULL,
  switch_port_name varchar(20) DEFAULT NULL,
  vgw_ip varchar(50) NOT NULL,
  primary key(node_ip,node_mac),
  index(switch_id,switch_port)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;
