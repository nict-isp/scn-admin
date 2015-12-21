================
SCN Adminの起動
================

Growthforecastの起動
---------------------

下記のコマンドを実行します。

::

    $ su growthforecast
    $ /home/growthforecast/GrowthForecast/growthforecast.pl --port=5125 --data-dir=/home/growthforecast/data > /home/growthforecast/log/growthforecast.log 2> /home/growthforecast/log/growthforecast.err &
    $ exit


スクリプトによる各ツールの起動
-------------------------------

下記のコマンドを実行します。

::

    $ cd /opt/local/projects/openflowlogger/scripts/
    $ start.sh


================
SCN Adminの停止
================

スクリプトによる各ツールの停止
-------------------------------

下記のコマンドを実行します。

::

    $ cd /opt/local/projects/openflowlogger/scripts/
    $ stop.sh


Growthforecastの停止
---------------------

下記のコマンドを実行します。

::

    $ su growthforecast
    $ pkill -KILL -f /home/growthforecast/GrowthForecast/growthforecast.pl
    $ exit

