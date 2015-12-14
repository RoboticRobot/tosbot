var querystring = require('querystring');
var rp = require('request-promise');
var net = require('net');
var messages = require('./messages.js');

var server = {
    address: '104.130.244.249',
    port: 3600
};

class Account {
    constructor(username, hash) {
        this.socket = new net.Socket();
        this.socket.connect(server.port, server.address, () => this.send(2, String.fromCharCode(2) + username + '*' + hash));
        this.socket.on('data', data => {
            var start = 0;
            for (let i = 0; i < data.length; ++i) {
                if (data[i] === 0) {
                    this.handle(data[start], data.toString('UTF-8', start + 1, i));
                    start = i + 1;
                }
            }
        });
        this.socket.on('close', () => console.log('Closed.'));
        this.handlers = new Map();
        this.buffer = [];
    }
    handle(id, message) {
        var name = messages.fromID[id] || id;
        if (this.handlers.has(name)) {
            this.handlers.get(name)(message);
        } else {
            console.log('[' + name + ': ' + message.replace(/[^ -~]+/g, '') + ']');
        }
    }
    chat(message) {
        this.send(3, message);
    }
    on(name, f) {
        this.handlers.set(name, f);
    }
    remove(name) {
        this.handlers.delete(name);
    }
    send(id, message) {
        this.socket.write(String.fromCharCode(id) + (message || '') + String.fromCharCode(0));
    }
    play(what) {
        this.send(30, String.fromCharCode(what));
    }
    static login(username, password) {
        return new Promise(then => {
            rp({
                method: 'POST',
                url:'http://www.blankmediagames.com/phpbb/processinfo2.php',
                form: {username, password}
            }).then((body) => {
                then(new Account(username, querystring.parse(body).password));
            });
        });
    }
}

module.exports = Account;