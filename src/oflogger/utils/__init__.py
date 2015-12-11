# coding: utf-8
import datetime

def get_time():
    get_time = datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S')

    return get_time
