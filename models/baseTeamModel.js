const mongoose = require('mongoose');

const baseTeamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  purse: { type: Number, required: true }, // Default purse for auction
  retainedPlayers: [
    {
      name: { type: String, required: true },
      specialism: { type: String, required: true }
    }
  ], // Retained player details
  rtmCount: { type: Number, default: 0 } // Right-to-Match count
});

const baseTeam = mongoose.model('BaseTeam', baseTeamSchema);
module.exports = baseTeam;
