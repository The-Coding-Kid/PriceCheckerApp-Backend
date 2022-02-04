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

import User from "../models/User.model";
import Item from "../models/Item.model";
import Category from "../models/Category.model";
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

const LoginHandler = async (req: Request, res: Response) => {
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
};

export default LoginHandler;
