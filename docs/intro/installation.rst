=============
Installation
=============

Installation of the tool library required for SCN Admin operation
=================================================================

.. _Python: http://www.python.org
.. _pip: https://pip.pypa.io/
.. _setuptools: https://pypi.python.org/pypi/setuptools
.. _Ruby: https://www.ruby-lang.org/
.. _RubyGems: https://rubygems.org/
.. _Flask: http://flask.pocoo.org/
.. _nginx: http://nginx.org/
.. _gunicorn: http://gunicorn.org/
.. _meinheld: https://github.com/mopemope/meinheld
.. _MySQL: https://www-jp.mysql.com/
.. _Redis: http://redis.io/
.. _node.js: https://nodejs.org/
.. _juggernaut: https://github.com/maccman/juggernaut
.. _fluentd: http://www.fluentd.org/
.. _GrowthForecast: http://kazeburo.github.io/GrowthForecast/
.. _supervisor: http://supervisord.org/
.. _Backbone.js: http://backbonejs.org/
.. _jQuery.js: https://jquery.com/
.. _jQuery UI: http://jqueryui.com/
.. _Underscore.js: http://underscorejs.org/
.. _Raphael.js: http://raphaeljs.com/
.. _three.js: http://threejs.org/


To operate SCN Admin, the following tool library must be installed.

Server side
-------------

#. `Python`_ ver. 2.7.

#. `pip`_ 、 `setuptools`_ Package management tool of Python. setuptools will be installed automatically when pip is installed.

#. `Ruby`_ ver. 1.9.3.

#. `RubyGems`_ Pakage management tool of Ruby.

#. `Flask`_ A light web application framework for Python.

#. `nginx`_ web server.

#. `gunicorn`_ HTTP server for Python.

#. `meinheld`_ Asynchronous Python WSGI Web server.

#. `MySQL`_ RDBMS.

#. `Redis`_  NoSQL.

#. `node.js`_ JapaScript interpreter at server side.

#. `juggernaut`_ Library that enables data push from server to clients.

#. `fluentd`_ Log collection library.

#. `GrowthForecast`_ Graphing tool.

#. `supervisor`_ Process control tool.


Client side
---------------

#. `juggernaut`_ Library that enables data push from the server to a client.

#. `Backbone.js`_ MVC framework of JavaScript.

#. `jQuery.js`_  JavaScript Library that is designed to simplify writing of JavaScript code.

#. `jQuery UI`_ User Interface that is established on JavaScript of jQuery.

#. `Underscore.js`_ Utility library that makes the handling function, array and object of JavaScript easier.

#. `Raphael.js`_ JavaScript library that produces vector graphics using SVG and VML.

#. `three.js`_ JavaScript library that produces Web GL graphics.


Recommended system requirements
===============================

+---------------------+----------------+----------------------+
| HW/SW               | Item           | Requirement          |
+=====================+================+======================+
| Hardware            | CPU            | 2 GHz or faster      |
|                     +----------------+----------------------+
|                     | Memory         | 4 GB or more         |
|                     +----------------+----------------------+
|                     | Storage        | 16 GB or more        |
+---------------------+----------------+----------------------+
| Software            | OS             | CentOS 6.6 or above  |
+---------------------+----------------+----------------------+




SCN Admin installation
========================

*  Copy source code from the GitHub repository and create symbolic link

::

    $ git clone git://github.com/nict-isp/scn-admin.git
    $ cd /opt/local/projects
    $ sudo ln -s /home/isp/scn-admin/src openflowlogger


*  Overwrite the IP address described in the following conf file to match the environment in which it is installed.

::

    $ /opt/local/projects/openflowlogger/conf/redis.conf
    $ /opt/local/projects/openflowlogger/conf/td-agent.conf
    $ /opt/local/projects/openflowlogger/conf/gunicorn.production.conf.py
    $ /opt/local/projects/openflowlogger/conf/supervisord.conf


Installation procedure per platform
======================================

CentOS 6.6 or above
-------------------

Server side
^^^^^^^^^^^^^

*  Prior preparation

 * Add EPEL repository
    ::

        $ sudo wget http://ftp-srv2.kddilabs.jp/Linux/distributions/fedora/epel/6/x86_64/epel-release-6-8.noarch.rpm
        $ sudo rpm -ivh epel-release-6-8.noarch.rpm
        $ sudo sed -i 's/enabled=1/enabled=0/g' /etc/yum.repos.d/epel.repo


 * For installing  `nginx`_ .
    ::

        $ sudo rpm -ivh http://nginx.org/packages/centos/6/noarch/RPMS/nginx-release-centos-6-0.el6.ngx.noarch.rpm
        $ sudo sed -i 's/enabled=1/enabled=0/g' /etc/yum.repos.d/nginx.repo


*   For installing `Ruby`_ , `RubyGems`_ .
    ::

        $ cd /usr/local/src
        $ sudo wget https://cache.ruby-lang.org/pub/ruby/1.9/ruby-1.9.3-p551.tar.gz
        $ sudo tar zxvf ruby-1.9.3-p551.tar.gz
        $ cd ruby-1.9.3-p551
        $ sudo ./configure
        $ sudo make
        $ sudo make install
        $ sudo yum install rubygems



*   For installing `Flask`_ .
    ::

        $ sudo pip install flask
        $ sudo pip install Flask-Script
        $ sudo pip install Flask-Babel
        $ sudo pip install SQLAlchemy
        $ sudo pip install sqlsoup


