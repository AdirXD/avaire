'use strict';
process.title = 'AvaIre';

var _ = require('lodash');
var Discordie = require('discordie');
var directory = require('require-directory');

global.app = require('./app');

app.logger.info(`Bootstraping AvaIre v${app.version}`);

app.logger.info(' - Loading configuration');
app.config = app.configLoader.loadConfiguration('config.json');

app.logger.info(' - Creating bot instance');
global.bot = new Discordie({
    autoReconnect: true
});

app.logger.info(` - Registering ${Object.keys(app.bot.handlers).length + 1} event handlers`);
_.each(app.bot.handlers, function (handler, key) {
    _.each(Discordie.Events, function (event) {
        if (key === event) {
            bot.Dispatcher.on(event, new handler);
        }
    });
});

let jobs = directory(module, './app/bot/jobs');
app.logger.info(` - Registering ${Object.keys(jobs).length - 1} jobs`);
_.each(jobs, function (job, key) {
    if (key !== 'Job') {
        app.scheduler.registerJob(new job);
    }
});

app.logger.info('Connecting to the Discord network...');
bot.connect({ token: app.config.bot.token });
