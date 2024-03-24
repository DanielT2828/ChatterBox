const mongoose = require('mongoose');

// Verbindung zur MongoDB-Datenbank herstellen
mongoose.connect('mongodb://root:rootpw@mongo:27017/chatterboxDB?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB verbunden'))
.catch(err => console.error('MongoDB Verbindungsfehler:', err));

// Definieren eines Schemas für Bilder
const imageSchema = new mongoose.Schema({
  filename: String,
  path: String,
  contentType: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Erstellen eines Modells basierend auf dem Schema
const Image = mongoose.model('Image', imageSchema);

// Exportieren des Image-Modells, damit es in anderen Teilen der Anwendung verwendet werden kann
module.exports = { Image };
