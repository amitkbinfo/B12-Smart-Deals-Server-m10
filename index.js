const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
// console.log(process.env);

// Middlewares
app.use(cors());
app.use(express.json());

// Secure via Firebase SDK

// index.js
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFirebaseToken = async(req, res, next) => {
    const authorization = req.headers.authorization;

    if(!authorization) {
        return res.status(401).send({message: "Unauthorized Access!"});
    }
    const token = authorization.split(" ")[1];

    if(!token) {
        return res.status(401).send({message: "Unauthorized Access!"});
    }

    try{
        const decoded = await admin.auth().verifyIdToken(token);
        console.log("After DECODED", decoded);
        req.token_email = decoded.email;
        next();
    }
    catch{
        return res.status(401).send({message: "Unauthorized Access!"});
    }
}



















// const verifyFirebaseToken = async (req, res, next) => {
//     // console.log("Inside the Middleware",req.headers);
//     const authorization = req.headers.authorization;
//     if(!authorization) {
//         return res.status(401).send({message: "Unauthorized Access!"});
//     }
//     const token = req.headers.authorization.split(" ")[1];
//     if(!token) {
//         return res.status(401).send({message: "Unauthorized Access!"});
//     }

//     // verify token
//     try{
//         const decoded = await admin.auth().verifyIdToken(token);
//         // console.log("Decoded Info", decoded);
//         req.token_email = decoded.email;
//         next();
//     }
//     catch{
//         return res.status(401).send({message: "Unauthorized Access!"});
//     }
// }

// const verifyFirebaseToken = async (req, res, next) => {
//   if (!req.headers.authorization) {
//     return res.status(401).send({ message: "Unauthorized Access!" });
//   }

//   const token = req.headers.authorization.split(" ")[1];
//   if (!token) {
//     return res.status(401).send({ message: "Unauthorized Access!" });
//   }

//   try {
//     // const userInfo = await admin.auth().verifyIdToken(token);
//     const userInfo = await admin.auth().verifyIdToken(token);
//     req.token_email = userInfo.email;
//     // console.log("User Info", userInfo);
//     next();
//   } catch {
//     return res.status(401).send({ message: "Unauthorized Access!" });
//   }
// };



// JWT Token
// const verifyJWTToken = (req, res, next) => {
//     const authorization = req.headers.authorization;
//     if(!authorization) {
//         return res.status(401).send({message: "Unauthorized Access!"});
//     }

//     const token = req.headers.authorization.split(" ")[1];
//     if(!token) {
//         return res.status(401).send({message: "Unauthorized Access!"});
//     }
//     next()
// }





app.get("/", (req, res) => {
  res.send("Smart Deals is running...");
});

// MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.i9wlk8b.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    // Products DB
    const smartDeals = client.db("smartDB");
    const productsCollection = smartDeals.collection("products");
    const usersCollection = smartDeals.collection("users");
    const bidsCollection = smartDeals.collection("bids");

    // JWT token 
    // app.post("/getToken", (req, res) => {
    //     const loggedUser = req.body;
    //     const token = jwt.sign(loggedUser, process.env.JWT_SECRET, {expiresIn: "9h"});
    //     res.send({token: token});
    // })
    
    // PRODUCTS APIs
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });
    app.post("/products", verifyFirebaseToken, async (req, res) => {
        // console.log("headers in the post" ,req.headers);
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });
    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const query = { _id: new ObjectId(id) };
      const updateProduct = {
        $set: {
          name: updatedProduct.name,
          price: updatedProduct.price,
        },
      };
      const options = {};
      const result = await productsCollection.updateOne(
        query,
        updateProduct,
        options,
      );
      res.send(result);
    });
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // USERS APIs
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedUser = req.body;
      const updateUser = {
        $set: {
          name: updatedUser.name,
          email: updatedUser.email,
        },
      };
      const options = {};
      const result = await usersCollection.updateOne(
        query,
        updateUser,
        options,
      );
      res.send(result);
    });
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // Latest Products
    app.get("/latest-products", async (req, res) => {
      const cursor = productsCollection
        .find()
        .sort({ created_at: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Bids APIs
    // app.get("/bids", async(req, res) => {
    //     const cursor = bidsCollection.find();
    //     const result = await cursor.toArray();
    //     res.send(result);
    // })
    // get by email
    app.get("/bids", verifyFirebaseToken,  async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        if(email !== req.token_email) {
            return res.status(403).send({message: "Forbidden Access!"});
        }
        query.buyer_email = email;
      }
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // specific product bid
    app.get("/products/bids/:productId", async (req, res) => {
      const productId = req.params.productId;
      const query = { product: productId };
      const cursor = bidsCollection.find(query).sort({ bid_price: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/bids", async (req, res) => {
      const newBid = req.body;
      const result = await bidsCollection.insertOne(newBid);
      res.send(result);
    });

    app.delete("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bidsCollection.deleteOne(query);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!",
    // );
  } finally {
    // client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Smart Deals is running on port : ${port}`);
});
