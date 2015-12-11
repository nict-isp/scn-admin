=============
インストール
=============

SCN Adminの動作に必要なツール・ライブラリのインストール
========================================================

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


SCN Adminを動作させるために、以下のツール・ライブラリをインストールする必要があります。

バックエンド
-------------

#. `Python`_ バージョン2.7。

#. `pip`_ 、 `setuptools`_ Pythonのパッケージ管理ツール。 `setuptools`_ は、 `pip`_ のインストール時に自動でインストールされる。

#. `Ruby`_ バージョン1.9.3。

#. `RubyGems`_ Rubyのパッケージ管理ツール。

#. `Flask`_ Python用の軽量なwebアプリケーションフレームワーク。

#. `nginx`_ webサーバ。

#. `gunicorn`_ Python用のHTTPサーバ 。

#. `meinheld`_ 非同期Python WSGI Webサーバー。

#. `MySQL`_ RDBMS。

#. `Redis`_  NoSQL。

#. `node.js`_ サーバサイドのJavaScriptインタープリター。

#. `juggernaut`_ サーバからクライアントへのデータpushを可能にするするライブラリ。

#. `fluentd`_ ログ収集ライブラリ。

#. `GrowthForecast`_ グラフ化ツール。

#. `supervisor`_ プロセス制御ツール。


フロントエンド
---------------

#. `juggernaut`_ サーバからクライアントへのデータpushを可能にするするライブラリ。

#. `Backbone.js`_ JavaScriptのMVCフレームワーク。

#. `jQuery.js`_ JavaScriptコードをより容易に記述できるようにするために設計されたJavaScriptライブラリ。

#. `jQuery UI`_ jQueryのJavaScript上に構築されたユーザインタフェース。

#. `Underscore.js`_ JavaScriptの関数や配列、オブジェクトを容易に扱うためのユーティリティライブラリ。

#. `Raphael.js`_ SVGとVMLを使用してベクターグラフィックスを作成するJavaScriptライブラリ。

#. `three.js`_ WebGLグラフィックスを作成するJavaScriptライブラリ。



SCN Adminのインストール
========================

*  GitHubリポジトリからソースコードをコピーし、シンボリックリンクを貼ります。

::

    $ git clone git://github.com/nict-isp/scn-admin.git
    $ cd /opt/local/projects
    $ sudo ln -s /home/isp/scn-admin/src openflowlogger


*  以下のconfファイル中に記述されているIPアドレスを、インストール先の環境に合わせて書き換えます。

::

    $ /opt/local/projects/openflowlogger/conf/redis.conf
    $ /opt/local/projects/openflowlogger/conf/td-agent.conf
    $ /opt/local/projects/openflowlogger/conf/gunicorn.production.conf.py
    $ /opt/local/projects/openflowlogger/conf/supervisord.conf


プラットフォーム別のインストール手順
======================================

CentOS 6.6 以上
----------------

バックエンド
^^^^^^^^^^^^^

*  事前準備

 * EPELリポジトリの追加
    ::

        $ sudo wget http://ftp-srv2.kddilabs.jp/Linux/distributions/fedora/epel/6/x86_64/epel-release-6-8.noarch.rpm
        $ sudo rpm -ivh epel-release-6-8.noarch.rpm
        $ sudo sed -i 's/enabled=1/enabled=0/g' /etc/yum.repos.d/epel.repo


 * `nginx`_ のインストール向け
    ::

        $ sudo rpm -ivh http://nginx.org/packages/centos/6/noarch/RPMS/nginx-release-centos-6-0.el6.ngx.noarch.rpm
        $ sudo sed -i 's/enabled=1/enabled=0/g' /etc/yum.repos.d/nginx.repo


*   `Ruby`_ 、 `RubyGems`_ のインストール。
    ::

        $ cd /usr/local/src
        $ sudo wget https://cache.ruby-lang.org/pub/ruby/1.9/ruby-1.9.3-p551.tar.gz
        $ sudo tar zxvf ruby-1.9.3-p551.tar.gz
        $ cd ruby-1.9.3-p551
        $ sudo ./configure
        $ sudo make
        $ sudo make install
        $ sudo yum install rubygems



*   `Flask`_ のインストール。
    ::

        $ sudo pip install flask
        $ sudo pip install Flask-Script
        $ sudo pip install Flask-Babel
        $ sudo pip install SQLAlchemy
        $ sudo pip install sqlsoup


*   `nginx`_ のインストール。
    ::

        $ sudo yum --enablerepo=nginx install nginx


*   `gunicorn`_ のインストール。
    ::

        $ sudo pip install gunicorn


*   `meinheld`_ のインストール。
    ::

        $ sudo pip install meinheld


