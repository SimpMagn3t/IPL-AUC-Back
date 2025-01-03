const mongoose = require('mongoose');
const teamSchema = new mongoose.Schema({
  teamCode: { type: String, required: true, unique: true },
  teamName: { type: String, required: true },
  roomCode: { type: String, required: true }, // Links team to a specific room
  purse: { type: Number, required: true },
  retentions: [{ }],
  rtmsRemaining: { type: Number, required: true, default: 0 },
  boughtPlayers: [
      {
          
      }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
