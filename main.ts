import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import redis from "redis";
import responseTime from "response-time";
import axios from "axios";
import { promisify } from "util";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import compression from "compression";
import helmet from "helmet";

// CONSTANTS DECLARATIONS
const saltRounds = 10;

//REDIS DECLARATIONS
const client = redis.createClient({
  host: "127.0.0.1",
  port: 6379,
});
const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);
const DEL_ASYNC = promisify(client.del).bind(client);

//MongoDB DECLARATIONS

import User from "./models/User.model";
import Item from "./models/Item.model";
import Category from "./models/Category.model";
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

// Handler Imports
import RegisterHandler from "./handlers/RegisterHandler";
import LoginHandler from "./handlers/LoginHandler";
import GetCategories from "./handlers/GetCategories";
import GetItems from "./handlers/GetItems";
import NewItem from "./handlers/NewItem";
import GetUsers from "./handlers/GetUsers";
import NewCategory from "./handlers/NewCategory";

// TYPE DEFINITIONS IMPORTS/DECLARATIONS
import { Request, Response } from "express";
interface User {
  username: string;
  password: string;
}

interface Register {
  email: string;
  username: string;
  password: string;
}

interface UserList {
  _id: string;
  email: string;
  username: string;
  password: string;
  __v: number;
}

// EXPRESS CONFIGS
const app = express();
const port: string | 5001 = process.env.PORT || 5001;

//MIDDLEWARE
app.use(cors());
app.use(responseTime());
app.use(express.json());
app.use(compression());
app.use(helmet());

//MONGODB CONNECTION
const uri: string | undefined = process.env.ATLAS_URI;
mongoose
  //@ts-ignore
  .connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .catch((err: Error) => {
    console.log(err, " Could not connect to the database");
  });
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

//START SERVER
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

// *************************************
// START ROUTES

// REGISTER ROUTE
// TODO: Add a feature to check if this email is already registered
app.post("/register", RegisterHandler);

// LOGIN ROUTE
app.post("/login", LoginHandler);

app.get("/category/all", GetCategories);

app.get("/items/all", GetItems);

app.post("/items/new", NewItem);

app.get("/", GetUsers);

app.get("/test", async (req: Request, res: Response) => {
  res.json("Hello world");
});

app.post("/category/new", NewCategory);

// ***************************************************
// END ROUTES
// ***************************************************

//FIXME this is just a reference for using redis client

// app.get('/rockets', async (req: any, res: any, next: any) => {
// 	try {
// 		const reply = await GET_ASYNC('rockets');
// 		if (reply) {
// 			res.send(JSON.parse(reply));
// 			return;
// 		}
// 		const response = await axios.get('https://api.spacexdata.com/v3/rockets');
// 		const saveResult = await SET_ASYNC('rockets', JSON.stringify(response.data), 'EX', 50000);
// 		console.log('Data Cached', saveResult);
// 		res.send(response.data);
// 	} catch (err) {
// 		res.status(400).json(err);
// 	}
// });
