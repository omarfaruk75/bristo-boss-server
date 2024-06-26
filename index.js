const express = require('express');
const app = express();
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cors = require('cors');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
    const paymentsCollection = client.db("bossDB").collection("payments");
    
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
    
    
    
    
    
    //for menu get
  app.get('/menu',async(req,res)=>{
    const result = await menuCollection.find().toArray()
    res.send(result)

  })
    //for single  menu get
  app.get('/menu/:id',async(req,res)=>{
    const id=req.params.id;
    // const query={_id:new ObjectId(id)}
    const query={_id: id}
    const result = await menuCollection.findOne(query);
    console.log(result);
    res.send(result)

  })
    
    //for menu post
  app.post('/menu',async(req,res)=>{
    const item = req.body;
    const result = await menuCollection.insertOne(item);
    res.send(result)
  })
app.patch('/menu/:id',async(req,res)=>{
  const item=req.body;
  const id=req.params.id;
  // const query={_id:new ObjectId(id)}
  const query={_id: id}
  const updatedDoc={
    $set:{
      name:item.name,
      recipe:item.recipe,
      price:item.price,
      category:item.category,
      image:item.image

    }
  }
  const result=await menuCollection.updateOne(query,updatedDoc);
  res.send(result);
})

app.delete('/menu/:id',verifyToken,verifyAdmin,async(req,res)=>{
  const id=req.params.id;
  const query={_id:new ObjectId(id)}
  const result=await menuCollection.deleteOne(query);
  res.send(result);
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
//
 app.post("/create-payment-intent", async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price*100)
  console.log(amount);
  const paymentIntent = await stripe.paymentIntents.create({
    amount:amount,
    currency:'usd',
    payment_method_types: ["card" ],
  })
    res.send({clientSecret: paymentIntent.client_secret})
  });
app.get('/payments/:email',verifyToken,async(req,res)=>{
  const query={email:req.params.email}
  if(req.params.email!==req.decoded.email){
    return res.status(403).send({message: 'forbidden access'})
  }
  const result = await paymentsCollection.find(query).toArray()
  res.send(result)
})

//
app.post('/payments',async(req,res)=>{
  const payment=req.body;
  const paymentsResult= await paymentsCollection.insertOne(payment);
  //carefully delete each item from the cart
console.log('payment info', payment);
const query={_id:{
  $in: payment.cartIds.map(id => new ObjectId(id))
}};
const deleteResult = await cartsCollection.deleteMany(query )
res.send({paymentsResult,deleteResult})
})

//stats or analytics

app.get('/admin-stats',verifyToken,verifyAdmin,async(req,res)=>{
  const users=await userCollection.estimatedDocumentCount();
  const menuItems=await menuCollection.estimatedDocumentCount();
  const orders=await paymentsCollection.estimatedDocumentCount();
  //this is the not best way
  // const payments = await paymentsCollection.find().toArray();
  // const revenue= payments.reduce((total,payment)=>total+payment.price,0)

  const result = await paymentsCollection.aggregate([
    {
      $group:{
        _id:null,
        totalRevenue:{
          $sum:'$price'
        }
      }
    }
  ]).toArray();
  const revenue = result.length>0?result[0].totalRevenue:0;
  res.send({users,menuItems,orders,revenue});
})

//to use aggregate pipeline
app.get('/order-stats',verifyToken,verifyAdmin,async(req,res)=>{
  const result=await paymentsCollection.aggregate([
   { $unwind : '$menuItemIds'},
   {
    $lookup:{
      from:'menu',
      localField:'menuItemIds',
      foreignField:"_id",
      as:'menuItems'
    }
   },
   
    { $unwind : '$menuItems'},
    {
      $group:{
        _id:'$menuItems.category',
        quantity:{
          $sum:1
        },
        revenue:{
          $sum:'$menuItems.price'
        }
      }
    },
    {
      $project:{
        _id:0,
        category:'$_id',
        quantity:'$quantity',
        revenue:'$revenue'
      }
    }
  ]).toArray();
  res.send(result);
})

    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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