*   `Redis`_ のインストール。
    ::

        $ sudo yum install redis --enablerepo=epel


*   `node.js`_ のインストール。
    ::

        $ sudo yum install nodejs --enablerepo=epel


*   `juggernaut`_ のインストール。
    ::

        $ sudo pip install juggernaut


*   `fluentd`_ のインストール。
    ::

        $ curl -L https://td-toolbelt.herokuapp.com/sh/install-redhat-td-agent2.sh | sh


*   `GrowthForecast`_ のインストール。

 * 必須パッケージのインストール。
    ::

        $ sudo yum groupinstall "Development Tools"
        $ sudo yum install pkgconfig glib2-devel gettext libxml2-devel pango-devel cairo-devel

 * ユーザ切り替え。
    ::

        $ sudo useradd growthforecast
        $ sudo passwd growthforecast
        $ su - growthforecast

 * Perlbrewインストール。
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

 * cpanmインストール。
    ::

        $ perlbrew install-cpanm

 * Growthforecastインストール準備。
    ::

        $ sudo yum install glib2
        sudo yum install cairo
        sudo yum install cairo-devel
        sudo yum install pango
        sudo yum install pango-devel
        sudo yum install libxml2-devel
        cpanm -v Alien::RRDtool
        cpanm -f -v Starlet

 * Growthforecastインストール。
    ::

        $ git clone git://github.com/kazeburo/GrowthForecast.git
        $ cd GrowthForecast/
        $ cpanm --installdeps .

 * その他設定。
    ::

        $ export PERL_CPANM_OPT="--local-lib=~/perl5"
        $ export PERL5LIB="/home/growthforecast/perl5/lib/perl5"
        $ export PATH="~/perl5/bin:$PATH"
        $ mkdir /home/growthforecast/data
        $ mkdir /home/growthforecast/log

 * `fluentd`_ と `GrowthForecast`_ の連携に必要なプラグインのインストール。
    ::

        $ sudo /opt/td-agent/embedded/bin/fluent-gem install fluent-plugin-growthforecast
        $ sudo /opt/td-agent/embedded/bin/fluent-gem install fluent-plugin-datacounter
        $ sudo /opt/td-agent/embedded/bin/fluent-gem install fluent-plugin-redis
        $ sudo gem install redis
        $ sudo gem install json
        $ sudo /opt/td-agent/embedded/bin/fluent-gem install growthforecast

*   `supervisor`_ のインストール。
    ::

        $ sudo pip install supervisor --upgrade
        $ sudo pip install meld3==1.0.0

フロントエンド
^^^^^^^^^^^^^^^

*   `juggernaut`_ (フロントエンド)のインストール。
    ::

        $ git clone https://github.com/maccman/juggernaut.git
        $ cp -r juggernaut/lib/juggernaut /opt/local/projects/openflowlogger/webapp/lib/.
        $ cp juggernaut/public/application.js /opt/local/projects/openflowlogger/webapp/oflogviewer/static/scnv/.

*   `Backbone.js`_ のインストール。
    ::

        $ wget http://backbonejs.org/backbone-min.js
        $ cp backbone-min.js /opt/local/projects/openflowlogger/webapp/oflogviewer/static/js/.
        $ cp backbone-min.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/.

*   `jQuery.js`_ のインストール。
    ::

        $ wget http://code.jquery.com/jquery-1.7.2.min.js
        $ cp jquery-1.7.2.min.js /opt/local/projects/openflowlogger/webapp/oflogviewer/static/js/.
        $ cp jquery-1.7.2.min.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/jquery.js

*   `jQuery UI`_ のインストール。
    ::

        $ wget http://jqueryui.com/resources/download/jquery-ui-1.11.4.zip
        $ unzip jquery-ui-1.11.4.zip
        $ cp jquery-ui-1.11.4/jquery-ui.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/.

*   `Underscore.js`_ のインストール。
    ::

        $ wget http://underscorejs.org/underscore-min.js
        $ cp underscore-min.js /opt/local/projects/openflowlogger/webapp/oflogviewer/static/js/.
        $ cp underscore-min.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/.

*   `Raphael.js`_ のインストール。
    ::

        $ git clone https://github.com/DmitryBaranovskiy/raphael
        $ cp raphael/raphael-min.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/.

*   `three.js`_ のインストール。
    ::

        $ git clone https://github.com/mrdoob/three.js
        $ cp three.js/build/three.min.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/.
        $ mkdir /opt/local/projects/openflowlogger/static/scnv/js/vendor/three
        $ cp three.js/examples/js/controls/OrbitControls.js /opt/local/projects/openflowlogger/static/scnv/js/vendor/three/.



