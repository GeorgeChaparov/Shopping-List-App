import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { create } from'express-handlebars';
import socketEvents from "./private/sockets.js";

const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));

const hbs = create({ 
	extname: '.hbs',
    defaultLayout: false, // Disable the default layout
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './views');

app.use(express.static(join(__dirname, "static")));

app.get('/', (req, res) => {
    res.render('index', {});
});

io.on("connection", async (socket) => {
    socketEvents(socket, app, io);
});

server.listen(3000, () => {
	console.log("server running");
});