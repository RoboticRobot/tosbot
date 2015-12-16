var messages = require('./messages.js');
var chalk = require('chalk');

class Player {
    constructor(id, name) {
        this.id = id; // start at 1, not 0, fuck blank media games
        this.name = name;
        this.isme = false;
        this.dead = false;
        this.role = null; // a string
        this.lastwill = null;
        this.deathnote = null;
        // votes and judgements store targets' ID (Start at 0 not 1)
        this.votes = []; // Array of days, containing only the last target id the user voted on that day, or null
        this.judgements = []; // {target: id, what: 'guilty'|'innocent'|'abstain'}
        this.messages = []; // Doesn't get updated when dead, array of days
        this.whispers = []; // {target: id, what: message || undefined}
        this.targeted = 0; // Number of times plebs voted against player
    }
    log(message) {
        if (!this.dead) {
            this.messages[this.messages.length - 1].push(message);
        }
    }
    die(role, reasons) {
        this.dead = true;
        this.role = role;
        console.log(chalk.bold('(' + role + ') ' + this.name + ' died from [' + (reasons||['Lynch']).join(', ') + '].'));
    }
    stats() {
        var stats = {
            messages: this.messages.map(day => day.length).reduce((a, b) => a + b, 0),
            votes: this.votes.filter(vote => vote !== null).length,
            judgements: this.judgements.filter(judgement => judgement.what === 'guilty').length,
            whispers: this.whispers.length
        };
        stats.total = stats.messages + stats.votes + stats.judgements + stats.whispers - this.targeted;
        return stats;
    }
    total() {
        return this.stats().total;
    }
    toString() {
        return chalk.bold((this.role ? '(' + this.role + ') ' : '') + this.name);
    }
}

