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

// variable to store ixo users
var ixoUsers = require('./defaultUsers');

var checkName = function(name){
    return namePattern.test(name);
}

var isIxoUser = function(userId){
    return ixoUsers[userId]
}

var refreshIxoUsers = function(){
    ixoUsers = {};
    web.users.list(function(err, res){
        if(!err){
            res.members.forEach(function(user){
                if(checkName(user.profile.display_name)){
                    ixoUsers[user.id] = {
                        profileName: user.profile.display_name, 
                        realName: user.real_name};
                }
            })
        }
    });
}

var processPhishbert = function(message){
    if(message.text =="phishbert list"){
        console.log(ixoUsers);
        web.im.open(message.user, function(err, res) {
            var userList = "";
            Object.keys(ixoUsers).forEach(function(k){
                userList = userList + k + ": @" + ixoUsers[k].profileName + " (" + ixoUsers[k].realName + ")\n";
            });
            web.chat.postMessage(res.channel.id, userList, {
                as_user: true,
                parse: 'full'
            }, function(err, res) {
                if (err) {
                    console.log('Error:', err);
                } else {
                    console.log('Posted list');
                }
            });
        });
    
    }else if(message.text =="phishbert refresh"){
        refreshIxoUsers();
    }else if(message.text == "phishbert help"){
        web.im.open(message.user, function(err, res) {
            var msg = "help: Shows help\nlist: Lists all ixo users\nrefresh: Refreshes the list of all ixo users\nreset: Resets ixo user list\n";
            web.chat.postMessage(res.channel.id, msg, {
                as_user: true,
                parse: 'full'
            }, function(err, res) {
                if (err) {
                    console.log('Error:', err);
                } else {
                    console.log('Help sent');
                }
            });
        });
        
    }else if(message.text =="phishbert reset"){
        ixoUsers = JSON.parse(JSON.stringify(defaultUsers));
    }
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
    // Check if it is a phishbert control message
    if (message.type === 'message' && message.text.startsWith("phishbert ") && isIxoUser(message.user)){
        processPhishbert(message);
        console.log("Processing phishbert message: " + message.text);
    }else{

        // Check channel messages against phishing pattern
        if (message.type === 'message' && message.channel.charAt(0) == 'C' && pattern.test(message.text)) {
            postSecurityMessage(":warning: It looks like user ID:" + message.user + " tried to post an Ethereum address or Etherscan link that could be used for phishing/stealing funds!");

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
    }
});

// Intercept user change
rtm.on(RTM_EVENTS.USER_CHANGE, function handleRtmMessage(message) {
    console.log();
    console.log();
    if (message.type === 'user_change'){
        console.log();
        if(!isIxoUser(message.user.id) && (checkName(message.user.real_name) || checkName(message.user.profile.display_name)) ){
            var errMessage = ":warning: Illegal name change for @" + message.user.real_name + " (Display Name: '" + message.user.profile.display_name + "'";
            console.log(errMessage);
            postSecurityMessage(errMessage);
        }
    }
});