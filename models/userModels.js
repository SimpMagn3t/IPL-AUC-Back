const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // Team selected by the user
  role: { type: String, enum: ['Admin', 'Player'], default: 'Player' },
});

module.exports = mongoose.model('User', userSchema);
