# phishbert

A Slack bot that monitors and automatically removes messages that match a set of given regex patterns (Ethereum addresses and Etherscan.io links by default, but you can extend this easily yourself). Set this up in your cryptocurrency or ICO Slack instance to automatically moderate potential phishing or scamming attempts. 

![What the default configuration looks like](example.png?raw=true "Example")
*An example of what the default configuration looks like*

**Requirements:** It is recommend that you are running NodeJS 8+ and NPM 5+

## Deploying via Heroku

You can quickly deploy phishbert using Heroku and keep it running by upgrading to their $7/mo "Hobby" plan following deployment. **Do not try to run the bot on the Free Dyno plan, it will sleep after 30 minutes and stop working.**

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/ummjackson/phishbert)

## Deploying manually to your own server

### Install

First clone the repo: `git clone https://github.com/ummjackson/phishbert.git`

Then install dependencies: `npm install`

### Setup

1. Create a "phishbert" user on your Slack team and give the user admin permissions. This needs to be a regular Slack account associated with an email address, it can **not** be a bot account (they don't have delete permissions)

2. While logged-in with this user account, visit https://api.slack.com/custom-integrations/legacy-tokens and generate a token for your account/Slack instance and copy it to your clipboard

3. Duplicate the `env.example` file in the repo and paste in the API token you just generated as the TOKEN= value. Rename your edited `env.example` file to `.env`

4. (Optional) Customize the concatenated regular expressions using `PATTERN` and, whether you want to warn users using `WARN_USER` and the warning message string using `WARNING` in the `.env` file

**Important:** For phishbert to read and delete messages, *it must be added to the channels you wish to moderate*. Make sure to add your new phishbert user to all the channels you want it to monitor.

A default profile photo for phishbert is [included in the repo](phishbert.png) if you'd like to use it. Feel free to name/brand your moderator bot whatever you'd like though 👍

###  Running

Fire up phishbert using: `node index.js`

In a production environment, you will likely want to daemonize this process using something like PM2 or Forever to keep it running in the background.

To do so, simply install Forever globally with `npm install forever -g` and then daemonize the script using `forever start index.js` from the repo directory. This will keep phishbert alive even if an error occurs. You can monitor your Forever process using `forever list`

## Contributing

There are plenty of optimizations and features that would be great, some ideas for new contributions:

- Improved regex patterns to cover more potential phishing vectors
- Logging and auto-banning of repeat offenders
- Tracking tools for team admins
- GUI for enabling/disabling regex rules simply

If you want to contribute, pull requests are appreciated!! 😃