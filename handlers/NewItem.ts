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

const NewItem = async (req: Request, res: Response) => {
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
};

export default NewItem;