*   For installing `nginx`_ .
    ::

        $ sudo yum --enablerepo=nginx install nginx


*   For installing `gunicorn`_ .
    ::

        $ sudo pip install gunicorn


*   For installing `meinheld`_ .
    ::

        $ sudo pip install meinheld


*   For installing `Redis`_ .
    ::

        $ sudo yum install redis --enablerepo=epel


*   For installing `node.js`_ .
    ::

        $ sudo yum install nodejs --enablerepo=epel


*   For installing `juggernaut`_ .
    ::

        $ sudo pip install juggernaut


*   For installing `fluentd`_ .
    ::

        $ curl -L https://td-toolbelt.herokuapp.com/sh/install-redhat-td-agent2.sh | sh


*   For installing `GrowthForecast`_ .

 * Install required package.
    ::

        $ sudo yum groupinstall "Development Tools"
        $ sudo yum install pkgconfig glib2-devel gettext libxml2-devel pango-devel cairo-devel

 * Switch user.
    ::

        $ sudo useradd growthforecast
        $ sudo passwd growthforecast
        $ su - growthforecast

 * Install Perlbrew.
    ::

        $ curl -kL http://install.perlbrew.pl | bash
        $ echo 'source ~/perl5/perlbrew/etc/bashrc' >> ~/.bash_profile
        $ source ~/.bash_profile
        $ perlbrew available
        $ perlbrew install perl-5.20.0
        $ perlbrew available
        $ perl -v
        $ perlbrew switch perl-5.20.0
        $ perl -v

 * Install cpanm.
    ::

        $ perlbrew install-cpanm

 * Prepare Growthforecast installation.
    ::

        $ sudo yum install glib2
        sudo yum install cairo
        sudo yum install cairo-devel
        sudo yum install pango
        sudo yum install pango-devel
        sudo yum install libxml2-devel
        cpanm -v Alien::RRDtool
        cpanm -f -v Starlet

 * Install Growthforecast
    ::

        $ git clone git://github.com/kazeburo/GrowthForecast.git
        $ cd GrowthForecast/
        $ cpanm --installdeps .

 * Others settings.
    ::

        $ export PERL_CPANM_OPT="--local-lib=~/perl5"
        $ export PERL5LIB="/home/growthforecast/perl5/lib/perl5"
        $ export PATH="~/perl5/bin:$PATH"
        $ mkdir /home/growthforecast/data
        $ mkdir /home/growthforecast/log

 * Install plug-in that is required for cooperation between `fluentd`_ and `GrowthForecast`_ .
    ::

        $ sudo /opt/td-agent/embedded/bin/fluent-gem install fluent-plugin-growthforecast
        $ sudo /opt/td-agent/embedded/bin/fluent-gem install fluent-plugin-datacounter
        $ sudo /opt/td-agent/embedded/bin/fluent-gem install fluent-plugin-redis
        $ sudo gem install redis
        $ sudo gem install json
        $ sudo /opt/td-agent/embedded/bin/fluent-gem install growthforecast

*   Install supervisor `supervisor`_ .
    ::

        $ sudo pip install supervisor --upgrade
        $ sudo pip install meld3==1.0.0

Client side
^^^^^^^^^^^^^^^

*   Install `juggernaut`_ (front-end)).
    ::

        $ git clone https://github.com/maccman/juggernaut.git
        $ cp -r juggernaut/lib/juggernaut /opt/local/projects/openflowlogger/webapp/lib/.
        $ cp juggernaut/public/application.js /opt/local/projects/openflowlogger/webapp/oflogviewer/static/scnv/.

*   Install `Backbone.js`_ .
    ::

        $ wget http://backbonejs.org/backbone-min.js
        $ cp backbone-min.js /opt/local/projects/openflowlogger/webapp/oflogviewer/static/js/.
        $ cp backbone-min.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/.

*   Install `jQuery.js`_ .
    ::

        $ wget http://code.jquery.com/jquery-1.7.2.min.js
        $ cp jquery-1.7.2.min.js /opt/local/projects/openflowlogger/webapp/oflogviewer/static/js/.
        $ cp jquery-1.7.2.min.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/jquery.js

*   Install `jQuery UI`_ .
    ::

        $ wget http://jqueryui.com/resources/download/jquery-ui-1.11.4.zip
        $ unzip jquery-ui-1.11.4.zip
        $ cp jquery-ui-1.11.4/jquery-ui.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/.

*   Install `Underscore.js`_ .
    ::

        $ wget http://underscorejs.org/underscore-min.js
        $ cp underscore-min.js /opt/local/projects/openflowlogger/webapp/oflogviewer/static/js/.
        $ cp underscore-min.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/.

*   Install `Raphael.js`_ .
    ::

        $ git clone https://github.com/DmitryBaranovskiy/raphael
        $ cp raphael/raphael-min.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/.

*   Install `three.js`_ .
    ::

        $ git clone https://github.com/mrdoob/three.js
        $ cp three.js/build/three.min.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/.
        $ mkdir /opt/local/projects/openflowlogger/static/scnv/js/vendor/three
        $ cp three.js/examples/js/controls/OrbitControls.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/three/.


======================
Configuration settings
======================

OS settings
===========

Firewall settings
-----------------------
Open the port that is used by SCN Admin.

::

    $ sudo vi /etc/sysconfig/iptables


Add the following.

::

    -A INPUT -m state --state NEW -m tcp -p tcp --dport 80 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 5125 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 6379 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 8000 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 8080 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 22001:22100 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 24224 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 55555 -j ACCEPT

