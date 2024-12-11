const express = require("express");
const router = new express.Router();
const bcrypt = require("bcryptjs");
const userDB = require("../models/userSchema");
const authenticate = require("../middleware/authenticate");

//to register user
router.post("/register", async (req, res) => {
  const { name, email, password, cPassword } = req.body;
  if (!name || !email || !password || !cPassword) {
    res.status(422).json({ status: 422, error: "Fill All The Details" });
  } else {
    try {
      const preUser = await userDB.findOne({ email: email });
      if (preUser) {
        res
          .status(422)
          .json({ status: 422, error: "User Email already Exists" });
      } else if (password !== cPassword) {
        res.status(422).json({
          status: 422,
          error: "Password and Confirm Password don't Match",
        });
      } else {
        const newUser = new userDB({ name, email, password, cPassword });
        //saving the data, the hashing will be done prior
        const storedUser = await newUser.save();
        res.status(201).json({
          status: 201,
          message: "User Registered Successfully",
          data: storedUser,
        });
      }
    } catch (error) {
      console.log("error while saving data to db", error);
      res.status(422).json({ status: 422, error: error });
    }
  }
});

//login api
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(422).json({
      status: 422,
      error: "Login Credentails missing, fill all the details",
    });
  } else {
    try {
      const preUser = await userDB.findOne({ email: email });
      if (preUser) {
        const isMatch = await bcrypt.compare(password, preUser.password);

        if (!isMatch) {
          res.status(422).json({ status: 422, error: "Incorrect Password" });
        } else {
          //generating auth jwt token
          const token = await preUser.generateAuthToken();

          //cookie generate and adding in response
          res.cookie("userCookie", token, {
            expire: new Date(Date.now() * 900000),
            httpOnly: true,
          });

          //sending response
          const result = { user: preUser, token };
          res.status(201).json({ status: 201, data: result });
        }
      } else {
        res.status(401).json({ status: 401, error: "User Does Not Exists" });
      }
    } catch (error) {
      console.log("error in loging user", error);
      res.status(401).json({ status: 401, error: "User Does Not Exists" });
    }
  }
});

// check user valid or not
router.get("/validUser", authenticate, async (req, res) => {
  try {
    const validUser = await userDB.findOne({ _id: req.userId });
    res.status(201).json({ status: 201, validUser });
  } catch (error) {
    console.log("error in validating  user", error);
    res.status(401).json({ status: 401, error: "error in validating  user" });
  }
});

// to logout user
router.get("/logout", authenticate, async (req, res) => {
  try {
    req.rootUser.tokens = req.rootUser.tokens.filter((currTok) => {
      return currTok.token !== req.token;
    });

    res.clearCookie("userCookie", { path: "/" });

    await req.rootUser.save();
    res.status(201).json({
      status: 201,
      message: "User Logged Out Successfully",
    });
  } catch (error) {
    console.log("error in logging out  user", error);
    res
      .status(401)
      .json({
        status: 401,
        message: "error in logging out  user",
        error: error,
      });
  }
});

module.exports = router;

//1.encryption and decryption
// 12345 --> #@&^%$$    encryption at registering
//then when logging the saved pasword had to be decrypted #@&^%$$ ---> 12345, an dthen compared to inputted password
//2. hashing   ---> compares password
// 12345 ---> #@&^%$$      hashed at the time of registering
// when user inputs p[assword at login 12345---> hashed again #@&^%$$ and then
// checked with the hashed value stored in db, (#@&^%$$,#@&^%$$) ---> true means success
