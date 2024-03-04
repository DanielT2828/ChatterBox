// Importieren der notwendigen Module
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const mysql = require('mysql');
const multer = require('multer');
const upload = multer();

const app = express();
const saltRounds = 10;

// Konfiguration der Session
app.use(session({
    secret: 'geheimnis',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Middleware für das Parsen von Body-Daten
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Datenbankverbindung
const connection = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOSTNAME,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
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
const PORT = process.env.PORT || 8087;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});






