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
var dong = require('./dong.js');
var chance = new require('chance')(Math.random);
chance.pick = function(a) {
    return a[Math.floor(Math.random() * a.length)]
};

var dd = console.log;
var p = null;
console.log = (o) => {
    if (o !== p) {
        dd(o);
        p = o;
    }
}

function doThatThing(account) {
    for (let i = 0; i < 100; ++i) {
        account.send(i, String.fromCharCode(1));
    }
}

String.prototype.paddingRight = function(length,pad) {return this+Array(length-this.length+1).join(pad||" ")};

/*var lastwill = game => {
    var report = game.report();
    var s = [];
    var villains = report.evils.slice(0, 6);
    if (villains.length === 0) {
        return '';
    }
    var length = Math.max.apply(null, villains.map(villain => villain.name.length));
    s.push('#ID ' + 'Name'.paddingRight(length, ' ') + ' ~ Evil%');
    s.push(''.paddingRight(Math.min(26, s[0].length), '='));
    villains.forEach(villain => {
        s.push('#' + villain.id.toString().paddingRight(2, ' ') + ' ' + villain.name.paddingRight(length, ' ') + ' ~ ' + Math.round(villain.score * 1000) / 10 + '%');
    });
    var transcript = game.transcript.length > 0 ? 'Mafia: ' + game.transcript.join(', ') + '\n\n' : '';
    return game.self().name + ' - ' + game.fakerole + '\n\n' + s.join('\n') + '\n\n' + transcript + '\nGithub: blupbluplol/tosbot\n\n        (╯=▃=)╯︵┻━┻';
};*/
var lastwills = [game => {
    var hints = game.report().evils.slice(0, Math.min(game.w, Math.ceil(Math.random() * 4))).map(p => p.name.toLowerCase());
    return game.self().name + ' - ' + game.fakerole + '\n' + hints.join(', ') + ' ' + (hints.length > 1 ? 'are' : 'is') + ' suspicious\n\n' + dong.dankest();
}, game => '', game => game.quote(), game => {
    var report = game.report();
    return game.self().name + '(' + game.fakerole.toLowerCase() + ')\n' + (report.evils.length > 0 ? report.evils[0].name : 'someone') + ' killed me :(';
}, game => {
    var report = game.report();
    return  game.self().name + ' ~ ' + game.fakerole + '\n' + (report.evils.length > 0 ? report.evils[report.evils.length - 1].name.toLowerCase() : 'someone') + ' is maf';
}, game => dong.bag(30), game => dong.dankest(), game => {
    var report = game.report();
    return 'It was ' + (report.evils.length > 0 ? report.evils[0].name : 'someone');
}, game => dong.dankest(), game => {
    var report = game.report();
    var s = [];
    for (let i = 0; i < game.w && i < report.evils.length; ++i) {
        s.push((i + 1) + ') ' + report.evils[i].name.toLowerCase());
    }
    return game.self().name + ' the ' + game.self().role + '\n' + s.join('\n');
}];
var deathnotes = [game => dong.dankest(), game => dong.bag(30), game => game.quote(), game => {
    var report = game.report();
    return report.evils.length > 0 ? report.evils[report.evils.length - 1].name + ', you are next.' : '';
}];
var lastwill = chance.pick(lastwills);
var deathnote = chance.pick(deathnotes);
var randname = () => chance.bool({likehood: 20}) ? '' : chance.bool({likehood: 50}) ? chance.last(): (chance.bool({likehood: 50}) ? chance.capitalize(chance.word()) : chance.word());

Account.login(process.argv[2], process.argv[3]).then(account => {
    var play = process.argv[4] === 'ranked' ? () => account.send(60) : process.argv[4] === 'any' ? () => account.play(3) : () => {};
    var partyID = null;
    var game = null;
    account.on('ConnectionStatus', message => {
        var status = message.charCodeAt(0);
        if (status == 2) {
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
        setTimeout(() => account.send(21, process.argv[5] || randname()), chance.integer({min: 2000, max: 10000}));
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
        if (Math.random() < 0.5) setTimeout(() => account.chat('gg'), chance.integer({min: 2000, max: 10000}));
        setTimeout(() => account.send(39), 10000);
    });
    account.on('EndGameInfo', () => {
        setTimeout(() => play(account), 10000);
    });
    account.on('ReturnToHomePage', () => play(account));
    account.on('LeaveRankedQueue', () => play(account));
    account.on('AcceptRankedPopup', () => account.send(62));
});