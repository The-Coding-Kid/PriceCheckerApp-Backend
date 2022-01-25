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
app.post("/register", async (req: Request, res: Response) => {
  const body: Register = await req.body;
  const email = body.email;
  const username = body.username;
  let password = body.password;
  bcrypt.hash(password, saltRounds, async (err: any, hash: any) => {
    if (err) {
      const reply = await GET_ASYNC("error");
      if (reply) {
        res.send(JSON.parse(reply));
        return;
      }
      //@ts-ignore
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
        //@ts-ignore
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
      const token: any = jsonwebtoken.sign(
        {
          email: existingUser.email,
          password: existingUser.password,
          id: existingUser._id,
        },
        //@ts-ignore
        process.env.SECRET_KEY,
        { expiresIn: "1d" }
      );
      return res.status(200).json({ result: existingUser, token });
    }
  } catch (err) {
    return res.status(500).json("Error: " + err);
  }
});

app.get("/category/all", async (req: Request, res: Response) => {
  try {
    const reply = await GET_ASYNC("categories");
    if (reply) {
      res.send(JSON.parse(reply));
      return;
    }
    Category.find().then(async (items: any) => {
      res.json(items);
      const result = await SET_ASYNC(
        "categories",
        JSON.stringify(items),
        //@ts-ignore
        "EX",
        100000000
      );
    });
  } catch (err: any) {
    res.status(400).json(err);
    return;
  }
});

app.get("/items/all", async (req: Request, res: Response) => {
  try {
    const reply = await GET_ASYNC("items");
    if (reply) {
      res.send(JSON.parse(reply));
      return;
    }
    Item.find().then(async (items: any) => {
      res.json(items);
      const result = await SET_ASYNC(
        "items",
        JSON.stringify(items),
        //@ts-ignore
        "EX",
        10000000000
      );
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
  const coordinate = req.body.coordinate;

  const newItem = new Item({ name, category, store, coordinate });
  newItem
    .save()
    .then(async () => {
      res.json("New Item added to the database successfully!");
      //@ts-ignore
      const result = await DEL_ASYNC("items");
    })
    .catch((err: Error) => {
      res.status(400).json(err);
      return;
    });
});

app.get("/", async (req: Request, res: Response) => {
  try {
    const reply = await GET_ASYNC("users");
    if (reply) {
      res.send(JSON.parse(reply));
      return;
    }
    User.find().then(async (users: any) => {
      res.json(users);
      const saveResult = await SET_ASYNC(
        "users",
        JSON.stringify(users),
        //@ts-ignore
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

app.post("/category/new", async (req: Request, res: Response) => {
  const id = req.body.id;
  const name = req.body.name;

  const newCategory = new Category({ id, name });
  newCategory
    .save()
    .then(async () => {
      res.json("New Category Added");
      //@ts-ignore
      const result = await DEL_ASYNC("categories");
    })
    .catch((err: Error) => {
      res.status(400).json(err);
      return;
    });
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
