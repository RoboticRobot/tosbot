// ___________     ___________________        __   
// \__    ___/___ /   _____/\______   \ _____/  |_ 
//   |    | /  _ \\_____  \  |    |  _//  _ \   __\
//   |    |(  <_> )        \ |    |   (  <_> )  |  
//   |____| \____/_______  / |______  /\____/|__|  
//                       \/         \/             
//
// This bot accepts all invites and play autmatically (lynch, day and night ability).
// You can use it to farm or play in ranked.
// Usage: npm start username password nickname ranked|any|nothing
// License: wtfpl.net
//
// Answer to commands (whispers or all chat):
// !stats, !villains, !doge, !resume, !info, !hide, !mayor, !self, !voteme, !ping, !help
// Hidden commands: !exit, !role

'use strict';

var Game = require('./Game.js');
var Account = require('./Account.js');
var messages = require('./messages.js');

function doThatThing(account) {
    for (let i = 0; i < 100; ++i) {
        account.send(i, String.fromCharCode(1));
    }
}


var lastwill = game => {
    return game.self().name + ' - ' + game.fakerole + '\n\n' +
    '(╯°□°）╯︵ ┻━┻';
};
var deathnote = game => '¯\_(ツ)_/¯';

Account.login(process.argv[2], process.argv[3]).then(account => {
    var play = process.argv[5] === 'ranked' ? () => account.send(60) : process.argv[5] === 'any' ? () => account.play(3) : () => {};
    var partyID = null;
    var game = null;
    account.on('ConnectionStatus', message => {
        var status = message.charCodeAt(0);
        if (status == 2) {
            console.log('Successfuly logged.');
            // Uncomment one of this lines, or not (ie you want to party)
            play(account);
            //doThatThing(account); // Glitch pet
        } else {
            throw 'Connection Failed (' + status + ').';
        }
    });
    
    account.on('FriendRequestNotifications', message => {
        var tokens = message.split(',');
        account.send(26, tokens[0] + '*' + tokens[1]);
    });
    account.on('PartyInviteNotification', message => {
        var tokens = message.split('\\*');
        partyID = tokens[0];
        account.send(33, String.fromCharCode(3) + tokens[1]);
    });
    account.on('AcceptedPartyInvite', message => {
        if (message.charCodeAt(0) === 4 && partyID !== null) {
            account.send(33, String.fromCharCode(2) + partyID);
            partyID = null;
        }
    });
    account.on('PickNames', () => {
        game = new Game(account, lastwill, deathnote);
        account.send(21, process.argv[4]);
        //account.chat('Hello fellow humans. Good luck and have fun! :)');
    });
    
    account.on('SomeoneHasWon', () => {
        account.remove('ChatBoxMessage');
        //account.chat('<font color="#ff0000">G</font><font color="#ff7f00">G</font><font color="#ffff00">!</font><font color="#00ff00"> </font><font color="#00ffff">=</font><font color="#0000ff">)</font>');
        //account.chat('Feel free to add me! I will automatically accept all invites.');
        account.chat('GG! =)')
    });
    account.on('ReturnToHomePage', () => play(account));
    account.on('AcceptRankedPopup', () => account.send(62));
    account.on('LeaveRankedQueue', () => account.send(60));
});

