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

const RegisterHandler = async (req: Request, res: Response) => {
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
};

export default RegisterHandler;
