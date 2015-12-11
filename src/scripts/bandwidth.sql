DROP TABLE IF EXISTS `route` ;
CREATE TABLE `route` (
  table_id int not null auto_increment,
  src_switch_id int not null,
  src_switch_port int not null,
  dst_switch_id int not null,
  dst_switch_port int not null,
  bandwidth int not null,
  get_data_time datetime not null,
  primary key(table_id),
  index(get_data_time)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;

DROP TABLE IF EXISTS `latest_route` ;
CREATE TABLE `latest_route` (
  id int not null auto_increment,
  src_switch_id int not null,
  src_switch_port int not null,
  dst_switch_id int not null,
  dst_switch_port int not null,
  bandwidth int not null,
  get_data_time datetime not null,
  primary key(id),
  index(get_data_time)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;
