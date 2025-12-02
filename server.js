require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const player = require('./models/playerModel');
const baseTeam = require('./models/baseTeamModel');
const { createRoom, joinRoom,hostJoin } = require('./roomController');
const Room = require('./models/roomModel');
const Team = require('./models/teamModel');
const ini=[
    { name: 'CSK', status: false },
  { name: 'DC', status: false },
  { name: 'GT', status: false },
  { name: 'KKR', status: false },
  { name: 'LSG', status: false },
  { name: 'MI', status: false },
  { name: 'PBKS', status: false },
  { name: 'RCB', status: false },
  { name: 'RR', status: false },
  { name: 'SRH', status: false },
  { name: 'host', status: false },
];
// Initialize App
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Replace with your frontend URL for production
        methods: ['GET', 'POST'],
    }
});
app.use(cors({
    origin: '*', // Replace '*' with your frontend domain in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));
app.get('/roomfindcode',async(req,res)=>{
    const {roomCode}=req.body;
    try {
        const room=await Room.findOne({roomCode});
        res.json(room);
    } catch (error) {
        res.status(500).send("Error");
    }
});
// API to fetch all player data
app.get('/players', async (req, res) => {
    try {
        console.log('fetching players');
        const players = await player.find();
        res.json(players);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error hai');
    }
});
app.get('/purse', async (req, res) => {
    const { roomCode, teamCode } = req.query;
    try {
        let team= await Team.findOne({teamCode});
        res.json(team.purse);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch team purse' });
    }
});
app.get('/getUnsold',async(req,res)=>{
    const {roomCode}=req.query;
    try {
        const ro=await Room.findOne({roomCode: roomCode});
        res.json({
            sold:ro.sold,
            unsold:ro.unsold
        })
    } catch (error) {
        res.status(500).send("Error");
    }
});
app.get('/getBase', async (req, res) => {
    try {
        const players = await baseTeam.findOne({name: 'CSK'});
        res.json(players);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error hai');
    }
});
 

// Search API
app.get('/playerstats', async (req, res) => {
    const { playerId } = req.body;
  
    try {
      // Fetch all teams containing the player in any nested boughtPlayers arrays
      const teams = await Team.find();
  
      if (teams.length === 0) {
        return res.status(404).json({ message: 'No teams found.' });
      }
  
      // Initialize variables for stats
      let totalSoldPrice = 0;
      let highestSoldPrice = Number.MIN_VALUE;
      let lowestSoldPrice = Number.MAX_VALUE;
      let totalTeams = 0;
      const playerOccurrences = [];
  
      teams.forEach((team) => {
        // Flatten the nested boughtPlayers arrays
        const allPlayers = team.boughtPlayers.flat(); // Combine nested arrays into one
  
        // Find the player in the flattened array
        const player = allPlayers.find((p) => p.id === playerId);
  
        if (player) {
          totalSoldPrice += player.currentBid || 0;
          highestSoldPrice = Math.max(highestSoldPrice, player.currentBid || 0);
          lowestSoldPrice = Math.min(lowestSoldPrice, player.currentBid || 0);
          totalTeams++;
          playerOccurrences.push(player);
        }
      });
  
      if (totalTeams === 0) {
        return res.status(404).json({ message: 'Player not found in any team.' });
      }
  
      // Calculate mean sold price
      const meanSoldPrice = totalTeams > 0 ? totalSoldPrice / totalTeams : 0;
  
      // Return stats
      res.json({
        playerId,
        meanSoldPrice,
        highestSoldPrice,
        lowestSoldPrice,
        totalTeams,
        playerOccurrences,
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });


app.post('/baseTeam', async (req, res) => {
    try {
        const NewTeam = await baseTeam.create(req.body);
        res.status(200).json({
            status: 'success',
            data: {
                NewTeam
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error
        });
    }
});
app.get('/getTeamInfo', async (req, res) => {
    const { roomCode, teamCode,teamName } = req.query;
    console.log('getTeamInfo:', roomCode, teamCode,teamName);
    
    try {
        let team= await Team.findOne({teamCode});
        if(!team){
            console.log('Team not found',teamName);
            const BaseTeam = await baseTeam.findOne({name: teamName}).lean();
            teamData = {
                teamCode,
                roomCode,
                teamName: BaseTeam.name,
                purse: BaseTeam.remainingPurse,
                rtmsRemaining: BaseTeam.rtmCount,
                retentions: BaseTeam.retainedPlayers
            }
            //call creatTeam function which creates a team in the database
            team = await createTeam(teamData);
        }
        // console.log('team created/fetched:',team);
        res.json(team);
    } catch (error) {
        console.error('Error fetching team info:', error);
        res.status(500).json({ message: 'Failed to fetch team info' });
    }            

});
app.post('/joinissue', async (req, res) => {
    console.log('joinissue:', req.body);
    try {
      const { roomCode, joinCode, isHost } = req.body;
  
      // Find the room by roomCode
      const room = await Room.findOne({ roomCode });
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      // If the user is the host
      if (isHost) {
        // Validate the host's join code
        if (room.host.hostJoinCode === joinCode) {
          // Update the host's isJoined status to false
          room.host.isJoined = false;
  
          // Save the updated room
          await room.save();
  
          return res.status(200).json({ message: 'Host issue resolved, Try joining the room now' });
        } else {
          return res.status(400).json({ message: 'Invalid Host Join Code' });
        }
      } else {
        // If the user is a team
        const team = room.teams.find(t => t.teamCode === joinCode);
        if (team) {
          // Update the team's isJoined status to false
          team.isJoined = false;
  
          // Save the updated room
          await room.save();
  
          return res.status(200).json({ message: 'Team issue resolved, Try joining the room now' });
        } else {
          return res.status(400).json({ message: 'Invalid Team Join Code' });
        }
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
const auctionState = {};
const teamOnStatus={};
const createTeam = async (teamData) => {
    try {
        // Create a new team in the database
        const newTeam = await Team.create(teamData);
        return newTeam;
    } catch (error) {
        console.error('Error creating team:', error);
        throw new Error('Failed to create team');
    }
};
//Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // Listen for room joining
    socket.on('joinRoom', ({ roomCode, teamCode }) => {
    console.log('joinRoom:', roomCode, teamCode);
    
        Room.findOne({ roomCode })
            .then((room) => {
                if (!room) {
                    return socket.emit('error', 'Room not found');
                }
                const team = room.teams.find(t => t.teamCode === teamCode);
                if (!team) {
                    return socket.emit('error', 'Invalid team code');
                }
                const teamName = team.teamName;
                // console.log('team:', team);
                // // Mark the team as joined
                team.isJoined = true;
                room.save();
                // Save room and team info in the socket object
                socket.data = { roomCode, teamCode };
                console.log('socket.data:', socket.data);
                // Join the room and notify
                socket.join(roomCode);
                console.log(`User ${socket.id} joined room ${roomCode} as team ${teamCode}`);
                if (auctionState[roomCode]!=null) {
                    socket.emit('currentAuctionState', auctionState[roomCode]);
                }
                console.log(auctionState[roomCode]);
                if (!teamOnStatus[roomCode]) {
                    // Clone the `ini` array to avoid modifying the original
                    teamOnStatus[roomCode] = JSON.parse(JSON.stringify(ini));
                }
                const teamIndex = teamOnStatus[roomCode].findIndex(team => team.name === teamName);
                if (teamIndex !== -1) {
                    teamOnStatus[roomCode][teamIndex].status = true;
                } else {
                    console.error(`Team ${teamName} not found in room ${roomCode}`);
                }
                io.to(roomCode).emit('newUser', { teamOnStatus: teamOnStatus[roomCode],message:`${teamName} joined the room` });
            })
            .catch((error) => {
                console.error('Error joining room:', error);
                socket.emit('error', 'Failed to join the room');
            });
    });
    
    // Event to reset join status
    socket.on('resetJoinStatus', async ({ roomCode, teamCode }) => {
        try {
            const room = await Room.findOne({ roomCode });
            if (room) {
                const team = room.teams.find(t => t.teamCode === teamCode);
                console.log('resetJoinStatus:',team);
                if (team) {
                    teamOnStatus[roomCode].find(t => t.name === team.teamName).status = false;
                    console.log(teamOnStatus[roomCode]);
                    io.to(roomCode).emit('newUser', { teamOnStatus: teamOnStatus[roomCode] ,message:`${team.teamName} left the room` });
                    team.isJoined = false; // Reset the isJoined flag
                    await room.save();
                    console.log(`Reset isJoined for team ${teamCode} in room ${roomCode}`);
                }
            }
        } catch (error) {
            console.error('Error resetting join status:', error);
            socket.emit('error', 'Failed to reset join status');
        }
    });

    socket.on('joinRoomAsHost', ({ roomCode }) => {
        Room.findOne({ roomCode })
            .then((room) => {
                if (!room) {
                    return socket.emit('error', 'Room not found');
                }
    
                // Check if the host has already joined

    
                // Mark the host as joined
                room.host.isJoined = true;
                room.save();
    
                // Save room information in the socket object
                socket.data = { roomCode, isHost: true };
    
                // Host joins the room and notify all users
                socket.join(roomCode);
                console.log(`Host ${socket.id} joined room ${roomCode}`);
                
                if (auctionState[roomCode]) {
                    // console.log('server par to ye hai state',auctionState[roomCode]);
                    socket.emit('currentAuctionStateHost', auctionState[roomCode]);
                }
                if (!teamOnStatus[roomCode]) {
                    // Clone the `ini` array to avoid modifying the original
                    teamOnStatus[roomCode] = JSON.parse(JSON.stringify(ini));
                }
                const teamIndex = teamOnStatus[roomCode].findIndex(team => team.name === 'host');
                if (teamIndex !== -1) {
                    teamOnStatus[roomCode][teamIndex].status = true;
                } else {
                    console.error(`Host not found in room ${roomCode}`);
                }
                io.to(roomCode).emit('newUser', { teamOnStatus: teamOnStatus[roomCode] ,message:`Host joined the room ` });

            })
            .catch((error) => {
                console.error('Error joining room as host:', error);
                socket.emit('error', 'Failed to join the room as host');
            });
    });
    
    // Handle host disconnection
    socket.on('hostdisconnect', async () => {
        const { roomCode, isHost } = socket.data || {};
    
        if (isHost && roomCode) {
            try {
                const room = await Room.findOne({ roomCode });
                if (room) {
                    // Reset the host's joined status
                    room.host.isJoined = false;
                    await room.save();
    
                    console.log(`Host disconnected from room ${roomCode}`);
                    teamOnStatus[roomCode].find(t => t.name === 'host').status = false;
                    console.log(teamOnStatus[roomCode]);
                    io.to(roomCode).emit('newUser', { teamOnStatus: teamOnStatus[roomCode] ,message:`Host left the room` });
                    io.to(roomCode).emit('hostLeft', { message: 'The host has left the auction room.' });
                }
            } catch (error) {
                console.error('Error handling host disconnection:', error);
            }
        } else if (roomCode) {
            // Handle user disconnection
            console.log(`User ${socket.id} disconnected from room ${roomCode}`);
        }
    });
    socket.on('newItem', ({ roomCode, playerDetails }) => {
        if (roomCode && playerDetails) {
            console.log(`New item in room ${roomCode}:`, playerDetails);
            auctionState[roomCode] = {
                currentAuctionItem: playerDetails,
                currentBid: playerDetails.basePrice,
                currBidder: null,
                validBid: false,
            };
            // Broadcast the new item to all users in the room
            io.to(roomCode).emit('newItemForAuction', playerDetails);
        } else {
            console.error('Invalid data for newItem event');
        }
    });
    socket.on('placeBid', ({ roomCode, bidAmount,currentAuctionItem,teamCode,newBidderName }) => {
        // Emit updated bid to all clients
        auctionState[roomCode] = {
            currentAuctionItem: currentAuctionItem,
            currentBid: bidAmount,
            currBidder: teamCode,
            currBidderName:newBidderName ,
            validBid: true,
        };
        io.to(roomCode).emit('auctionUpdate', {
            currentAuctionItem: currentAuctionItem,
            newBidAmount: bidAmount,
            newBidder: teamCode,
            newBidderName:newBidderName,
        });
    });
    socket.on('warnMsg', ({ roomCode, warningMesssage }) => {
        if (roomCode ) {
            // Broadcast the new item to all users in the room
            io.to(roomCode).emit('warnMsg', warningMesssage);
        } else {
            console.error('Invalid data ');
        }
    });

    socket.on('playerUnsoldServ',({roomCode})=>{
        auctionState[roomCode]=(null);
        console.log('auction state eheheh2',auctionState[roomCode]=(null))
        const m="Player will remain unsold";
        io.to(roomCode).emit('playerUnsold',m);
    });

const sellPlayer= async (soldState,roomCode)=>{
    console.log(`soldstate`,soldState);
    const currBidder=soldState.currBidder;
    const currentBid=soldState.currentBid;
    const updateRoom=await Room.findOneAndUpdate({roomCode},
        {
            $push: { sold: soldState.id }
        },
        { new: true }
    )
    // Find the team and update both the purse and boughtPlayers
    const updatedTeam = await Team.findOneAndUpdate(
        { roomCode, teamCode: currBidder }, // Match the team using roomCode and bidder's teamCode
        {
            $push: { boughtPlayers: soldState }, // Push the player with sold price
            $inc: { purse: -currentBid }, // Deduct the current bid amount from the purse
        },
        { new: true } // Return the updated document
    );
    if(soldState.useRtm){
        console.log('rtm use kiya hai');
        const updatedTeam = await Team.findOneAndUpdate(
            { roomCode, teamCode: currBidder }, // Match the team using roomCode and bidder's teamCode
            {
                $inc: { rtmsRemaining: -1 }, // Deduct the current bid amount from the purse
            },
            { new: true } // Return the updated document
        );
    }
    if (!updatedTeam) {
        console.error('Team not found');
        socket.emit('error', 'Team not found');
        return;
    }

    // console.log(`Player added to team ${soldState.currBidderName} deducted from purse ${currentBid}.`);
    // console.log('Updated Team:', updatedTeam,updateRoom);
    auctionState[roomCode]=(null);
    io.to(roomCode).emit('playerSold', soldState);
    console.log(`auction state is eheheh1`,auctionState[roomCode]);
};
socket.on('playerSoldServ', async ({ roomCode, soldState }) => {
    try {
        const pre=soldState.preTeam;
        if(pre&&pre!=soldState.currBidderName){
            const teamIndex = teamOnStatus[roomCode].findIndex(team => team.name === pre);
            const room = await Room.findOne({ roomCode: String(roomCode) });
            const t = room.teams.find(t => t.teamName === String(pre));
            const team=await Team.findOne({teamCode:t.teamCode});
            console.log('rtm',pre);
            if(teamOnStatus[roomCode][teamIndex].status ==true &&team.rtmsRemaining>0){
                soldState.rtmTeam = team.teamCode;
                soldState.rtmTeamName = pre;
                io.to(roomCode).emit('rtmUpdate',{
                    soldState
                })
            }
            else{ 
                soldState.useRtm=false;
                console.log(' nahi yaha bika',soldState);
                sellPlayer(soldState,roomCode);
            }

        }
        else{
            soldState.useRtm=false;
            console.log('yaha bika',soldState);
            sellPlayer(soldState,roomCode);
        }
         
    } catch (error) {
        console.error('Error updating team:', error.message);
        socket.emit('error', 'Failed to update team');
    }
});
socket.on('rtmResponse',async({roomCode,useRtm,soldState})=>{
    console.log('kuch to aaya hai bhai',useRtm);
    if(useRtm){
        console.log('accepted',soldState);
        // console.log(soldState.currBidder,soldState.currBidderName);
        io.to(roomCode).emit('bidMatch',{
            soldState
            // rtmTeam:team.teamCode,
            // rtmTeamName:pre
        });
        console.log("chala gya lgta h");
    }
    else{
        console.log('rtm rehect 2',soldState);
        // soldState.soldState.useRtm=false;
        sellPlayer(soldState,roomCode);
    }
});
socket.on('finalBid',async({roomCode,finalBid,soldState})=>{
    soldState.soldState.currentBid=finalBid;
    console.log('finalBid',soldState);
    io.to(roomCode).emit('finalBidMatch',{
        soldState,
        finalBid
    });
    
});
socket.on('sendMessage', ({ roomCode, teamName, message }) => {
    console.log('sendMessage:', roomCode, teamName, message);
    io.to(roomCode).emit('receiveMessage', { teamName, message, timestamp: new Date().toISOString() });
});
socket.on('finalBidResponse',async({roomCode,finalBidResponse,soldState})=>{
    if(finalBidResponse){
        console.log(`accepted and sold to` ,soldState.soldState.rtmTeamName );
        soldState.soldState.currBidder=soldState.soldState.rtmTeam;
        soldState.soldState.currBidderName=soldState.soldState.rtmTeamName;
        sellPlayer(soldState.soldState,roomCode);
    }
    else{
        soldState.soldState.useRtm=false;
        console.log('rtm rehect 1',soldState);
        sellPlayer(soldState.soldState,roomCode);
    }
});

});



// Create and join room routes
app.post('/createRoom', createRoom);
app.post('/joinRoom', joinRoom);
app.post('/hostJoin', hostJoin);

// Start server
const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is not defined
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
