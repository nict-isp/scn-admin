# -*- coding: utf-8 -*-
"""
oflogviewer.app
~~~~~~~~~~~~~~~
Webアプリケーションのローダ

:copyright: Copyright (c) 2015, National Institute of Information and Communications Technology.All rights reserved.
:license: GPL3, see LICENSE for more details.
"""
import os
import simplejson as json
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, request, render_template
from flask.ext.babel import Babel, gettext as _
from oflogviewer.configs.settings import Settings
from oflogviewer.models.meta import init_engine
from oflogviewer.models.meta import Session
from oflogviewer.views import views

__all__ = ['create_app']


def create_app(config=None, app_name=None, modules=None):
    """
    Create application.

    :param config: Configuration.
    :param app_name: Application name.
    :param modules: View modules.
    """
    if app_name is None:
        app_name = 'oflogviewer'

    if modules is None:
        modules = views

    app = Flask(app_name)

    configure_settings(app, config)
    configure_logging(app)
    configure_extensions(app)
    configure_modules(app, modules)
    configure_middlewares(app)

    @app.before_request
    def before_request():
        Session.remove()

    @app.after_request
    def after_request(response):
        Session.remove()
        return response

    return app


def configure_settings(app, config):
    """
    Configure application.

    :param app: Flask object.
    :param config: Configuration.
    """
    app.config.from_object(Settings())
    if config is not None:
        app.config.from_object(config)

    app.config.from_envvar('FLASK_APP_CONFIG', silent=True)
    root_path = os.path.dirname(app.root_path)
    data_dir = app.config['DATA_DIR'].replace('%(root)s', root_path)
    app.config.update({'DATA_DIR': data_dir})


def configure_logging(app):
    """
    Configure logger.

    Logger object set to utils.logging class.

    :param app: Flask object
    """
    formatter = logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s '
        '[in %(pathname)s:%(lineno)d]'
    )

    root_path = os.path.dirname(app.root_path)
    debug_log = os.path.join(root_path, app.config['DEBUG_LOG'])

    debug_file_handler = RotatingFileHandler(
        debug_log, maxBytes=100000, backupCount=100000
    )

    debug_file_handler.setLevel(app.config['LOG_LEVEL'])
    debug_file_handler.setFormatter(formatter)
    app.logger.addHandler(debug_file_handler)

    error_log = os.path.join(root_path, app.config['ERROR_LOG'])
    error_file_handler = RotatingFileHandler(
        error_log, maxBytes=100000, backupCount=10
    )

    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(formatter)
    app.logger.addHandler(error_file_handler)


def configure_modules(app, modules):
    """
    Configure modules.

    :param app: Flask object.
    :param modules: Module list.
    """
    for module in modules:
        app.register_blueprint(module)


def configure_extensions(app):
    """
    Configure Flask extensions.

    :param app: Flask object.
    """
    init_engine(app.config)


def configure_i18n(app):
    """
    Configure Babel settings.

    :param app: Flask object.
    """
    babel = Babel(app)

    @babel.localeselector
    def get_locale():
        return request.accept_languages.best_match(app.config.get('LANGS'))


def configure_middlewares(app):
    """
    Configure middlewares.

    Middlewares could set in settings.py.

    :param app: Flask object.
    """
    middlewares = app.config['MIDDLEWARES']
    if not isinstance(middlewares, tuple):
        middlewares = (middlewares,)
    for middleware in middlewares:
        target = middleware.split('.')
        module = '.'.join(target[0:-1])
        name = target[-1]
        klass = getattr(__import__(module, fromlist=[name]), name)
        app.wsgi_app = klass(app)


def configure_errorhandlers(app):
    """
    Error handler.

    Handling error pages.

    :param app: Flask object.
    """
    @app.errorhandler(403)
    def forbidden(error):
        if request.is_xhr:
            return json.dumps(dict(error=_('Sorry, not allowed.')))
        return render_template('errors/403.html', error=error)


    @app.errorhandler(404)
    def notfound(error):
        if request.is_xhr:
            return json.dumps(dict(error=_('Page not found.')))
        return render_template('errors/404.html', error=error)
