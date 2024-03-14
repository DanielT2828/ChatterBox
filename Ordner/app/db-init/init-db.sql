CREATE DATABASE IF NOT EXISTS Benutzerdatenbank;
USE Benutzerdatenbank;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    text VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
);



-- Optional: Füge einen Testbenutzer hinzu
INSERT INTO users (username, password) VALUES ('testuser', 'testpass');
INSERT INTO users (username, password) VALUES ('admin', '$2a$10$RE/PCtpafR/l8LMDmYTnQeqh5X/RempVo.TGDXTSIl99aPphh24Nm');


-- Gewährt dem Benutzer exampleuser alle Rechte auf die Datenbank Benutzerdatenbank
GRANT ALL PRIVILEGES ON Benutzerdatenbank.* TO 'exampleuser'@'%' IDENTIFIED BY 'examplepass';
FLUSH PRIVILEGES;
