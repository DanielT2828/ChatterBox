
--Erstellt Benutzerdatenbank falls diese noch nicht existiert
CREATE DATABASE IF NOT EXISTS Benutzerdatenbank;
USE Benutzerdatenbank;

--Tabelle User wird erstellt falls nicht vorhanden
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);
--Tabelle Messages wird erstellt falls nicht vorhanden
CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    text VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
);



---INSERT INTO users (username, password) VALUES ('testuser', 'testpass');
INSERT INTO users (username, password) VALUES ('admin', '$2a$10$RE/PCtpafR/l8LMDmYTnQeqh5X/RempVo.TGDXTSIl99aPphh24Nm');
INSERT INTO users (username, password) VALUES ('Axel', '$2a$10$Ko0Mxmg4V.aD8jrozMhG1e6D8MsFHv4ktNLnYULqMViveseNRvszi');
INSERT INTO users (username, password) VALUES ('Antonio', '$2a$10$GCInphivKrLzVWBw47LYJeWtu/4YtQ1P60xTd1D9BhwvAqj3nctN6');
INSERT INTO users (username, password) VALUES ('Daniel', '$2a$10$8PC8w52JdL7LR8hTa.ENg..nNWTbGyPr.0VcIqPKmfW/dAXSkYbke');


INSERT INTO messages (message_id, sender_id, receiver_id, text, timestamp) VALUES ('111', '34', '33', 'Hallo', '2024-03-26 12:51:50');




-- Gewährt dem Benutzer exampleuser alle Rechte auf die Datenbank Benutzerdatenbank
GRANT ALL PRIVILEGES ON Benutzerdatenbank.* TO 'exampleuser'@'%' IDENTIFIED BY 'examplepass';
FLUSH PRIVILEGES;
