/*
 * gestion de todo list multi utilisateur
 */

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var ent = require('ent');
var bodyParser = require('body-parser');
var sharedsession = require("express-socket.io-session");
var ec2 = require("ec2-publicip");

/*
 * initialize public IP address for AWS EC2 instance
 */
var address = '';
ec2.getPublicIP(function (error, ip) {
    if (error) {
        console.log(error);
    }
    console.log("Instance Public IP: ", ip);
    address = ip;
});
//var address = require("ip").address();
//var address = 'localhost';

/*
 * initialize port number
 */
var port = 80;
//var port = 8080;

/*
 * Gestion de la liste dans une variable globale du serveur.
 * Chaque item de liste est associé à un identifiant.
 */
var todoListe = [];
var todoId = 0;
var conversation = [];

/*
 * configuration
 */
var session = require('express-session')({
    secret: 'top secret',
    resave: true,
    saveUninitialized: true
});

app.use(session);

app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {
    if (!req.session.pseudo) {
        req.session.pseudo = '';
    }
    next();
});

io.use(sharedsession(session, {
    autoSave: true
}));

/*
 * debug
 */

// Debugging express
app.use("*", function(req, res, next) {
  console.log("Express `req.session` data is %j.", req.session);
  next();
});

// Debugging io
io.use(function(socket, next) {
  console.log("socket.handshake session data is %j.", socket.handshake.session);
  next();
});

/*
 * login page request
 */
app.get('/login', function (req, res, next) {
    console.log("login");
    if (req.session.pseudo !== '') {
        /*
         * already logged in
         */
        res.redirect('/todo');
    } else {
        res.render('./login.ejs');
    }
});

/*
 * login page form submit
 */
app.post('/login', function (req, res, next) {
    console.log("post login");
    if (req.body) {
        if (req.body.pseudo) {
            /*
             * submit login
             */
            req.session.pseudo = req.body.pseudo;

            message = req.body.pseudo + ' a rejoint la conversation';
            conversation.push(message);
            console.log(message);

            res.redirect('/todo');
        } else {
            /*
             * incorrect login information
             */
            res.render('./login.ejs');
        }
    }
});

/*
 * logout request
 */
app.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/todo');
        }
    });
});

/*
 * renvoie la page de l'application
 */
app.get('/todo', function (req, res, next) {
    console.log("todo");
    if (req.session.pseudo !== '') {
        console.log("page todo");
        res.render('./todolist.ejs', {pseudo: req.session.pseudo, address: address, port: port});
    } else {
        res.redirect('/login');
    }
});

/*
 * redirection si url non trouvée
 */
app.use(function (req, res, next) {
    res.redirect('/todo');
});

/*
 * connexion d'un nouveau client
 */
io.on('connection', function (socket) {

    console.log("connection socket.io");

    socket.on('hello', function (userdate) {

        console.log('hello');
        pseudo = socket.handshake.session.pseudo;

        socket.emit('serveur_emet_conversation', conversation);
        socket.broadcast.emit('serveur_emet_conversation', conversation);
        socket.emit('serveur_emet_todo_list', todoListe);
    });

    socket.on('disconnect', function () {
        console.log('déconnexion de ' + socket.handshake.session.pseudo);
    });

    socket.on('message', function (msg) {

        if (typeof pseudo !== "string") {
            console.log('typeof pseudo : ' + typeof pseudo);
        }
        if (typeof msg.message !== "string") {
            console.log('typeof msg.message : ' + typeof msg.message);
        }

        pseudo = socket.handshake.session.pseudo;
        /*
         * encodage des entitées HTML pour ne pas injecter de HTML dans la page
         */
        message = '<span class="pseudo">' + ent.encode(pseudo) + '</span> ' + ent.encode(msg.message);
        console.log(pseudo + " : " + message);
        socket.broadcast.emit('message', message);
        socket.emit('message', message);
        conversation.push(message);
    });

    socket.on('client_ajoute_todo', function (msg) {
        if (typeof msg !== "string") {
            console.log('typeof msg : ' + typeof(msg));
        }
        console.log('ajout todo ' + todoId + ' : ' + msg);
        todoListe.push({todoId: todoId, todoState: 'todo', todoItem: ent.encode(msg)});
        todoId++;
        socket.broadcast.emit('serveur_emet_todo_list', todoListe);
        socket.emit('serveur_emet_todo_list', todoListe);
    });

    socket.on('client_supprime_todo', function (msg) {
        todoListe.forEach(function (e) {
            if (e.todoId === parseInt(msg)) {
                if (e.todoState === 'todo') {
                    e.todoState = 'done';
                } else {
                    e.todoState = 'todo';
                }
            }
        });
        socket.broadcast.emit('serveur_emet_todo_list', todoListe);
        socket.emit('serveur_emet_todo_list', todoListe);
        console.log("suppression todo " + msg);
    });
});

/*
 * démarrage du serveur
 */
server.listen(port, address, function () {
    console.log('le serveur écoute sur ' + address + ':' + port);
});
