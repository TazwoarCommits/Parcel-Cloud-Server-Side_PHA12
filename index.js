import express from "express"
import cors from "cors"
import "dotenv/config"
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rvz6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
          
        const parcelsCollection = client.db("parcel-cloud").collection("parcels") ;
        const reviewsCollection = client.db("parcel-cloud").collection("reviews") ;
        const usersCollection = client.db("parcel-cloud").collection("users") ;
        const deliveryMansCollection = client.db("parcel-cloud").collection("delivery-man") ;

        // DeliveryMan related APIs

        app.post("/delivery-man" , async (req , res) => {
            const newUser = req.body ;
            const filter = {email : newUser.email} ; 
            const existingUser = await deliveryMansCollection.findOne(filter) ;
            if(existingUser){
                res.send({message : "user already exist" , insertedId : null})
            }
            else{
                const result = await deliveryMansCollection.insertOne(newUser) ;
                res.send(result) ;
            }
        }) ;

        app.get("/delivery-man" , async (req , res) => {
            const result = await deliveryMansCollection.find().toArray() ;
            res.send(result) ;
        })

        app.get("/delivery-man/:email" , async (req , res) => {
            const email = req.params.email ;
            const filter = {email : email} ;
            const result = await deliveryMansCollection.findOne(filter) ;
            res.send(result);
        })

        

        // users related APIs

        app.get("/users" , async (req , res) => {
               const result = await usersCollection.find().toArray() ;
               res.send(result) ;
        }) ;

        // app.get("/users/admin/:email" , async (req, res) => {
        //     const email = req.params.email ; 
        //     const filter = {email : email} ;
        //     const user = await usersCollection.findOne(filter) ; 

        //     let admin = false ;
        //     if(user) {
        //         admin = user?.role ==="admin"
        //     } 
        //     // console.log(admin);
        //     res.send(admin);
        // })

        app.get("/users/:email" , async (req , res) => {
            const email = req.params.email ; 
            const filter = {email : email} ; 
            const result = await usersCollection.findOne(filter) ;
            // console.log(result , filter);
            res.send(result) ;
        })

        app.patch("/users/:id" , async( req , res) => {
            const updatedInfo = req.body ;
            const id = req.params.id ; 
            const filter = {_id : new ObjectId(id)} ; 
            // console.log(updatedInfo , filter , id) ;
            const updatedDoc = {
                $set : {
                    name : updatedInfo.updatedName ,
                    photo : updatedInfo.updatedPhoto
                }
            }

            const result = await usersCollection.updateOne(filter , updatedDoc ) ;
            res.send(result)
        })

        app.post("/users" , async (req , res) => {
            const newUser = req.body ;
            const filter = {email : newUser.email} ; 
            const existingUser = await usersCollection.findOne(filter) ;
            if(existingUser){
                res.send({message : "user already exist" , insertedId : null})
            }
            else{
                const result = await usersCollection.insertOne(newUser) ;
                res.send(result) ;
            }
        })

        // Parcels related APIs 

        app.post("/parcels" , async (req , res) => {
            const newParcel ={... req.body , createdAt : new Date() }; 
            const result = await parcelsCollection.insertOne(newParcel) ;
            res.send(result) ; 
        })

        app.get("/parcels" , async (req , res) => {
            const email = req.query.email ;
            const filter = {email : email} ;
            const result = await parcelsCollection.find(filter).toArray() ;
            res.send(result) ;

        })

        app.get("/parcels/:id" , async (req , res) => {
            const id = req.params.id ;
            const filter = {_id : new ObjectId(id)} ; 
            const result = await parcelsCollection.findOne(filter);
            res.send(result) ;
        })

        app.patch("/parcels/:id" , async( req , res) => {
            const id = req.params.id ;
            const item = req.body ; 
            const filter = {_id : new ObjectId(id)} ;
            const updatedDoc = {
                $set : {
                   phone : item.phone ,
                   parcel_type : item.parcel_type,
                   weight : item.weight,
                   receivers_name : item.receivers_name,
                   receivers_phone: item.receivers_phone,
                   delivery_address: item.delivery_address,
                   requested_date: item.requested_date,
                   delivery_latitude : item.delivery_latitude,
                   delivery_longitude: item.delivery_longitude,
                   cost : item.cost ,
                }
            }
            const result = await parcelsCollection.updateOne(filter , updatedDoc) ;
            res.send(result)
        })

        app.delete("/parcels/:id" , async (req , res) => {
            const id = req.params.id ; 
            const filter = {_id : new ObjectId(id)} ;
            const result = await parcelsCollection.deleteOne(filter) ;
            res.send(result)
        })

        // reviews related APIs

        app.post("/reviews" , async (req , res) => {
            const review = req.body ;
            const result = await reviewsCollection.insertOne(review);
            res.send(result) ;
        }) ;

        app.get("/reviews/:id" , async (req , res) => {
            const id = req.params.id ;
            const filter = { deliveryManId : id } ;
            const result = await reviewsCollection.find(filter).toArray() ;
            res.send(result) ;
        }) ;




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("server running");
})

app.listen(port, () => {
    console.log(`server is open ${port}`);
})