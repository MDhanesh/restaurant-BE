const { gql } = require("graphql-tag");

const typeDefs = gql`
  type login {
    _id: String
    name: String
    email: String
    number: String
    uuid: String
    password: String
    otp: String
    status: String
    role: String
    Place: String
    Location: String
  }
  input loginInput {
    name: String
    email: String
    password: String
    number: String
    uuid: String
    otp: String
    status: String
    role: String
    Place: String
    Location: String
  }
  type category {
    _id: String
    name: String
  }
  input categoryInput {
    name: String
  }
  type Food {
    _id: String
    name: String
    price: String
    description: String
    image: String
    category: category
    veg: String
  }
  input foodInput {
    name: String
    price: String
    description: String
    image: String
    category: String
    veg: String
  }
  type delivery {
    _id: String
    name: String
    phone: String
    image: String
  }
  input deliveryInput {
    name: String
    phone: String
    image: String
  }
  type Orderplaced {
    _id: String
    cart: String
    price: String
    user: login
    createdAt: String
    status: String
    delivery: delivery
  }
  input OrderplacedInput {
    cart: String
    price: String
    user: String
    createdAt: String
    status: String
    delivery: String
  }
  type Query {
    login(uuid: String): login
    getlogin(uuid: String): login
    getCats: [category]
    getAllFoods: [Food]
    getOneFood(_id: String): Food
    getAllPerson: [delivery]
    getAllorder: [Orderplaced]
    getOneorder(uuid: String): [Orderplaced]
  }
  type Mutation {
    onSignup(login: loginInput): String
    onLogin(login: loginInput): String
    confirmSignup(login: loginInput): String
    otpResend(login: loginInput): String
    passwordOtp(login: loginInput): String
    confirmOtp(login: loginInput): String
    newPassword(login: loginInput): String
    addCategory(category: categoryInput): String
    updateCategory(_id: String): String
    addFood(food: foodInput): String
    updateFood(_id: String, food: foodInput): String
    deleteFood(_id: String): String
    addAddress(uuid: String, login: loginInput): String
    addDeliveryperson(delivery: deliveryInput): String
    updateDeliveryperson(_id: String): String
    createOrder(Orderplaced: OrderplacedInput): String
    updateOrder(_id: String, Orderplaced: OrderplacedInput): String
  }
`;
module.exports = { typeDefs };
