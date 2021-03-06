// Copy and paste your work, or start typing.
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");

const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");


const Teacher = require("../../models/Teacher")
router.get('/', (req, res) => {
  Teacher.find(req.query)
    .then(dbModel => res.json(dbModel))
    .catch(err => res.status(422).json(err));
})

router.get('/:id', (req, res) => {
  Teacher.findById(req.params.id)
    .then(dbModel => res.json(dbModel))
    .catch(err => res.status(422).json(err));
})

router.put("/update/:id", async (req, res) => {
  console.log("hit route")
  console.log(req.body)
  const filter = { _id: req.body.id };
  const update = {
    $push: {schedule: [{
      courseName: req.body.courseName,
      sectionNo: req.body.sectionNo
    }]}
  };

  await Teacher.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true // Make this update into an upsert
  });
});
// @route POST api/users/register
// @desc Register user
// @access Public

router.post("/register", (req, res) => {
  // Form validation
  // const { errors, isValid } = validateRegisterInput(req.body);

  // Check validation
  // if (!isValid) {
  //   return res.status(400).json(errors);
  // }
  Teacher.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(403).json({ email: "Email already exists" });
    } else {
      const newTeacher = new Teacher({
        type: req.body.type,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        schedule: [
          {
            courseName: "",
            sectionNo: ""
          }
        ]
      });
      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newTeacher.password, salt, (err, hash) => {
          if (err) throw err;
          newTeacher.password = hash;
          newTeacher
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});



// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation
  console.log(req.body);
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const { email, password } = req.body;

  // Find teacher by email
  Teacher.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }

    // we know we found a teacher with given email
    // now move on to compare password
    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      // [To Do True will need to go back to isMatched]

      // later you'd want this to be: if(isMatch) {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name
        };
        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearerx " + token
            });
          }
        );
      } else {
        return res
          .status(401)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

module.exports = router;