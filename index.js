const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const ImageKit = require("imagekit");
app.use(cors());
app.use(express.json());
const bcrypt = require("bcrypt");
const User = require("./models/userSchema");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const CreateReview = require("./models/reviewSchema");
const CreateInterview = require("./models/interviewSchema");
var fs = require("fs");
require("dotenv").config();
const imagekit = new ImageKit({
  urlEndpoint: "https://ik.imagekit.io/b32h240hi",
  publicKey: "public_xWxPKWl6GZQqbQyFgoMtvTzHn6I=",
  privateKey: "private_fxYV8z1QHjot3BEoPRWA2EkBNw4=",
});

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database running..."))
  .catch((err) => console.log(err));

const verifytoken = async (req, res, next) => {
  const token = req.headers["x-access-token"];
  const decode = jwt.verify(token, process.env.SECRET_KEY);
  const userId = decode.userId;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(401).json({ message: "Invalid Token" });
  }
  req.userId = userId;
  next();
};

app.post("/create-review", verifytoken, async (req, res) => {
  const isAnonymous = req.body.isAnonymous;
  const userId = req.userId;
  const user = await User.findById(userId);
  const anonymousAvatars = [
    "https://ik.imagekit.io/b32h240hi/spyware.png",
    "https://ik.imagekit.io/b32h240hi/anonymous.png",
    "https://ik.imagekit.io/b32h240hi/hacker.png",
  ];

  let avatar;
  if (isAnonymous) {
    const randomIndex = Math.floor(Math.random() * anonymousAvatars.length);
    avatar = anonymousAvatars[randomIndex];
  } else {
    avatar = user.avatar;
  }
  const newReview = new CreateReview({
    date: Date.now(),
    name: !isAnonymous
      ? user.firstname + " " + user.lastname
      : "Anonymous User",
    content: req.body.content,
    avatar: avatar,
  });
  newReview.save();
  res
    .status(200)
    .json({ message: "Review has been Succesfully created", newReview });
});

app.post("/create-interview", verifytoken, async (req, res) => {
  const userId = req.userId;
  const {
    isAnonymous,
    company,
    role,
    offerstatus,
    location,
    jobtype,
    rounds,
    content,
    yearsofexperience,
    companylogo,
  } = req.body;
  const user = await User.findById(userId);
  const newInterview = new CreateInterview({
    date: Date.now(),
    name: !isAnonymous
      ? user.firstname + " " + user.lastname
      : "Anonymous User",
    company: company,
    role: role,
    offerstatus: offerstatus === "selected" ? true : false,
    location: location,
    jobtype: jobtype,
    rounds: rounds,
    content: content,
    yearsofexperience: yearsofexperience,
    companylogo: companylogo,
  });
  newInterview.save();
  res.status(200).json({
    message: "InterviewExperience has been Succesfully shared",
    newInterview,
  });
});

app.get("/get-interview", async (req, res) => {
  const data = await CreateInterview.find();
  res.status(200).json(data);
});
app.get("/totalCount", async (req, res) => {
  const totalReview = await CreateInterview.count();
  const totalInterview = await CreateReview.count();
  res.status(200).json({ totalInterview, totalReview });
});

app.get("/get-interview/:id", async (req, res) => {
  const id = req.params.id;
  const data = await CreateInterview.findById(id);
  res.status(200).json(data);
});
app.get("/get-review", async (req, res) => {
  const data = await CreateReview.find();
  res.status(200).json(data);
});

