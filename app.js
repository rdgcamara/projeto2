const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const hbs = require('hbs');
const { MongoClient } = require("mongodb");

const app = express();

// ===== CONFIGURAÇÕES DO BANCO =====
const url = "mongodb://localhost:27017"; 
const dbName = "projeto";       

async function connect() {
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db(dbName);
    return { db, client };
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(session({
    secret: 'segredo_super_secreto',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: url, dbName }),
    cookie: { maxAge: 1000 * 60 * 60 }
}));


function checkLogin(req, res, next) {
    if (req.session.usuario) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login', { erro: null });
});

app.post('/login', async (req, res) => {
    const { usuario, senha } = req.body;

    try {
        const { db } = await connect();
        const user = await db.collection('usuario').findOne({ usuario, senha });
        if (user) {
            req.session.usuario = user;
            res.redirect('/privada');
        } else {
            res.render('login', { erro: 'Usuário ou senha inválidos' });
        }
    } catch (err) {
        console.error(err);
        res.render('login', { erro: 'Erro ao tentar logar' });
    }
});

app.get('/privada', checkLogin, (req, res) => {
    res.render('privada', { usuario: req.session.usuario });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/', (req, res) => {
  res.redirect('/login');
});


app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
