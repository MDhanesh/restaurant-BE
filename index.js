const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { typeDefs } = require("./Schema/typeDefs");
const { resolvers } = require("./Schema/resolvers");
const jwt = require("jsonwebtoken");
//
require("dotenv").config();
const { client } = require("./connect");
//
const jwtSecret = "Test@123";
//
const schema = new ApolloServer({ typeDefs, resolvers });
async function getUser(token) {
  try {
    const user = jwt.verify(token, jwtSecret);
    // console.log(user, "13");
    return user?.id;
  } catch (err) {
    return null;
  }
}
async function startServer() {
  const { url } = await startStandaloneServer(schema, {
    context: async ({ req }) => {
      const token = req.headers.authorization || "";
      //  console.log("mmm", token, "123dddd");
      if (
        req?.body?.operationName === "OtpResend" ||
        req?.body?.operationName === "onLogin" ||
        req?.body?.operationName === "onSignup" ||
        req?.body?.operationName === "confirmSignup" ||
        req?.body?.operationName === "ConfirmOtp" ||
        req?.body?.operationName === "NewPassword" ||
        req?.body?.operationName === "PasswordOtp"
      ) {
        return null;
      } else {
        const user = await getUser(token);
        //console.log(user, "index000");
        if (!user) {
          return {};
        } else {
          return { user: user };
        }
      }
    },
    listen: { port: 4000 },
  });
  await client.connect().then(() => {
    console.log("Mongodb connected");
  });
  console.log(`🚀  Server ready at: ${url}`);
}
startServer();
