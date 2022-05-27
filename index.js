const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config()

const stripe = require("stripe")(process.env.STRIPE_SECRER_KEY)


const port = process.env.PORT || 5000;
// Middle ware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.re66n.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authorizationHead = req.headers.authorization;

  if (!authorizationHead) {
    return res.status(401).send({ message: "Unauthorization access" })
  }
  const token = authorizationHead.split(" ")[1]
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Fobidden access" })
    }
    req.decoded = decoded;
    next()
  });
}
async function run() {
  try {
    await client.connect();
    const productsCollection = client.db("computer-parts").collection("products");
    const purshesCollection = client.db("computer-parts").collection("order");
    const reviewsCollection = client.db("computer-parts").collection("review");
    const userCollection = client.db("computer-parts").collection("user");
    const tokenCollection = client.db("computer-parts").collection("tokenEmail");
    const paymentCollection = client.db("computer-parts").collection("payment");
    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray()
      res.send(result)
    })
    app.get("/orders", verifyJWT,  async (req, res) => {
      const result = await purshesCollection.find().toArray()
      res.send(result)
    })
    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product)
      res.send(result)
    })
   
    app.delete('/products/:id' , async(req , res) =>{
      const id = req.params.id
      const query ={_id : ObjectId(id)}
      const result = await productsCollection.deleteOne(query)
      res.send(result)
    })
    app.get('/products/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await productsCollection.findOne(query)
      res.send(result)
    })
    app.post('/orders', async (req, res) => {
      const purshes = req.body;
      const result = await purshesCollection.insertOne(purshes)
      res.send(result)

    })
    app.get('/orders' , verifyJWT,  async(req , res) =>{
       const email = req.query.email;
       const query = {userEmail : email}      
       const cursor = purshesCollection.find(query)     
       const result = await cursor.toArray()      
       
       res.send(result)
    })
     app.put("/orders/:id", verifyJWT , async(req , res) =>{
       const id = req.params.id
       const payment = req.body       
       const filter = {_id : ObjectId(id)}
       const updateDoc = {
         $set: {
           paid : true,
           transctionId: payment.transctionId
         }
       }
      
       const result = await paymentCollection.insertOne(payment)
       const updateOrders = await purshesCollection.updateOne(filter , updateDoc)
       res.send(updateDoc)
     })
     app.get("/orders/:id", verifyJWT , async(req , res) =>{
       const id = req.params.id
       const query = {_id : ObjectId(id)}
       const result = await purshesCollection.findOne(query)
       res.send(result)
     })
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result)
    })
    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray()
      res.send(result)
    })
    app.post("/create-payment-intent" , verifyJWT , async(req ,  res) =>{
      const service = req.body;
      console.log(service)
      const price = service.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount:amount,
        currency: "usd",
        payment_method_types: [
          "card"
        ]
      });
      res.send({clientSecret: paymentIntent.client_secret})
    
    })
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email }
      const option = { upsert: true }
      const user = req.body;
      const updateDoc = {
        $set: user
      }
      const result = await userCollection.updateOne(filter, updateDoc, option)
      res.send(result)
    })
    app.put('/token/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email }
      const option = { upsert: true }
      const user = req.body;
      const updateDoc = {
        $set: user
      }
      const result = await tokenCollection.updateOne(filter, updateDoc, option)

      var token = jwt.sign({ email }, process.env.ACCESS_SECRET_TOKEN);
      res.send({ token, result })
    })
    app.get('/token', verifyJWT, async (req, res) => {
      const result = await tokenCollection.find().toArray()
      res.send(result)
    })
    app.get('/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await tokenCollection.findOne({ email: email })
      const isAdmin = user.role === "admin";
      res.send(isAdmin)
    })
    app.put('/token/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await tokenCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        const filter = { email }
        const updateDoc = {
          $set: { role: "admin" }
        }
        const result = await tokenCollection.updateOne(filter, updateDoc)
        res.send(result)
      } else {
        res.status(403).send({ message: "Forbidden Access" })
      }

    }
    )
  } finally {

  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Ak computer parts house start')
})

app.listen(port, () => {
  console.log(`Ak computer parts house ${port}`)
})
