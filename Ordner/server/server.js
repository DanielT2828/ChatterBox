const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');



// MongoDB-Verbindung herstellen (Aktualisierter Verbindungsstring)
mongoose.connect('mongodb://root:rootpw@mongo:27017/chatterboxDB?authSource=admin')
.then(() => console.log('MongoDB verbunden'))
.catch(err => console.error('MongoDB Verbindungsfehler:', err));


// Definieren eines Schemas für Bilder
const imageSchema = new mongoose.Schema({
    filename: String,
    path: String,
    contentType: String,
    senderId: String,
    senderUsername: String,  // Hinzufügen des Benutzernamen-Feldes
    receiverId: String,
    createdAt: { type: Date, default: Date.now }
});

  
// Erstellen eines Modells basierend auf dem Schema
const Image = mongoose.model('Image', imageSchema);

const app = express();
const saltRounds = 10;

// Stelle sicher, dass der uploads Ordner existiert
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Upload Datei Express damit diese in dynamisch ist
app.use('/uploads', express.static('uploads'));


let redisClient = redis.createClient({
    host: process.env.REDIS_HOST || '0.0.0.0',
    port: 6379
  });

// Konfiguration der Session
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'geheimnis',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Setzen Sie secure auf true in Produktionsumgebungen mit HTTPS.
  }));

// Middleware für das Parsen von Body-Daten
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Datenbankverbindung für MySQL
const connection = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOSTNAME,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

// Konfiguration von multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // Speicherort der hochgeladenen Dateien
    },
    filename: function(req, file, cb) {
        // Generieren eines einzigartigen Dateinamens
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Route zum Hochladen der Datei
app.post('/upload', upload.single('datei'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Keine Datei hochgeladen.');
    }

    // Annahme, dass senderId und senderUsername sicher aus der Session oder einer anderen vertrauenswürdigen Quelle abgerufen werden
    const { senderId, receiverId } = req.body;
    const senderUsername = req.session.username;  // Beispiel, wie der Benutzername aus der Session abgerufen werden könnte

    const newImage = new Image({
        filename: req.file.filename,
        path: req.file.path,
        contentType: req.file.mimetype,
        senderId: senderId,
        senderUsername: senderUsername,  // Speichern des Benutzernamens im Bild-Dokument
        receiverId: receiverId,
        createdAt: new Date()
    });

    try {
        await newImage.save();
        res.send('Datei erfolgreich hochgeladen.');
    } catch (error) {
        console.error('Fehler beim Speichern des Bildes:', error);
        res.status(500).send('Fehler beim Speichern des Bildes.');
    }
});


// Route, um die aktuelle Benutzer-ID zu erhalten
app.get('/api/get-current-user-id', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ userId: req.session.userId });
    } else {
        res.status(401).json({ error: 'Nicht authentifiziert' });
    }
});






// Für /get-user-name
app.get('/get-user-name', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).send('Benötigte Parameter fehlen');
    }

    const query = 'SELECT username FROM users WHERE user_id = ?';

    try {
        const [rows] = await pool.query(query, [userId]);
        if (rows.length > 0) {
            res.json({ username: rows[0].username });
        } else {
            res.status(404).send('Benutzer nicht gefunden');
        }
    } catch (error) {
        console.error('Fehler beim Abrufen des Benutzernamens:', error);
        res.status(500).send('Serverfehler');
    }
});




// Nachrichten senden
app.post('/send-message', async (req, res) => {
    const { userId, message } = req.body;
    const senderId = req.session.userId;

    if (!senderId) {
        return res.status(403).json({ message: 'Nicht authentifiziert.' });
    }

    try {
        // Einfügen der Nachricht ohne sender_username
        await connection.query('INSERT INTO messages (sender_id, receiver_id, text, timestamp) VALUES (?, ?, ?, NOW())', [senderId, userId, message]);
        res.json({ success: true, message: 'Nachricht gesendet.' });
    } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error);
        res.status(500).send('Serverfehler');
    }
});



// Für /load-messages
app.get('/load-messages', (req, res) => {
    const { userId } = req.query; // ID des Empfängers
    const currentUserId = req.session.userId; // ID des aktuellen Benutzers (Sender)

    if (!currentUserId) {
        return res.status(403).json({ message: 'Nicht authentifiziert.' });
    }

    // Anpassen der Abfrage, um den Benutzernamen des Senders zu erhalten
    const query = `
        SELECT m.*, u.username AS sender_username 
        FROM messages m
        JOIN users u ON m.sender_id = u.user_id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.timestamp ASC
    `;

    connection.query(query, [currentUserId, userId, userId, currentUserId], (error, messages) => {
        if (error) {
            console.error('Fehler beim Laden der Nachrichten:', error);
            return res.status(500).json({ message: 'Serverfehler' });
        }
        res.json(messages);
    });
});


