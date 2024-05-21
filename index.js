const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT||5000;

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER_BOSS}:${process.env.DB_KEY_BOSS}@cluster0.2lcaz14.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    const menuCollection = client.db("bossDB").collection("menu");
    const reviewsCollection = client.db("bossDB").collection("reviews");
    const cartsCollection = client.db("bossDB").collection("carts");
    //for menu
  app.get('/menu',async(req,res)=>{
    const result = await menuCollection.find().toArray()
    res.send(result)

  })

  //for review

  app.get('/reviews',async(req,res)=>{
    const result = await reviewsCollection.find().toArray()
    res.send(result)

  })
 app.get('/carts', async(req,res)=>{
    const email = req.query.email;
    const query = {email :email};
    const result = await cartsCollection.find(query).toArray();
    res.send(result)
  })

  //carts collection
  app.post('/carts', async(req,res)=>{
    const cartItem = req.body
    const result = await cartsCollection.insertOne(cartItem);
    res.send(result)
  })

  //delete cart item
  app.delete('/carts/:id',async(req,res)=>{
    const id = req.params.id
    const query = {_id:new ObjectId(id)}
    const result = await cartsCollection.deleteOne(query)
    res.send(result) 

  })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('boss is sitting')
})

app.listen(port,()=>{
    console.log(`bistro boss in running on port ${port}`);
})





/**
 * --------------------------------------------------------
 * Naming Convention
 * --------------------------------------------------------
 * app.get('/users)
 * app.get('/usert/:id)
 * app.post('/users)
 * app.put('/users/:id)
 * app.patch('/users/:id)
 * app.delete('/users/:id)
 */