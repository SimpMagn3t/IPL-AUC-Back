const Room = require("./models/roomModel"); // Room schema
const baseTeam = require("./models/baseTeamModel"); // BaseTeams schema
const generateUniqueCode = require("./utils/generateUniqueCode"); // Utility to generate codes

const createRoom = async (req, res) => {
    try {
        // Fetch all existing room codes, team codes, and host join codes
        const existingRoomCodes = new Set(await Room.find().distinct("roomCode"));
        const existingTeamCodes = new Set(await Room.find().distinct("teams.teamCode"));
        const existingHostJoinCodes = new Set(await Room.find().distinct("host.hostJoinCode"));

        // Fetch all base teams from the database
        const baseTeams = await baseTeam.find();
        if (!baseTeams || baseTeams.length === 0) {
            return res.status(404).json({ message: "No base teams available in the database" });
        }

        // Generate a unique room code
        const roomCode = generateUniqueCode(existingRoomCodes);

        // Generate unique team codes for each base team
        const roomTeams = baseTeams.map(team => ({
            teamCode: generateUniqueCode(existingTeamCodes), // Unique team code
            teamName: team.name, // Base team name
            isJoined: false // Default joined status
        }));

        // Generate a unique host join code
        const hostJoinCode = generateUniqueCode(existingHostJoinCodes);
        console.log(`hostcode`,hostJoinCode);
        // Create and save the new room
        const newRoom = new Room({
            roomCode,
            host: {
                hostJoinCode, // Unique code for the host
                isJoined: false // Default host not joined yet
            },
            teams: roomTeams
        });
        console.log(`new room`,newRoom)
        await newRoom.save();

        // Return the room code, host join code, and list of teams
        res.status(201).json({
            message: "Room created successfully",
            roomCode,
            host: {
                hostJoinCode, // Host's join code
                isJoined: false // Host not yet joined
            },
            teams: roomTeams
        });
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ message: "Error creating room", error });
    }
};



/**
 * Endpoint to join a room
 * Users will join the room with a room code and team code.
 */
const joinRoom = async (req, res) => {
    const { roomCode, teamCode } = req.body;
    console.log(`roomCode`,roomCode);

    try {
        // Find the room by room code
        const room = await Room.findOne({ roomCode: String(roomCode) });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Find the team in the room by team code
        const team = room.teams.find(t => t.teamCode === String(teamCode));
        if (!team) {
            return res.status(404).json({ message: "Invalid team code" });
        }

        // Ensure that the team has not already been joined
        if (team.isJoined) {
            return res.status(400).json({ message: "Team already joined by another user" });
        }

        // // // Mark the team as joined
        team.isJoined = true;
        // console.log("call to ho raha hai")

        // // Save the updated room
        await room.save();

        res.status(200).json({
            message: `Successfully joined the room as team ${team.teamName}`,
            roomCode,
            teamName: team.teamName
        });
    } catch (error) {
        console.error("Error joining room:", error);
        res.status(500).json({ message: "Error joining room", error });
    }
};

const hostJoin = async (req, res) => {
    const { roomCode, hostJoinCode } = req.body;

    try {
        // Find the room by room code
        const room = await Room.findOne({ roomCode: String(roomCode) });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Validate the host join code
        if (room.host.hostJoinCode !== String(hostJoinCode)) {
            return res.status(400).json({ message: "Invalid host join code" });
        }

        // Ensure the host has not already joined
        if (room.host.isJoined) {
            return res.status(400).json({ message: "Host has already joined the room" });
        }

        res.status(200).json({
            message: "Successfully joined the room as host",
            roomCode
        });
    } catch (error) {
        console.error("Error joining room as host:", error);
        res.status(500).json({ message: "Error joining room as host", error });
    }
};

module.exports = {
    createRoom,
    joinRoom,
    hostJoin,
};
