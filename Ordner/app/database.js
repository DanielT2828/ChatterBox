const mongoose = require('mongoose');

mongoose.connect('mongodb://root:example@mongo:27017/chatterboxDB?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB verbunden'))
.catch(err => console.error('MongoDB Verbindungsfehler:', err));