// Login-Endpunkt mit bcryptjs für das Passwort-Hashing und multer für das Parsen der Formulardaten
app.post('/login', upload.none(), async (req, res) => {
    const { username, password } = req.body;

    // Überprüfen, ob Benutzername und Passwort vorhanden sind
    if (!username || !password) {
        return res.status(400).json({ message: 'Benutzername und Passwort sind erforderlich.' });
    }

    // Benutzer anhand des Benutzernamens suchen
    const userQuery = 'SELECT * FROM users WHERE username = ?';
    connection.query(userQuery, [username], async (error, results) => {
        if (error) {
            console.error("Fehler bei der Benutzersuche: ", error);
            return res.status(500).json({ message: 'Ein interner Fehler ist aufgetreten.' });
        }
        if (results.length > 0) {
            // Überprüfen, ob das Passwort übereinstimmt
            const match = await bcrypt.compare(password, results[0].password);
            if (match) {
                // Passwort stimmt überein, Benutzer erfolgreich eingeloggt
                req.session.userId = results[0].user_id;
                req.session.username = username; // Benutzername in der Session speichern
                res.json({ message: 'Login erfolgreich', redirect: '/erfolg.html' });
            } else {
                // Passwort stimmt nicht überein
                res.status(401).json({ message: 'Login fehlgeschlagen: Benutzername oder Passwort falsch.' });
            }
        } else {
            // Kein Benutzer gefunden
            res.status(401).json({ message: 'Login fehlgeschlagen: Benutzername oder Passwort falsch.' });
        }
    });
});


// Registrierungsendpunkt mit Überprüfung auf vorhandene Benutzernamen
app.post('/registrieren', upload.none(), async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Benutzername und Passwort sind erforderlich.' });
    }

    const userExistsQuery = 'SELECT * FROM users WHERE username = ?';
    connection.query(userExistsQuery, [username], async (error, results) => {
        if (error) {
            console.error("Fehler bei der Überprüfung des Benutzernamens: ", error);
            return res.status(500).json({ message: 'Ein interner Fehler ist aufgetreten.' });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: 'Der Benutzername ist bereits vergeben.' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const insertQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
            connection.query(insertQuery, [username, hashedPassword], (error, results) => {
                if (error) {
                    console.error("Fehler bei der Registrierung: ", error);
                    return res.status(500).json({ message: 'Ein interner Fehler ist aufgetreten.' });
                }
                res.json({ message: 'Registrierung erfolgreich', redirect: '/login.html' });
            });
        } catch (error) {
            console.error("Fehler beim Hashen des Passworts: ", error);
            return res.status(500).json({ message: 'Ein interner Fehler ist aufgetreten.' });
        }
    });
});

//Username kriegen
app.get('/get-username', (req, res) => {
    if (req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'Nicht authentifiziert' });
    }
});


// Another GET Path - call it with: http://localhost:8080/special_path
app.get('/special_path', (req, res) => {
    res.send('This is another path');
});

// Another GET Path that shows the actual Request (req) Headers - call it with: http://localhost:8080/request_info
app.get('/request_info', (req, res) => {
    console.log("Request content:", req)
    res.send('This is all I got from the request:' + JSON.stringify(req.headers));
});

// POST Path - call it with: POST http://localhost:8080/client_post
app.post('/client_post', (req, res) => {
    if (typeof req.body !== "undefined" && typeof req.body.post_content !== "undefined") {
        var post_content = req.body.post_content;
        console.log("Client send 'post_content' with content:", post_content)
        // Set HTTP Status -> 200 is okay -> and send message
        res.status(200).json({ message: 'I got your message: ' + post_content });
    }
    else {
        // There is no body and post_contend
        console.error("Client send no 'post_content'")
        // Set HTTP Status -> 400 is client error -> and send message
        res.status(400).json({ message: 'This function requries a body with "post_content"' });
    }
});

// ###################### BUTTON EXAMPLE ######################



app.get('/api/get-images-for-chat', async (req, res) => {
    const { senderId, receiverId } = req.query;

    try {
        const images = await Image.find({
            $or: [
                { senderId: senderId, receiverId: receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }).sort({ createdAt: -1 }); // Neueste Bilder zuerst

        res.json(images);
    } catch (error) {
        console.error('Fehler beim Abrufen der Bilder:', error);
        res.status(500).send('Serverfehler beim Abrufen der Bilder.');
    }
});






// Logout-Endpunkt
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Fehler beim Beenden der Session: ", err);
            return res.status(500).send("Ein Fehler ist aufgetreten.");
        }
        // Session erfolgreich beendet, Umleitung zur Login-Seite
        res.redirect('/login.html');
    });
});