app.get("/get-userlogin", verifytoken, async (req, res) => {
  const userId = req.userId;
  const user = await User.findById(userId);
  const userDatatoSend = {
    _id: user._id,
    email: user.email,
    name: user.firstname + " " + user.lastname,
    regNo: user.regNo,
    islogin: true,
    avatar: user.avatar,
  };
  res.status(200).json(userDatatoSend);
});
app.post("/profileUpdate", verifytoken, async (req, res) => {
  const userId = req.userId;
  const avatarUrl = req.body.data;
  try {
    await User.findByIdAndUpdate(userId, { avatar: avatarUrl });
    res.status(200).json("Profile Updated Successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/upvote", verifytoken, async (req, res) => {
  const userId = req.userId;
  const postId = req.body._id;
  await CreateReview.findById(postId)
    .then(async (review) => {
      const userupvoted = review.upvotes.includes(userId);
      const userdownvoted = review.downvotes.includes(userId);
      if (userdownvoted) {
        await CreateReview.findByIdAndUpdate(postId, {
          $pull: { downvotes: userId },
        });
      }
      if (userupvoted) {
        await CreateReview.findByIdAndUpdate(postId, {
          $pull: { upvotes: userId },
        });
      } else {
        await CreateReview.findByIdAndUpdate(postId, {
          $push: { upvotes: userId },
        });
      }
    })
    .then(() => res.status(200).json({ message: "successfully voted" }))
    .catch((error) => res.status(500).json({ message: error }));
});

app.post("/downvote", verifytoken, async (req, res) => {
  const userId = req.userId;
  const postId = req.body._id;
  await CreateReview.findById(postId)
    .then(async (review) => {
      const userdownvoted = review.downvotes.includes(userId);
      const userupvoted = review.upvotes.includes(userId);
      if (userupvoted) {
        await CreateReview.findByIdAndUpdate(postId, {
          $pull: { upvotes: userId },
        });
      }
      if (userdownvoted) {
        await CreateReview.findByIdAndUpdate(postId, {
          $pull: { downvotes: userId },
        });
      } else {
        await CreateReview.findByIdAndUpdate(postId, {
          $push: { downvotes: userId },
        });
      }
    })
    .then(() => res.status(200).json({ message: "successfully voted" }))
    .catch((error) => res.status(500).json({ message: error }));
});
app.post("/auth/register", async (req, res) => {
  try {
    const { firstname, lastname, password, email, regNo, avatar } = req.body;
    const checkemail = await User.findOne({ email });
    const checkregNo = await User.findOne({ regNo });
    if (checkemail) {
      return res.status(401).json({ message: "Email already exist" });
    }
    if (checkregNo) {
      return res
        .status(401)
        .json({ message: "registration No. already exist" });
    }
    const hashedpassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstname,
      lastname,
      password: hashedpassword,
      email,
      regNo,
      avatar,
    });
    await newUser.save();
    res.status(201).json({ message: "user added" });
  } catch (e) {
    res.status(500).json({ message: "error while creating a account" });
  }
});
app.get("/profileAvatar", async (req, res) => {
  try {
    imagekit
      .listFiles()
      .then((result) => {
        const avatar = [];
        result.map((data) => {
          avatar.push(data.thumbnail);
        });
        res.status(200).json(avatar);
      })
      .catch((error) => res.status(400).json("error while fetching avatar"));
  } catch (e) {
    res.status(400).json(e);
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid Email" });
    }
    const isvalidpassword = await bcrypt.compare(password, user.password);
    if (!isvalidpassword) {
      return res.status(401).json({ message: "Invalid Password" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY);
    res.status(200).json({ message: "Login successful", token });
  } catch (e) {
    res.status(500).json({ message: "login failed" });
  }
});

app.post("/auth/googlelogin", async (req, res) => {
  try {
    const { access_token } = req.body;
    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    if (!data) {
      return res.status(400).json({ message: "login failed" });
    }
    const { email, name } = data;
    const user = await User.findOne({ email });
    if (!user) {
      const regex = /^(\w+) (\w+) \((\w+)\)$/;
      const match = name.match(regex);
      if (match) {
        const newUser = new User({
          firstname: match[1],
          lastname: match[2],
          email,
          regNo: match[3],
        });
        newUser.save();
        const user = await User.findOne({ email });
        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY);
        return res
          .status(200)
          .json({ message: "Google signin successful", token });
      } else {
        return res
          .status(401)
          .json({ message: "Invalid Email Please use SRM mailid" });
      }
    }
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY);
    res.status(200).json({ message: "Google signin successful", token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log("server is running");
});
