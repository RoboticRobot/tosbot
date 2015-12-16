// ___________     ___________________        __   
// \__    ___/___ /   _____/\______   \ _____/  |_ 
//   |    | /  _ \\_____  \  |    |  _//  _ \   __\
//   |    |(  <_> )        \ |    |   (  <_> )  |  
//   |____| \____/_______  / |______  /\____/|__|  
//                       \/         \/             
// http://blankmediagames.com/TownOfSalem/Login1_3_3.swf

'use strict';
var Game = require('./Game.js');
var Account = require('./Account.js');
var messages = require('./messages.js');

function doThatThing(account) {
    for (let i = 0; i < 100; ++i) {
        account.send(i, String.fromCharCode(1));
    }
}

String.prototype.paddingRight = function(length,pad) {return this+Array(length-this.length+1).join(pad||" ")};

var lastwill = game => {
    var report = game.report();
    var s = [];
    var villains = report.evils.slice(0, 6);
    var length = Math.max.apply(null, villains.map(villain => villain.name.length));
    s.push('#ID ' + 'Name'.paddingRight(length, ' ') + ' ~ Evil%');
    s.push(''.paddingRight(Math.min(26, s[0].length), '='));
    villains.forEach(villain => {
        s.push('#' + villain.id.toString().paddingRight(2, ' ') + ' ' + villain.name.paddingRight(length, ' ') + ' ~ ' + Math.round(villain.score * 1000) / 10 + '%');
    });
    var transcript = game.transcript.length > 0 ? 'Mafia: ' + game.transcript.join(', ') + '\n\n' : '';
    return game.self().name + ' - ' + game.fakerole + '\n\n' + s.join('\n') + '\n\n' + transcript + '(╯=▃=)╯︵┻━┻';
};
var deathnote = game => '¯\\_(ツ)_/¯';

Account.login(process.argv[2], process.argv[3]).then(account => {
    var play = process.argv[5] === 'ranked' ? () => account.send(60) : process.argv[5] === 'any' ? () => account.play(3) : () => {};
    var partyID = null;
    var game = null;
    account.on('ConnectionStatus', message => {
        var status = message.charCodeAt(0);
        if (status == 2) {
            console.log('Successfuly logged.');
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
    
    account.on('FriendMessage', message => {
        var tokens = message.split('*');
        if (parseInt(tokens[1]) === 0) {
            var origin = tokens[0];
            var text = tokens.slice(2).join('*');
            console.log('Message from ' + origin + ': ' + text);
        }
    });
    
    account.on('SomeoneHasWon', () => {
        account.remove('ChatBoxMessage');
        //account.chat('<font color="#ff0000">G</font><font color="#ff7f00">G</font><font color="#ffff00">!</font><font color="#00ff00"> </font><font color="#00ffff">=</font><font color="#0000ff">)</font>');
        //account.chat('Feel free to add me! I will automatically accept all invites.');
        account.chat('GG! =)')
        account.send(39);
    });
    account.on('EndGameInfo', () => {
        
    });
    account.on('ReturnToHomePage', () => play(account));
    account.on('AcceptRankedPopup', () => account.send(62));
    account.on('LeaveRankedQueue', () => account.send(60));
});

