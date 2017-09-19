require("dotenv").config();
var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var WebClient = require('@slack/client').WebClient;

// Grab TOKEN value from .env file
var token = process.env.TOKEN || '';

// Moderated message pattern as regex from PATTERN in .env
var pattern = new RegExp(process.env.PATTERN, 'gi');

// Security alert channel name from SECURITY_CHANNEL in .env
var securityChannelName = process.env.SECURITY_CHANNEL || '';

// Name check from NAME_CHECK_PATTERN as regEx in .env
var namePattern = new RegExp(process.env.NAME_CHECK_PATTERN);

// RTM client
var rtm = new RtmClient(token, {});

// Web client
var web = new WebClient(token);

var checkName = function(name){
    return namePattern.test(name);
}

var postSecurityMessage = function(message){
    web.groups.list(function(err, res){
        if(!err){
            var groupId = '';
            res.groups.find(function(el){
                if(el.name == securityChannelName){
                    console.log('Post message to ' + el.id);
                    web.chat.postMessage(el.id, message, {
                        as_user: true,
                        parse: 'full'
                    }, function(err, res) {
                        if (err) {
                            console.log('Error:', err);
                        }
                    });
                }
            });
        }
    });
}

// Start real-time messaging client
rtm.start();

// Log when connected
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function handleRTMAuthenticated() {
    console.log('RTM client authenticated - phishbert is operational!');
});

// Intercept and parse every message
rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {

    // Check channel messages against phishing pattern
    if (message.type === 'message' && message.channel.charAt(0) == 'C' && pattern.test(message.text)) {

        // Delete message
        web.chat.delete(message.ts, message.channel, {
            as_user: true
        }, function(err, res) {
            if (err) {
                console.log('Error:', err);
            } else {
                console.log('Message deleted: ', message);
            }
        });

        // Warn the user (if flag is true in .env, then message from WARNING value in .env file is used)
        if (process.env.WARN_USER == 'true') {
            web.im.open(message.user, function(err, res) {
                web.chat.postMessage(res.channel.id, process.env.WARNING, {
                    as_user: true,
                    parse: 'full'
                }, function(err, res) {
                    if (err) {
                        console.log('Error:', err);
                    } else {
                        console.log('Used warned!');
                    }
                });
            });
        }
    }
});

// Intercept user change
rtm.on(RTM_EVENTS.USER_CHANGE, function handleRtmMessage(message) {
    console.log();
    console.log();
    if (message.type === 'user_change'){
        console.log();
        if(checkName(message.user.real_name) || checkName(message.user.profile.display_name) || checkName(message.user.real_name) ){
            var errMessage = "Illegal name change for @" + message.user.real_name + " (Display Name: '" + message.user.profile.display_name + "'";
            console.log(errMessage);
            postSecurityMessage(errMessage);
        }
    }
});