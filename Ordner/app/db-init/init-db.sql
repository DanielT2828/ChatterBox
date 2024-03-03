CREATE DATABASE IF NOT EXISTS Benutzerdatenbank;
USE Benutzerdatenbank;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Optional: Füge einen Testbenutzer hinzu
INSERT INTO users (username, password) VALUES ('testuser', 'testpass');

-- Gewährt dem Benutzer exampleuser alle Rechte auf die Datenbank Benutzerdatenbank
GRANT ALL PRIVILEGES ON Benutzerdatenbank.* TO 'exampleuser'@'%' IDENTIFIED BY 'examplepass';
FLUSH PRIVILEGES;
