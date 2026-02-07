const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
app.use(express.urlencoded({ extended: true }));

// DATABASE
const db = new sqlite3.Database("afroboost.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT,
    password TEXT,
    role TEXT,
    balance INTEGER DEFAULT 0,
    agreed INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    pack INTEGER,
    status TEXT
  )`);
});

// HOME
app.get("/", (req, res) => {
  res.send(`
    <h1>Afro Boost</h1>
    <a href="/register-client">Client</a><br>
    <a href="/register-freelance">Freelance</a>
  `);
});

// REGISTER CLIENT
app.get("/register-client", (req, res) => {
  res.send(`
    <h2>Inscription Client</h2>
    <form method="POST">
      Email <input name="email"/><br>
      Password <input name="password"/><br>
      <button>Créer compte</button>
    </form>
  `);
});

app.post("/register-client", (req, res) => {
  db.run("INSERT INTO users(email,password,role) VALUES(?,?,?)",
    [req.body.email, req.body.password, "client"]);
  res.redirect("/");
});

// REGISTER FREELANCE
app.get("/register-freelance", (req, res) => {
  res.send(`
    <h2>Inscription Freelance</h2>
    <form method="POST">
      Email <input name="email"/><br>
      Password <input name="password"/><br>
      <label>
        <input type="checkbox" name="agree" required />
        J'autorise l'utilisation de mon profil pour des actions personnalisées
      </label><br>
      <button>Créer compte</button>
    </form>
  `);
});

app.post("/register-freelance", (req, res) => {
  db.run(
    "INSERT INTO users(email,password,role,agreed) VALUES(?,?,?,1)",
    [req.body.email, req.body.password, "freelance"]
  );
  res.redirect("/");
});

// COMMAND PACK
app.get("/order", (req, res) => {
  res.send(`
    <h2>Commander un pack</h2>
    <form method="POST">
      ID Client <input name="user"/><br>
      Pack actions <input name="pack"/><br>
      <button>Commander</button>
    </form>
  `);
});

app.post("/order", (req, res) => {
  db.run(
    "INSERT INTO orders(user_id,pack,status) VALUES(?,?,?)",
    [req.body.user, req.body.pack, "en cours"]
  );
  res.send("Commande créée");
});

// START SERVER
app.listen(3000, () => {
  console.log("Afro Boost lancé sur http://localhost:3000");
  const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log("Afro Boost lancé sur le port "+PORT));
