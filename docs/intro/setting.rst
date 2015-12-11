====================
SCN Adminの環境設定
====================

OSの設定
=========

ファイヤウォールの設定
-----------------------
SCN Adminが使用するポートを開放します。

::

    $ sudo vi /etc/sysconfig/iptables


以下を追加します。

::

    -A INPUT -m state --state NEW -m tcp -p tcp --dport 80 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 5125 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 6379 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 8000 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 8080 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 22001 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 22002 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 24224 -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 55555 -j ACCEPT



