const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
    {
        roomCode: { type: String, required: true, unique: true },
        host: {
            type: {
                hostJoinCode: { type: String, required: true }, // Host's unique join code
                isJoined: { type: Boolean, default: false } // Host joined status
            },
            required: true
        },
        teams: [
            {
                teamCode: { type: String, required: true }, // Reference to team codes
                teamName: { type: String, required: true }, // Team names for quick access
                isJoined: { type: Boolean, default: false } // Flag to check if team has joined
            }
        ],
        sold:{

        },
        unsold:{

        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);


