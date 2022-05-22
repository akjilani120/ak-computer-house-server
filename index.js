const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
// Middle ware
app.use(cors())
// app.use(express.json)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.re66n.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
  console.log("it is ok")
    try{
        await client.connect();
        const productsCollection = client.db("computer-parts").collection("products");
        app.get("/products", async(req , res) =>{
            const result = await productsCollection.find().toArray()
            res.send(result)
        })
        app.get('/products/:id', async(req , res) =>{
          const id = req.params.id;
          const query = { _id : ObjectId(id)}
          const result = await productsCollection.findOne(query)
          res.send(result)
        })
    }finally{

    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Ak computer parts house start')
})

app.listen(port, () => {
  console.log(`Ak computer parts house ${port}`)
})
