const mongoose = require('mongoose');

// Define the schema for the Player
const playerSchema = new mongoose.Schema({
    SetNo: {
        type: Number,
        required: true
    },
    Set: {
        type: String,
        required: true
    },
    FirstName: {
        type: String,
        required: true
    },
    Surname: {
        type: String,
        required: true
    },
    Country: {
        type: String,
        required: true
    },
    Age: {
        type: Number,
        required: true
    },
    Specialism: {
        type: String,
        required: true
    },
    PreTeam: {
        type: String,
        required: true
    },
    BasePrice: {
        type: Number,
        required: true
    },
    capped: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
});

// Create and export the Player model
const player = mongoose.model('Player', playerSchema);

module.exports = player;
