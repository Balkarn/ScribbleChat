//Server

const express = require("express"); 
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 4001; //listen to environment variable port, otherwise port 4001
const index = require("./routes/index"); //Index route to listen to connection

const app = express();
app.use(index);

const server = http.createServer(app);

const io = socketIo(server);

const getApiAndEmit = socket => {
    const response = new Date();
    // Sends the date and time to the client
    socket.emit("FromAPI", response);
};

let interval; //locally define an interval

io.on("connection", (socket) => { //on connection
    console.log("New client connected");
    if (interval) { //if an interval already exists, clear it (for multiple connections)
        clearInterval(interval);
    }
    interval = setInterval(() => getApiAndEmit(socket), 1000);  //call the getApiAndEmit function every second
    socket.on("disconnect", () => {
        console.log("Client disconnected");
        clearInterval(interval);
    });
});

server.listen(port, () => console.log(`Listening on port ${port}`));