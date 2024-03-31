const { db } = require("../connect");
require("dotenv").config();
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
//
const jwtSecret = "Test@123";
//mongodb Table Name
const logins = db.collection("logins");
const categories = db.collection("categories");
const Food = db.collection("Food");
const deilveryperson = db.collection("deliveryPerson");
const Cart = db.collection("Cart");

//Email For Otp
//smpt mail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mg.sivadondondon@gmail.com",
    pass: "gmgwxsybqtofbflq",
  },
});
//
function SendWelcomeEmail(email, otp) {
  const mailOptions = {
    from: "mg.sivadondondon@gmail.com",
    to: email,
    subject: "Welcome to Pizza Hut",
    text: `Your one time password is ${otp}. Expries in 15 minutes`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(`Error sending email ${email}:`, error?.message);
    } else {
      console.log(`Email sent to ${email}:`, info.response);
    }
  });
}
//resolver
const resolvers = {
  Query: {
    getlogin: async (_, {}, { user }) => {
      try {
        if (!user) {
          throw new Error("No Auth");
        }
        const userdata = await logins.findOne({ uuid: user });
        return userdata;
      } catch (error) {
        throw new Error(error?.message);
      }
    },
    getCats: async (_, args, {}) => {
      try {
        const cats = await categories.find().toArray();
        return cats;
      } catch (error) {
        console.error("Error listing category:", error);
        throw new Error("Failed to list category");
      }
    },
    getAllFoods: async (_, args, {}) => {
      try {
        const Allfood = await Food.find().toArray();
        return Allfood;
      } catch (error) {
        throw new Error("Failed to list category");
      }
    },
    getOneFood: async (_, { _id }, { user }) => {
      try {
        const Allfood = await Food.findOne({
          uuid: user,
          _id: new ObjectId(_id),
        });
        return Allfood;
      } catch (error) {
        throw new Error("Failed to list category");
      }
    },
    getAllPerson: async (_, args, {}) => {
      try {
        const Allperson = await deilveryperson.find().toArray();
        return Allperson;
      } catch (error) {
        throw new Error("Failed to list category");
      }
    },
    getAllorder: async (_, args, {}) => {
      try {
        const Allorder = await Cart.find().sort({ _id: -1 }).toArray();
        return Allorder;
      } catch (error) {
        throw new Error("Failed to list category");
      }
    },
    getOneorder: async (_, args, { user }) => {
      try {
        const Allfood = await Cart.find({
          user: user,
        })
          .sort({ _id: -1 })
          .toArray();
        return Allfood;
      } catch (error) {
        throw new Error("Failed to list category");
      }
    },
  },
  Food: {
    category: async (parent, args, {}) => {
      try {
        const cats = await categories.findOne({
          _id: new ObjectId(parent?.category),
        });
        return cats;
      } catch (error) {
        console.error("Error listing category:", error);
        throw new Error("Failed to list category");
      }
    },
  },
  Orderplaced: {
    user: async (parent, __, {}) => {
      try {
        const cats = await logins.findOne({
          uuid: parent?.user,
        });
        return cats;
      } catch (error) {
        console.error("Error listing category:", error);
        throw new Error("Failed to list category");
      }
    },
    delivery: async (parent, __, {}) => {
      try {
        const cats = await deilveryperson.findOne({
          _id: new ObjectId(parent?.delivery),
        });
        return cats;
      } catch (error) {
        console.error("Error listing category:", error);
        throw new Error("Failed to list category");
      }
    },
  },
  //mutation
  Mutation: {
    onLogin: async (_, args, {}) => {
      const { email, password } = args?.login;
      const result = await logins.findOne({ email: email });
      const pass = result?.password
        ? await bcrypt.compare(password, result?.password)
        : null;
      if (result && pass && result?.status === "CONFIRMED") {
        return jwt.sign({ id: result?.uuid }, jwtSecret, {
          expiresIn: "7d",
        });
      } else if (result && pass && result?.status === "NOT_CONFIRMED") {
        return "User not confirmed";
      } else if (result && !pass) {
        throw new Error("Wrong password");
      } else {
        throw new Error("User not found");
      }
    },
    onSignup: async (_, args, {}) => {
      const uuid = uuidv4();
      const { email, password, name, number } = args?.login;
      const saltRounds = 10;
      try {
        const exists = await logins.findOne({ email: email });
        if (exists?._id) {
          throw new Error("User already exists");
        }
        const hashed = await bcrypt.hash(password, saltRounds);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const Otphash = await bcrypt.hash(otp, saltRounds);
        const token = jwt.sign({ otp }, jwtSecret, {
          expiresIn: "15m",
        });
        const otptoken = { Otphash, token };
        const document = {
          name: name,
          number: number,
          email: email,
          password: hashed,
          uuid: uuid,
          otp: otptoken,
          status: "NOT_CONFIRMED",
          role: "USER",
        };
        const result = await logins.insertOne(document);
        if (result?.insertedId) {
          console.log(result?.insertedId);
          console.log(email);
          SendWelcomeEmail(email, otp);
          return "Done";
        }
      } catch (error) {
        throw new Error(error?.message);
      }
    },
    confirmSignup: async (_, args, {}) => {
      const { email, otp } = args?.login;
      try {
        const result = await logins.findOne({ email: email });
        //console.log(result?.otp?.Otphash, "llll");
        const pass = result?.otp?.Otphash
          ? await bcrypt.compare(otp, result?.otp?.Otphash)
          : null;
        //console.log(pass);
        const verify = jwt.verify(result?.otp?.token, jwtSecret);
        if (!verify) {
          throw new Error("Token Expired");
        }
        // console.log(verify);
        const document = {
          email: result?.email,
          password: result?.password,
          otp: "",
          status: "CONFIRMED",
        };
        if (result?._id && pass) {
          await logins.updateOne({ _id: result?._id }, { $set: document });
          return jwt.sign({ id: result?.uuid }, jwtSecret);
        } else {
          throw new Error("Invalid Code");
        }
      } catch (error) {
        throw new Error(error?.message);
      }
    },
    otpResend: async (_, args, {}) => {
      const { email } = args?.login;
      const saltRounds = 10;
      try {
        const result = await logins.findOne({ email: email });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const Otphash = await bcrypt.hash(otp, saltRounds);
        const token = jwt.sign({ otp }, jwtSecret, {
          expiresIn: "15m",
        });
        const otptoken = { Otphash, token };
        const document = {
          email: result?.email,
          otp: otptoken,
        };
        if (result?._id) {
          await logins.updateOne({ _id: result?._id }, { $set: document });
          //console.log(email);
          SendWelcomeEmail(email, otp);
          return "Done";
        }
      } catch (error) {
        console.log(error);
      }
    },
    passwordOtp: async (_, args, {}) => {
      const { email } = args?.login;
      const saltRounds = 10;
      try {
        const result = await logins.findOne({ email: email });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const Otphash = await bcrypt.hash(otp, saltRounds);
        const token = jwt.sign({ otp }, jwtSecret, {
          expiresIn: "15m",
        });
        const otptoken = { Otphash, token };
        const document = {
          email: result?.email,
          otp: otptoken,
        };
        if (result?._id) {
          await logins.updateOne({ _id: result?._id }, { $set: document });
          // console.log(email);
          SendWelcomeEmail(email, otp);
          return "Done";
        } else {
          throw new Error("User not found");
        }
      } catch (error) {
        throw new Error(error?.message);
      }
    },
    confirmOtp: async (_, args, {}) => {
      const { email, otp } = args?.login;
      // console.log(args, email, otp);
      try {
        const result = await logins.findOne({ email: email });
        //  console.log(result?.otp?.Otphash, "llll", result);
        const pass = result?.otp?.Otphash
          ? await bcrypt.compare(otp, result?.otp?.Otphash)
          : null;
        //  console.log(pass, "ccc");
        const verify = jwt.verify(result?.otp?.token, jwtSecret);
        if (!verify) {
          throw new Error("Token Expired");
        }
        // console.log(verify, "555");
        const document = {
          email: result?.email,
          otp: "",
        };
        if (result?._id && pass) {
          await logins.updateOne({ _id: result?._id }, { $set: document });
          return "Done";
        } else {
          throw new Error("Invalid Code");
        }
      } catch (error) {
        throw new Error(error?.message);
      }
    },
    newPassword: async (_, args, {}) => {
      const { email, password } = args?.login;
      //console.log(args, "fhd", email);
      const saltRounds = 10;
      try {
        const result = await logins.findOne({ email: email });
        const hashed = await bcrypt.hash(password, saltRounds);
        const document = { email: email, password: hashed };
        if (result?._id) {
          await logins.updateOne({ _id: result?._id }, { $set: document });
          return "password successfully updated";
        } else {
          throw new Error("404 Error Occur");
        }
      } catch (error) {
        throw new Error(error?.message);
      }
    },
    addCategory: async (_, args, {}) => {
      const { name } = args?.category;
      try {
        const params = { name };
        const category = await categories.findOne({ name });
        if (category) {
          throw new Error("Category already exsit");
        }
        const vals = await categories.insertOne(params);
        //console.log(vals, "id");
        return vals.insertedId;
      } catch (error) {
        throw new Error(error?.message);
      }
    },
    updateCategory: async (_, args, {}) => {
      const _id = args?._id;
      console.log(_id, "iii");
      try {
        await categories.deleteOne({ _id: new ObjectId(_id) });
        return "done";
      } catch (error) {
        throw new Error(error?.message);
      }
    },
    addFood: async (_, args, {}) => {
      const { name, price, description, image, category, veg } = args?.food;
      try {
        const params = { name, price, description, image, category, veg };
        const Check = await Food.findOne({ name: name });
        if (Check) {
          throw new Error("Already found it");
        }
        const vals = await Food.insertOne(params);
        return vals.insertedId;
      } catch (error) {
        console.log(error);
        throw new Error(error?.message);
      }
    },
    updateFood: async (_, args, {}) => {
      const document = { ...args?.food };
      try {
        await Food.findOneAndUpdate(
          { _id: new ObjectId(args?._id) },
          { $set: document }
        );
        return "Done";
      } catch (error) {
        throw new Error("Already found it");
      }
    },
    deleteFood: async (_, args, {}) => {
      try {
        await Food.deleteOne({ _id: new ObjectId(args?._id) });
        return "Done";
      } catch (error) {
        throw new Error("Already found it");
      }
    },
    addAddress: async (_, args, {}) => {
      const document = { ...args?.login };
      try {
        await logins.findOneAndUpdate({ uuid: args?.uuid }, { $set: document });
        return "Done";
      } catch (error) {
        throw new Error("Already found it");
      }
    },
    addDeliveryperson: async (_, args, {}) => {
      try {
        const params = { ...args?.delivery };
        const Check = await deilveryperson.findOne({ name: params?.name });
        console.log(Check);
        if (Check) {
          throw new Error("Person Already Exist");
        }
        const vals = await deilveryperson.insertOne(params);
        return vals.insertedId;
      } catch (error) {
        console.log(error);
        throw new Error(error?.message);
      }
    },
    updateDeliveryperson: async (_, args, {}) => {
      try {
        await deilveryperson.deleteOne({ _id: new ObjectId(args?._id) });
        return "Done";
      } catch (error) {
        throw new Error("Already found it");
      }
    },
    createOrder: async (_, args, {}) => {
      const currentTime = new Date().toString();
      console.log(currentTime);
      try {
        const params = {
          ...args?.Orderplaced,
          createdAt: currentTime,
          status: "Cooking",
        };
        const vals = await Cart.insertOne(params);
        return vals.insertedId;
      } catch (error) {
        console.log(error);
        throw new Error(error?.message);
      }
    },
    updateOrder: async (_, args, {}) => {
      const document = { ...args?.Orderplaced };
      try {
        await Cart.findOneAndUpdate(
          { _id: new ObjectId(args?._id) },
          { $set: document }
        );
        return "Done";
      } catch (error) {
        throw new Error("Already found it");
      }
    },
  },
};
module.exports = { resolvers };