class Game {
    constructor(account, lastwill, deathnote) {
        this.transcript = [];
        this.forcetarget = null;
        this.lastwill = lastwill;
        this.deathnote = deathnote;
        this.fakerole = messages.roles[Math.floor(Math.random() * 12)];
        this.cmds = {
            '!stats': (f) => {
                var stats = this.array().map(player => player.stats()).reduce((a, b) => {
                    return {
                        messages: a.messages + b.messages,
                        votes: a.votes + b.votes,
                        judgements: a.judgements + b.judgements
                    };
                });
                f('Day: ' + this.w + ', Total messages: ' + stats.messages + ', Total votes: ' + stats.votes);
                f('Total judgements: ' + stats.judgements + ', Alive: ' + this.array().filter(player => !player.dead).length);
            },
            '!villains': (f) => {
                this.report().evils.slice(0, 3).forEach(villain => {
                    f('<font color="#FFFFFF">#' + villain.id + ' ' + villain.name + '</font> could be evil ~ <font color="#FF0000">' + Math.round(villain.score * 1000) / 10 + '%</font>');
                });
            },
            '!resume': (f, sender) => {
                this.resume(this.players[sender - 1], f);
            },
            '!doge': (f) => {
                f('<font color="#FF7F00">( ͡° ᴥ ͡°)</font>');
            },
            '!mayor': (f) => {
                f('<font color="#FF7F66">has revealed themself as the Mayor!</font>');
            },
            '!info': (f) => {
                f('Being a [robot] is [fun]! <b>c[○┬●]כ</b>');
            },
            '!hide': (f) => {
                f('<img src="https://pbs.twimg.com/profile_images/378800000822867536/3f5a00acf72df93528b6bb7cd0a4fd0c.jpeg"/>');
            },
            '!exit': () => {
                process.exit();
            },
            '!self': () => {
                account.send(8, String.fromCharCode(this.self().id) + ' Something.');
            },
            '!role': (f) => {
                f('I am ' + this.self().role + '.');
            },
            '!ping': (f) => {
                f('pong!');
            },
            '!voteme': (f, sender) => {
                account.send(10, String.fromCharCode(sender));
            },
            '!help': (f) => {
                f('Commands are !stats, !villains, !doge, !resume, !info, !hide, !mayor, !self, !voteme, !ping, !help.');
            }
        };
        this.silent = false;
        this.w = 0;
        this.state = 'picking';
        this.players = {};
        this.account = account;
        var queue = [];
        var lastTarget = null;
        account.on('StartFirstDay', () => {
            account.chat('Good luck everyone. =)')
            //this.cmds['!help']();
            this.day();
        });
        account.on('StartDay', this.day.bind(this));
        account.on('StartNight', () => {
            console.log(chalk.bgBlue(' Night '));
            this.state = 'night';
            var report = this.report();
            lastTarget = report.evils[0].name;
            var should_self = ['Arsonist', 'Veteran', 'Doctor', 'Bodyguard'].indexOf(this.self().role) !== -1;
            var target = null;
            if (this.forcetarget) {
                target = this.forcetarget;
                this.forcetarget = null;
            } else if (should_self && Math.random() < 0.2) {
                target = this.self().id; 
            } else if (this.self().role === 'Retributionist') {
                target = this.deads()[Math.floor(this.deads().length * Math.random())];
            } else if (['Bodyguard', 'Doctor', 'Lookout', 'Consort'].indexOf(this.self().role) !== -1) {
                target = report.evils[report.evils.length - 1].id;
            } else {
                target = report.evils[0].id;
            }
            account.send(11, String.fromCharCode(target));
            account.send(19, String.fromCharCode(target) + String.fromCharCode(1)); // Mafia update (blankmedia logic)
            account.send(12, String.fromCharCode(report.evils[report.evils.length - 1])); // Night target 2
            if (queue.length > 0) {
                account.chat('Hey, I targeted ' + lastTarget + ' and got:'); // Tell mafia, medium or jailor about stuff
                queue.forEach(message => account.chat(message));
                queue = [];
            }
        });
        account.on('UserChosenName', message => this.players[message.charCodeAt(1) - 1] = new Player(message.charCodeAt(1), message.slice(2)));
        account.on('ChatBoxMessage', message => {
            var origin = message.charCodeAt(0);
            message = message.slice(1);
            if (messages.origins.hasOwnProperty(origin)) {
                console.log(chalk.bold(messages.origins[origin] + ': ') + message);
                if (messages.origins[origin] === 'Mafia') {
                    this.transcript.push(message);
                    account.chat('Mafia: ' + message);
                }
            } else {
                if (this.players[origin - 1].dead) {
                    console.log(chalk.gray(this.players[origin - 1].toString() + ': ' + message));
                } else {
                    console.log(this.players[origin - 1].toString() + ': ' + message);
                }
                if (this.state === 'day' && !this.cmds.hasOwnProperty(message)) {
                    this.players[origin - 1].log(message);
                }
            }
            if (this.cmds.hasOwnProperty(message)) {
                this.cmds[message](account.chat.bind(account), origin);
            }
            if (message.match(/[0-9]{1,2}/)) {
                account.send(10, String.fromCharCode(parseInt(message)));
                this.forcetarget = parseInt(message);
            }
        });
        account.on('MayorRevealed', message => {
            //this.players[message.charCodeAt(0) - 1].role = 'Mayor';
            this.players[message.charCodeAt(0) - 1].targeted--;
        });
        account.on('StartNightTransition', () => {
            this.update();
        });
        account.on('NamesAndPositionsOfUsers', message => {
            this.players[message.charCodeAt(0) - 1] = new Player(message.charCodeAt(0), message.slice(1));
        });
        account.on('RoleAndPosition', message => {
            var role = message.charCodeAt(0) - 1;
            var name = messages.roles[role];
            if (role <= 12) {
                this.fakerole = name;
            }
            if (role === 26) {
                console.log('Target: ' + this.players[message.charCodeAt(2) - 1].name + '.');
            }
            this.players[message.charCodeAt(1) - 1].role = name;
            this.players[message.charCodeAt(1) - 1].isme = true;
            console.log(chalk.bold('You are ' + this.players[message.charCodeAt(1) - 1].toString() + '.'));
        });
        account.on('SpyNightAbilityMessage', message => {
            this.players[message.charCodeAt(0) - 1].targeted--;
        });
        account.on('WhoDiedAndHow', message => {
            var id = message.charCodeAt(0) - 1;
            var role = message.charCodeAt(1) - 1;
            var something = message.charCodeAt(2);
            var reasons = [];
            for (let i = 3; i < message.length; ++i) {
                reasons.push(messages.reasons[message.charCodeAt(i)]);
            }
            this.players[id].die(messages.roles[role], reasons);
            this.update();
        });
        account.on('StartVoting', () => {
            console.log(chalk.bgBlue(' Voting '));
            if (this.w > 2) {
                account.send(10, String.fromCharCode(this.report().evils[0].id));
            }
        });
        var doVote = message => {
            var origin = this.players[message.charCodeAt(0) - 1];
            origin.votes[origin.votes.length - 1] = message.charCodeAt(1) - 1;
            this.players[message.charCodeAt(1) - 1].targeted++;
        };
        account.on('UserVoted', doVote);
        account.on('UserChangedVoted', doVote);
        account.on('UserCanceledVoted', message => {
            var origin = this.players[message.charCodeAt(0) - 1];
            origin.votes[origin.votes.length - 1] = null;
        });
        account.on('Resurrection', message => {
            this.players[message.charCodeAt(0) - 1].dead = false;
        });
        account.on('BeingJailed', () => {
            account.chat('Hello jailor. Nice to meet you. =)');
            account.chat('I am actually ' + this.fakerole + '. Doin my best.');
        });
        var onTrial = null;
        account.on('StartDefenseTransition', message => {
            onTrial = message.charCodeAt(0) - 1;
            console.log(chalk.bold(this.players[onTrial].toString() + ' was put on trial.'));
        });
        account.on('StartDefense', message => {
            console.log(chalk.bgBlue(' Defense '));
            if (this.players[onTrial].isme) {
                account.chat('Well, I\'m ' + this.fakerole + '. Up to you now.')
            }
        });
        account.on('StartJudgement', message => {
            console.log(chalk.bgBlue(' Judgement '));
            //this.resume(this.players[onTrial], account.chat);
            account.send(this.players[onTrial].isme ? 15 : 14); // Voting guilty for everyone, except self
        });
        account.on('TellJudgementVotes', message => {
            var origin = this.players[message.charCodeAt(0) - 1];
            var what = messages.judgements[message.charCodeAt(1) - 1];
            origin.judgements.push({target: onTrial, what});
        });
        account.on('OtherMafia', message => {
            for (var i = 0; i + 1 < message.length; i += 2) {
                this.players[message.charCodeAt(i) - 1].role = messages.roles[message.charCodeAt(i + 1) - 1];
            }
        });
        account.on('OtherVampires', message => {
            for (let i = 0; i < message.length - 1; i+=2) {
                this.players[message.charCodeAt(i) - 1].role = 'Vampire';
            }
        });
        account.on('StringTableMessage', message => {
            var id = message.charCodeAt(0) - 1;
            queue.push(messages.tables[id]);
            console.log(chalk.inverse(messages.tables[id]));
        });
        account.on('NotifyUsersOfPrivateMessage', message => {
            this.players[message.charCodeAt(0) - 1].whispers.push({target: message.charCodeAt(1) - 1})
        });
        account.on('PrivateMessage', message => {
            var type = message.charCodeAt(0) - 1;
            if (type === 0) {
                console.log(chalk.magenta('To ' + this.players[message.charCodeAt(1) - 1].name + ': ') + message.slice(3));
                this.self().whispers.push({target: message.charCodeAt(1) - 1, what: message.slice(3)});
            } else if (type === 1) {
                console.log(chalk.magenta('From ' + this.players[message.charCodeAt(1) - 1].name + ': ') + message.slice(3));
                let text = message.slice(3);
                this.players[message.charCodeAt(1) - 1].whispers.push({target: this.self().id - 1, what: text});
                if (this.cmds.hasOwnProperty(text)) {
                    this.cmds[text](s => {
                        account.send(8, message.charAt(1) + ' ' + s);
                    }, message.charCodeAt(1));
                }
            } else {
                let text = message.slice(4);
                console.log(chalk.magenta('From ' + this.players[message.charCodeAt(1) - 1].name + ' to ' + this.players[message.charCodeAt(2) - 1].name + ': ') + text);
                this.players[message.charCodeAt(1) - 1].whispers.push({target: message.charCodeAt(2) - 1, what: text});
                if (text.match(/spy/i) && text.match(/test/i) && !this.players[message.charCodeAt(1) - 1].isme) {
                    account.send(8, message.charAt(1) + ' ' + text);
                }
            }
        });
    }
    self() {
        return this.array().filter(player => player.isme)[0];
    }
    resume(player, f) {
        var stats = player.stats();
        f('<u><b>Stats for #' + player.id + ' ' + player.name + '</b></u>');
        f('Messages: ' + stats.messages + ', Votes: ' + stats.votes + ', Judgements: ' + stats.judgements + ', Whispers: ' + stats.whispers + ', Targeted: ' + player.targeted);
    }
    find(name) {
        return this.array().find(player => player.name === name);
    }
    array() {
        var players = [];
        for (let i in this.players) {
            players.push(this.players[i]);
        }
        return players;
    }
    deads() {
        return this.array().filter(player => player.dead);
    }
    report() {
        var players = this.array().filter(player => !player.dead).filter(player => player.role === null);
        var total = players.map(player => player.total()).reduce((a, b) => a + b, 0);
        if (players.length === 0) {
            return {total: 0, evils: [], min:0, max:1, avg: 1/2};
        }
        var evils = players.sort((a, b) => a.total() - b.total());
        var min = evils[0].total();
        var max = evils[evils.length - 1].total();
        evils.forEach(player => {
            if (max - min !== 0) {
                player.score =  1 - (player.total() - min) / (max - min);
            } else {
                player.score = 0;
            }
        });
        var avg = total / evils.length;
        return {total, evils, min, max, avg};
    }
    update() {
        this.account.send(17, this.lastwill(this));
        this.account.send(18, this.deathnote(this));
        this.account.send(16, String.fromCharCode(this.self().role === 'Mayor' ? this.self().id : this.report().evils[0].id));
    }
    day() {
        console.log(chalk.bgBlue(' Day '));
        this.update();
        this.w += 1;
        this.state = 'day';
        this.array().filter(player => !player.dead).forEach(player => {
            player.messages.push([]);
            player.votes.push(null);
        });
    }
}

module.exports = Game;