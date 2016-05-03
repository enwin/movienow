var Slack = require( 'slack-node' ),
    config = require( '../config' ),
    slack = new Slack();

slack.setWebhook( config.slackHook );

module.exports = slack;
