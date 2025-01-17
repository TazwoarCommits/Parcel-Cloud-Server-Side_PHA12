import express from "express"
import cors from "cors"
import "dotenv/config"
import { MongoClient, ServerApiVersion } from "mongodb";

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
        const usersCollection = client.db("parcel-cloud").collection("users") ;
        const deliveryMansCollection = client.db("parcel-cloud").collection("delivery-man") ;

        // DeliverMan related APIs

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

        // users related APIs

        app.get("/users" , async (req , res) => {
               const result = await usersCollection.find().toArray() ;
               res.send(result) ;
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