// Benutzer aus der Datenbank kriegen
// Benutzer aus der Datenbank abrufen
app.get('/users', async (req, res) => {
    // Stelle sicher, dass die Verbindung zur Datenbank besteht
    if (!connection) {
        console.error('Datenbankverbindung fehlt');
        return res.status(500).send('Serverfehler: Datenbankverbindung fehlt');
    }

    try {
        // Führe die SQL-Abfrage aus, um alle Benutzer abzurufen
        connection.query('SELECT user_id, username FROM users', (error, results) => {
            if (error) {
                // Logge den Fehler und sende eine Fehlermeldung zurück
                console.error('Fehler beim Abrufen der Benutzer:', error);
                return res.status(500).send('Serverfehler beim Abrufen der Benutzer');
            }
            // Sendet die Benutzerdaten als JSON zurück
            res.json(results);
        });
    } catch (error) {
        // Fange jegliche Fehler bei der Ausführung der Abfrage ab
        console.error('Fehler beim Abrufen der Benutzer:', error);
        res.status(500).send('Serverfehler');
    }
});




// POST path for Button 1
app.post('/button1_name', (req, res) => {
    // Load the name from the formular. This is the ID of the input:
    const name = req.body.name
    // Print it out in console:
    console.log("Client send the following name: " + name + " | Button1")
    // Send JSON message back - this could be also HTML instead.
    res.status(200).json({ message: 'I got your message - Name is: ' + name });
    // More information here: https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/forms
})

// GET path for Button 2
app.get('/button2', (req, res) => {
    // This will generate a random number and send it back:
    const random_number = Math.random();
    // Print it out in console:
    console.log("Send the following random number to the client: " + random_number + " | Button2")
    // Send it to the client / webbrowser:
    res.send("Antwort: g" + random_number);
    // Instead of plain TXT - the answer could be a JSON
    // More information here: https://www.w3schools.com/xml/ajax_intro.asp
});
// ###################### BUTTON EXAMPLE END ######################


// ###################### DATABASE PART ######################
// GET path for database
app.get('/database', (req, res) => {
    console.log("Request to load all entries from table1");
    // Prepare the get query
    connection.query("SELECT * FROM `table1`;", function (error, results, fields) {
        if (error) {
            // we got an errror - inform the client
            console.error(error); // <- log error in server
            res.status(500).json(error); // <- send to client
        } else {
            // we got no error - send it to the client
            console.log('Success answer from DB: ', results); // <- log results in console
            // INFO: Here could be some code to modify the result
            res.status(200).json(results); // <- send it to client
        }
    });
});

// DELETE path for database
app.delete('/database/:id', (req, res) => {
    // This path will delete an entry. For example the path would look like DELETE '/database/5' -> This will delete number 5
    let id = req.params.id; // <- load the ID from the path
    console.log("Request to delete Item: " + id); // <- log for debugging

    // Actual executing the query to delete it from the server
    // Please keep in mind to secure this for SQL injection!
    connection.query("DELETE FROM `table1` WHERE `table1`.`task_id` = " + id + ";", function (error, results, fields) {
        if (error) {
            // we got an errror - inform the client
            console.error(error); // <- log error in server
            res.status(500).json(error); // <- send to client
        } else {
            // Everything is fine with the query
            console.log('Success answer: ', results); // <- log results in console
            // INFO: Here can be some checks of modification of the result
            res.status(200).json(results); // <- send it to client
        }
    });
});

// POST path for database
app.post('/database', (req, res) => {
    // This will add a new row. So we're getting a JSON from the webbrowser which needs to be checked for correctness and later
    // it will be added to the database with a query.
    if (typeof req.body !== "undefined" && typeof req.body.title !== "undefined" && typeof req.body.description !== "undefined") {
        // The content looks good, so move on
        // Get the content to local variables:
        var title = req.body.title;
        var description = req.body.description;
        console.log("Client send database insert request with 'title': " + title + " ; description: " + description); // <- log to server
        // Actual executing the query. Please keep in mind that this is for learning and education.
        // In real production environment, this has to be secure for SQL injection!
        connection.query("INSERT INTO `table1` (`task_id`, `title`, `description`, `created_at`) VALUES (NULL, '" + title + "', '" + description + "', current_timestamp());", function (error, results, fields) {
            if (error) {
                // we got an errror - inform the client
                console.error(error); // <- log error in server
                res.status(500).json(error); // <- send to client
            } else {
                // Everything is fine with the query
                console.log('Success answer: ', results); // <- log results in console
                // INFO: Here can be some checks of modification of the result
                res.status(200).json(results); // <- send it to client
            }
        });
    }
    else {
        // There is nobody with a title nor description
        console.error("Client send no correct data!")
        // Set HTTP Status -> 400 is client error -> and send message
        res.status(400).json({ message: 'This function requries a body with "title" and "description' });
    }
});
// ###################### DATABASE PART END ######################




// All requests to /static/... will be redirected to static files in the folder "public"
// call it with: http://localhost:8080/static
app.use(express.static('public'))

//

// Start database connection
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

//Server starten
const PORT = process.env.PORT || 8087; // Definition des Serverports 8087, darauf läuft der Server (OHNE NGINX!)
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
