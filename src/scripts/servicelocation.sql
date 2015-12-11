DROP TABLE IF EXISTS `servicelocation` ;
CREATE TABLE `servicelocation` (
  id int not null auto_increment,
  node_ip varchar(50) NOT NULL,
  service_key varchar(50) NOT NULL,
  service_name varchar(50) DEFAULT NULL,
  primary key(id),
  index(service_key,node_ip,service_name)
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;
