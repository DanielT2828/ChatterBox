const mongoose = require('mongoose');

// Ersetze 'mongodb://root:rootpw@mongo:27017/chatterboxDB?authSource=admin' mit deinem Connection String
mongoose.connect('mongodb://root:rootpw@mongo:27017/chatterboxDB?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB verbunden');
  
  // Definiere ein einfaches Schema für eine Sammlung 'messages'
  const messageSchema = new mongoose.Schema({
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  // Erstelle ein Model basierend auf dem Schema
  const Message = mongoose.model('Message', messageSchema);

  // Erstelle ein neues Dokument in der Sammlung 'messages'
  const newMessage = new Message({ text: 'Hallo Welt!' });
  newMessage.save().then(doc => console.log('Dokument gespeichert:', doc)).catch(err => console.error(err));

}).catch(err => {
  console.error('MongoDB Verbindungsfehler:', err);
});
