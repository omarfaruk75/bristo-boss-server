const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
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
    const userCollection = client.db("bossDB").collection("users");
    const reviewsCollection = client.db("bossDB").collection("reviews");
    const cartsCollection = client.db("bossDB").collection("carts");
    
    //jwt related api
    app.post('/jwt',async(req,res)=>{
      const user=req.body;
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'1h'});
        res.send({token});
    })
    
    //middleware
    const verifyToken=(req,res,next)=>{
    //  console.log('inside middleware',req.headers.authorization);
     if(!req.headers.authorization){
      return res.status(401).send({message:'unauthorized access'})
     }
     const token= req.headers.authorization.split(' ')[1];
     jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
      if(err){
        return res.status(401).send({message:'unauthorized access'})
      }
      req.decoded = decoded;
      next();
     })
    }
    
    const verifyAdmin=async(req,res,next)=>{
      // use verify admin after verify token
      const email=req.decoded.email;
      const query={email:email}
      const user=await userCollection.findOne(query);
      const isAdmin= user?.role==='admin';
      if(!isAdmin){
        return res.status(403).send({message:'forbidden access'})
      }
      next();
    }
    
    
    
    
    
    //for menu
  app.get('/menu',async(req,res)=>{
    const result = await menuCollection.find().toArray()
    res.send(result)

  })




// all users related api
app.get('/users',verifyToken,verifyAdmin, async(req,res)=>{
  const result = await userCollection.find().toArray()
  res.send(result);
})

app.get('/user/admin/:email',verifyToken, async(req,res)=>{
  const email=req.params.email;
  if(email !== req.decoded.email){
    return res.status(403).send({message:'unauthorized access'})
  }
const query={email:email}
const user=await userCollection.findOne(query);
let admin=false;
if(user){
  admin=user.role==='admin';
}
res.send({admin}) 
})
  //user related api
app.post('/users',async(req,res)=>{
  const user= req.body;
  const query={email: user.email}
  const existingUser = await userCollection.findOne(query);
  if(existingUser){
    return res.send({message: 'user already exists', insertedId: null})
  }
const result= await userCollection.insertOne(user);
 res.send(result)
})

app.patch('/users/admin/:id',verifyToken, verifyAdmin, async(req,res)=>{
  const id= req.params.id;
  const query = {_id: new ObjectId(id)}
  const updatedDoc={
    $set:{
      role:'admin'
    }
  }

  const result= await userCollection.updateOne(query,updatedDoc);
  res.send(result);
})
//delete user related api
app.delete('/users/:id',verifyToken,verifyAdmin, async(req,res)=>{
  const id=req.params.id;
  query={_id: new ObjectId(id)}
  const result=await userCollection.deleteOne(query);
  res.send(result);
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