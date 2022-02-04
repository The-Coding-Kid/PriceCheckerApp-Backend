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

const GetCategories = async (req: Request, res: Response) => {
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
};

export default GetCategories;
