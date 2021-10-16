//IMPORTS
const express = require("express");
const cors = require("cors");
//@ts-ignore
const mongoose = require("mongoose");
const router = require("express").Router();
const redis = require("redis");
const responseTime = require("response-time");
const axios = require("axios");
const { promisify } = require("util");
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const compression = require("compression");
const helmet = require("helmet");
const fs = require("fs");

// CONSTANTS DECLARATIONS
const saltRounds = 10;
const ipfilter = require("express-ipfilter").IpFilter;
const ips = [
  "69.181.208.142",
  "::ffff:192.168.86.162",
  "::ffff:127.0.0.1",
  "::1",
];

//REDIS DECLARATIONS
const client = redis.createClient({
  host: "127.0.0.1",
  port: "6379",
});
const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);
const DEL_ASYNC = promisify(client.del).bind(client);

//MongoDB DECLARATIONS
//@ts-ignore
let User = require("./models/User.model");
let Item = require("./models/Item.model");
require("dotenv").config();

// TYPEDEFS IMPORTS/DECLARATIONS
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
  _id: String;
  email: String;
  username: String;
  password: String;
  __v: Number;
}

// EXPRESS CONFIGS
const app = express();
const port: String | 5000 = process.env.PORT || 5000;

//MIDDLEWARE
app.use(cors());
app.use(responseTime());
app.use(express.json());
app.use(compression());
app.use(helmet());

//MONGODB CONNECTION
const uri: string | undefined = process.env.ATLAS_URI;
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .catch((err: Error) => {
    console.log("Could not connect to the database");
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
app.post("/register", async (req: Request, res: Response) => {
  const body: Register = await req.body;
  const email = body.email;
  const username = body.username;
  let password = body.password;
  bcrypt.hash(password, saltRounds, async (err: Error, hash: any) => {
    if (err) {
      const reply = await GET_ASYNC("error");
      if (reply) {
        res.send(JSON.parse(reply));
        return;
      }
      await SET_ASYNC("error", JSON.stringify(err), "EX", 10000);
      console.error(err);
      return;
    }
    password = hash;
    const newUser = new User({ email, username, password });
    newUser
      .save()
      .then(async () => {
        res.json("User added to the database successfully!");
        await DEL_ASYNC("users");
      })
      .catch((err: Error) => {
        res.status(400).json(err);
        return;
      });
  });
});

// LOGIN ROUTE
app.post("/login", async (req: Request, res: Response) => {
  const body: User = await req.body;
  const username = body.username;
  const password = body.password;

  try {
    const existingUser = await User.findOne({ username: username });
    if (!existingUser) {
      res.status(404).json("User doesn't exist");
      return;
    }
    let bool;
    await bcrypt
      .compare(password, existingUser.password)
      .then(async (res: any) => {
        bool = await res;
      })
      .catch((err: Error) => console.log(err));
    if (bool === false) {
      res.status(400).json("Invalid username or password");
      return;
    } else if (bool === true) {
      const token: any = await jsonwebtoken.sign(
        {
          email: existingUser.email,
          password: existingUser.password,
          id: existingUser._id,
        },
        process.env.SECRET_KEY,
        { expiresIn: "1d" }
      );
      return res.status(200).json({ result: existingUser, token });
    }
  } catch (err) {
    return res.status(500).json("Error: " + err);
  }
});

app.get("/items/all", async (req: Request, res: Response) => {
  try {
    Item.find().then(async (items: any) => {
      res.json(items);
    });
  } catch (err: any) {
    res.status(400).json(err);
    return;
  }
});

app.post("/items/new", async (req: Request, res: Response) => {
  const name = req.body.name;
  const category = req.body.category;
  const store = req.body.store;
  const latitude = req.body.latitude;
  const longitude = req.body.longitude;

  const newItem = new Item({ name, category, store, latitude, longitude });
  newItem
    .save()
    .then(async () => {
      res.json("New Item added to the database successfully!");
    })
    .catch((err: Error) => {
      res.status(400).json(err);
      return;
    });
});

app.use(ipfilter(ips, { mode: "allow" }));

app.get("/", async (req: Request, res: Response) => {
  try {
    const reply = await GET_ASYNC("users");
    if (reply) {
      res.send(JSON.parse(reply));
      return;
    }
    User.find().then(async (users: Array<UserList>) => {
      res.json(users);
      const saveResult = await SET_ASYNC(
        "users",
        JSON.stringify(users),
        "EX",
        10000
      );
    });
  } catch (err: any) {
    res.status(400).json(err);
    return;
  }
});

app.get("/test", async (req: Request, res: Response) => {
  res.json("Hello world");
});

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
