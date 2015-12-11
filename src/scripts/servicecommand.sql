DROP TABLE IF EXISTS `servicecommand` ;
CREATE TABLE `servicecommand` (
  id int not null auto_increment,
  service_name varchar(50) NOT NULL,
  commands text,
  command_created_at timestamp,
  primary key(id),
  index(service_name, commands(256))
)ENGINE=INNODB DEFAULT CHARACTER SET = utf8 COLLATE = utf8_general_ci;
