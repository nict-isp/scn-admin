DROP TABLE IF EXISTS `servicepath` ;
CREATE TABLE `servicepath` (
  id int not null auto_increment,
  path_id varchar(50) NOT NULL,
  src_node_mac varchar(50) NOT NULL,
  src_service_key varchar(50) NOT NULL,
  src_service_name varchar(50) NOT NULL,
  dst_node_mac varchar(50) NOT NULL,
  dst_service_key varchar(50) NOT NULL,
  dst_service_name varchar(50) NOT NULL,
  primary key(id),
  index(path_id, src_node_mac, dst_node_mac)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;

DROP TABLE IF EXISTS `servicepath_switch_relay` ;
CREATE TABLE `servicepath_switch_relay` (
  path_id varchar(50) NOT NULL,
  switch_id int NOT NULL,
  switch_port int NOT NULL,
  switch_port_name varchar(50) NOT NULL,
  ordered_id int NOT NULL,
  primary key(path_id,switch_id,switch_port,ordered_id),
  index(path_id),
  foreign key(path_id) references servicepath(path_id)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;

DROP TABLE IF EXISTS `servicetraffic` ;
CREATE TABLE `servicetraffic` (
  path_id varchar(50) NOT NULL,
  src_service_name varchar(50) NOT NULL,
  dst_service_name varchar(50) NOT NULL,
  traffic decimal(10,3) NOT NULL,
  primary key(path_id,src_service_name,dst_service_name),
  index(path_id),
  foreign key(path_id) references servicepath(path_id)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;
