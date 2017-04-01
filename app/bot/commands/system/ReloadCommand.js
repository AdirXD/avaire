/** @ignore */
const path = require('path');
/** @ignore */
const _ = require('lodash');
/** @ignore */
const Command = require('./../Command');
/** @ignore */
const CommandHandler = require('./../CommandHandler');

class ReloadCommand extends Command {
    constructor() {
        super('!', 'reload', ['rload'], {
            description: 'Reloads the given property',
            usage: '[property]',
            middleware: [
                'isBotAdmin'
            ]
        });

        this.reloadableProperties = [
            {
                requiredExtraArgs: false,
                triggers: ['lang', 'language'],
                function: this.reloadLanguage
            },
            {
                requiredExtraArgs: true,
                triggers: ['cmd', 'command'],
                function: this.reloadCommand
            }
        ];
    }

    onCommand(sender, message, args) {
        if (args.length === 0) {
            return app.envoyer.sendWarn(message, 'language.errors.missing-arguments', {
                command: this.getPrefix() + this.getTriggers()[0]
            });
        }

        if (args[0].toLowerCase() === 'all') {
            let promises = [];
            args = args.shift();

            for (let index in this.reloadableProperties) {
                let property = this.reloadableProperties[index];

                if (property.requiredExtraArgs) {
                    continue;
                }

                promises.push(property.function(message, args));
            }

            return promises;
        }

        let trigger = args[0].toLowerCase();
        args.shift();

        for (let index in this.reloadableProperties) {
            let property = this.reloadableProperties[index];

            if (_.indexOf(property.triggers, trigger) === -1) {
                continue;
            }

            return property.function(message, args);
        }

        return app.envoyer.sendWarn(message, 'Invalid `property` given, there are no reloadable properties called `:property`', {
            property: trigger
        });
    }

    reloadLanguage(message, args) {
        for (let index in require.cache) {
            if (!_.startsWith(index, app.lang.resourcePath)) {
                continue;
            }

            delete require.cache[index];
        }

        let backupLanguageFiles = app.lang.languageFiles;

        try {
            app.lang.loadLanguageFiles();

            return app.envoyer.sendSuccess(message, ':ok_hand: Language files has been reloaded!');
        } catch (err) {
            app.logger.error(err);
            app.lang.languageFiles = backupLanguageFiles;

            return app.envoyer.sendError(message, '**Error:** Failed to reload language files due to a ' + err.name + '\n\n' + err.message);
        }
    }

    reloadCommand(message, args) {
        if (args.length === 0) {
            return app.envoyer.sendWarn(message, ':warning: Missing argument `command`, a valid command is required.');
        }

        let command = CommandHandler.getCommand(args.join(' '));

        if (command === null) {
            return app.envoyer.sendWarn(message, ':warning: Invalid command argument given, `:command` is not a valid command', {
                command: args[0].toLowerCase()
            });
        }

        let commandFile = `./../${command.category}/${command.name}`;
        let commandPath = `${command.category}${path.sep}${command.name}.js`;

        delete app.bot.commands[command.name];
        for (let index in require.cache) {
            if (!_.endsWith(index, commandPath)) {
                continue;
            }

            delete require.cache[index];
        }

        let CommandInstance = require(commandFile);
        let instance = new CommandInstance;
        let commandTriggers = [];

        _.each(instance.getTriggers(), trigger => commandTriggers.push(_.toLower(trigger)));

        app.bot.commands[command.name] = {
            name: command.name,
            category: command.category,
            prefix: instance.getPrefix(),
            triggers: commandTriggers,
            handler: instance
        };

        return app.envoyer.sendSuccess(message, ':ok_hand: `:command` command has been reloaded!', {
            command: instance.getPrefix() + commandTriggers[0]
        });
    }
}

module.exports = ReloadCommand;