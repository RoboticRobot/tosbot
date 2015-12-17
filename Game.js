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
        this.abilitiesLeft = 100;
        this.transcript = [];
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
        this.alreadyJailed = false;
        this.silent = false;
        this.w = 0;
        this.state = 'picking';
        this.players = {};
        var saidNotBot = false;
        this.account = account;
        var queue = [];
        var lastTarget = null;
        account.on('StartFirstDay', () => {
            this.day();
        });
        account.on('StartDay', this.day.bind(this));
        account.on('StartNight', () => {
            console.log(chalk.bgBlue(' Night '));
            if (this.abilitiesLeft === 0) return;
            this.state = 'night';
            var report = this.report();
            lastTarget = report.evils[0].name;
            var should_self = ['Arsonist', 'Veteran', 'Doctor', 'Bodyguard'].indexOf(this.self().role) !== -1;
            var target = null;
            if (should_self && Math.random() < 0.2) {
                target = this.self().id; 
            } else if (['Retributionist', 'Amnesiac'].indexOf(this.self().role) !== -1) {
                target = this.deads()[Math.floor(this.deads().length * Math.random())];
            } else if (['Bodyguard', 'Doctor', 'Lookout', 'Consort'].indexOf(this.self().role) !== -1) {
                target = report.evils[report.evils.length - 1].id;
            } else {
                target = report.evils[0].id;
            }
            setTimeout(() => {
                if (this.self().role !== 'Jailor' || this.w >= 2) {
                    account.send(11, String.fromCharCode(target));
                }
                account.send(19, String.fromCharCode(target) + String.fromCharCode(1)); // Mafia update (blankmedia logic)
                account.send(12, String.fromCharCode(report.evils[report.evils.length - 1])); // Night target 2
            }, Math.random() * 10000);
        });
        account.on('UserChosenName', message => this.players[message.charCodeAt(1) - 1] = new Player(message.charCodeAt(1), message.slice(2)));
        account.on('ChatBoxMessage', message => {
            var origin = message.charCodeAt(0);
            message = message.slice(1);
            if (messages.origins.hasOwnProperty(origin)) {
                console.log(chalk.bold(messages.origins[origin] + ': ') + message);
                if (messages.origins[origin] === 'Mafia') {
                    this.transcript.push(message);
                    //account.chat('Mafia: ' + message);
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
            this.players[message.charCodeAt(0) - 1].targeted -= 5;
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
        var reasonsVote = ['I just think this guy is evil', 'evil', 'trust me', ';-;', 'dont wanna burn :P', 'guilty', 'lynch this weirdo', 'His house is burning, bad sign', 'I\'m a hacker and I know this guy is evil', 'K let\'s random', 'random.org', 'Chosen by fair roll dice, guaranted to be evil', '-_-', ':O', 'tarnation maf', 'found the witchy', 'IT\'S HIM', 'Sooo why did you try to kill me ?', ' I am the Sheriff.  I found our Mafioso last night.  It\'s Player Nine!!', 'Hrm....  Need to find the SK....'];
        var currentVote = null;
        account.on('StartVoting', () => {
            console.log(chalk.bgBlue(' Voting '));
            currentVote = null;
            if (Math.random() < 0.66 && !this.self().dead) {
                var t = this.report().evils[Math.floor(Math.random() * Math.min(3, this.report().evils.length))];
                currentVote = t.id;
                setTimeout(() => {
                    account.send(10, String.fromCharCode(t.id));
                    if (Math.random() < 0.33) {
                        setTimeout(() => account.chat(reasonsVote[Math.floor(Math.random() * reasonsVote.length)]), Math.random() * 4000);
                    }
                }, Math.random() * 5000);
            }
        });
        var doVote = message => {
            var origin = this.players[message.charCodeAt(0) - 1];
            origin.votes[origin.votes.length - 1] = message.charCodeAt(1) - 1;
            this.players[message.charCodeAt(1) - 1].targeted++;
            this.report();
            if (this.players[message.charCodeAt(1) - 1].score > 0.5 && currentVote !== message.charCodeAt(1)) {
                setTimeout(() => account.send(10, message.charAt(1)), Math.random() * 3000);
                currentVote = message.charCodeAt(1);
            }
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
        account.on('HowManyAbilitiesLeft', message => {
            this.abilitiesLeft = message.charCodeAt(0) - 1;
        });
        var defenses = [() => {
            setTimeout(() => account.chat('Hello, blablabla, I\'m not evil'), 4000);
        }, () => {
            setTimeout(() => account.chat('I\'m ' + this.fakerole), 4000);
            setTimeout(() => account.chat(';-;'), 16000);
        }, () => {
            account.chat('Hum, I\'m ' + this.fakerole);
            setTimeout(() => account.chat('No will tho ^^\''), 5000);
            setTimeout(() => account.chat('(V●ᴥ●V)'), 15000);
        }, () => {
            setTimeout(() => account.chat(this.report().evils[0].name.toLowerCase() + ' is the one you want to hang'), 3000);
            setTimeout(() => account.chat('I\'m ' + this.fakerole + ' btw'), 7000);
            setTimeout(() => account.chat('Sorry, no will -_-'), 20000);
        }, () => {
            setTimeout(() => account.chat('Survivor. :)'), 3000);
            setTimeout(() => account.chat('I understand the reasons you want to kill me. I won\'t be mad'), 7000);
            setTimeout(() => account.chat('Still I\'m willing to help'), 12000);
            this.fakerole = 'Survivor';
        }, () => {
            setTimeout(() => account.chat('I know you wanna kill me'), 3000);
            setTimeout(() => account.chat('Sadly I forgot who am I :D'), 7000);
            setTimeout(() => account.chat('I will join ya soon guys :)'), 12000);
            this.fakerole = 'Amnesiac';
        }];
        var defend = () => defenses[Math.floor(Math.random() * defenses.length)]();
        account.on('BeingJailed', () => {
            if (!this.alreadyJailed) {
                defend();
                this.alreadyJailed = true;
            } else {
                setTimeout(() => account.chat(this.report().evils.slice(0, 3).map(p => p.name).join(', ')) + ' are suspicious', 5000);
            }
        });
        var onTrial = null;
        account.on('StartDefenseTransition', message => {
            onTrial = message.charCodeAt(0) - 1;
            console.log(chalk.bold(this.players[onTrial].toString() + ' was put on trial.'));
        });
        account.on('StartDefense', message => {
            console.log(chalk.bgBlue(' Defense '));
            if (this.players[onTrial].isme) {
                defend();
            } else {
                this.report();
                if (this.players[onTrial].score < 0.5) {
                    setTimeout(() => account.chat('inno'), Math.random() * 10000);
                }
            }
        });
        account.on('StartJudgement', message => {
            console.log(chalk.bgBlue(' Judgement '));
            if (!this.players[onTrial].isme) {
                this.report();
                setTimeout(() => account.send(this.players[onTrial].score > 0.5 ? 14 : 15), 5000);
            }
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
                    setTimeout(() => account.send(8, message.charAt(1) + ' ' + text), Math.random() * 3000);
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
        if (this.report().evils.length > 0) {
            this.account.send(16, String.fromCharCode(this.self().role === 'Mayor' ? this.self().id : this.report().evils[0].id));
        }
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