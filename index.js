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



        // // ================================== DeliveryMan related APIs =======================================



        // Fetching all deliveryMen Only by Admin 

        app.get("/delivery-man" , async (req , res) => {
            const result = await deliveryMansCollection.find().toArray() ;
            res.send(result) ;
        })

        // register as an user for anyone

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

        // For updating an users role from user to deliveryman

        app.post("/delivery-man/admin" , async (req , res) => {
            const newUser = req.body ;
            const filter = {email : newUser.email} ; 
            const existingUser = await deliveryMansCollection.findOne(filter) ;
            if(existingUser){
                res.send({message : "user already exist" , insertedId : null})
            }
            else{
                const result = await deliveryMansCollection.insertOne(newUser) ;
                // console.log(result);
                res.send(result) ;
            }
        }) ;


        // fetching user to determine the role

        app.get("/delivery-man/:email" , async (req , res) => {
            const email = req.params.email ;
            const filter = {email : email} ;
            const result = await deliveryMansCollection.findOne(filter) ;
            res.send(result);
        })

        


         // // ======================================= Users related APIs ============================ // // ;



        //  getting all users by only Admin

        app.get("/users" , async (req , res) => {
               const result = await usersCollection.find().toArray() ;
               res.send(result) ;
        }) ;


        // Fetching a User's Data to specify the role of that user in this app

        app.get("/users/:email" , async (req , res) => {
            const email = req.params.email ; 
            const filter = {email : email} ; 
            const result = await usersCollection.findOne(filter) ;
            // console.log(result , filter);
            res.send(result) ;
        })

        // updating a users profile Only By Users

        app.patch("/users/:id" , async (req , res) => {
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

        // Updating a users role to a admin Only By Admin

        app.patch("/users/admin/:id" , async (req , res) => {
            const id = req.params.id ;
            const filter = { _id : new ObjectId(id) } ;
            const updatedDoc = {
                $set : {
                    role : "admin"
                }
            }
            const result = await usersCollection.updateOne(filter , updatedDoc) ;
            res.send(result) ;
        })

        // register for anyone

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

        // deleting an user to update role into deliveryman since it has separate collections 

        app.delete("/users/admin/:id" , async(req , res) => {
            const id = req.params.id ;
            const filter = { _id : new ObjectId(id)} ;
            const result = await usersCollection.deleteOne(filter) ; 
            // console.log( "delete user ",result);
            res.send(result);
        })



        // //================================== Parcels related APIs =============================== // // ;



        // Add a new parcel in database by User

        app.post("/parcels" , async (req , res) => {
            const newParcel ={... req.body , createdAt : new Date() }; 
            const result = await parcelsCollection.insertOne(newParcel) ;
            res.send(result) ; 
        })

        // Fetching a users parcel only by the user

        app.get("/parcels/user" , async (req , res) => {
            const email = req.query.email ;
            const filter = {email : email} ;
            const result = await parcelsCollection.find(filter).toArray() ;
            // console.log(result);
            res.send(result) ;

        }) 


        // Getting a Parcel for details or to update only by the user

        app.get("/parcels/:id" , async (req , res) => {
            const id = req.params.id ;
            const filter = {_id : new ObjectId(id)} ; 
            const result = await parcelsCollection.findOne(filter);
            res.send(result) ;
        }) ;


        // update a parcel by user Only

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
            res.send(result) ;

        }) ;


          // Cancel A parcel by User Only

          app.delete("/parcels/:id" , async (req , res) => {
            const id = req.params.id ; 
            const filter = {_id : new ObjectId(id)} ;
            const result = await parcelsCollection.deleteOne(filter) ;
            res.send(result) ;
        });


        // getting all parcels by Admin
        
        app.get("/parcels" , async (req , res) => {
            const result = await parcelsCollection.find().sort({createdAt : -1}).toArray() ;
            res.send(result) ;
        }) ;

         // Update a parcels status and assigning deliveryman and approximate date 

         app.patch("/parcels/admin/:id" , async (req , res) => {
            const id = req.params.id ;
            const item = req.body ;
            const filter = {_id : new ObjectId(id)} ;
            const updatedDoc = {
                $set : {
                    status : "in-transit",
                    deliveryManId : item.deliveryManId ,
                    approximateDeliveryDate : item.approx_del_date ,
                }
            }

            const result = await parcelsCollection.updateOne(filter, updatedDoc) ;
            res.send(result) ;
        }) ;


        // deliveryman fetching parcels assigned to him by Admin

        app.get("/parcels/myList/:id" , async( req , res) => {
            const id = req.params.id ; 
            const filter = { deliveryManId : id} ;
            const result = await parcelsCollection.find(filter).toArray() ;
            // console.log(result);
            res.send(result) ;

        }) ;


        // delivery man updating status if it is delivered or cancelled {{{{ TODO : UPDATE DELIVERYMANS DELIVERYCOUNT  }}}}

        app.patch("/parcels/delivery/:id" , async (req , res) => {
            const id = req.params.id ;
            const updatedStatus = req.body ;
            console.log(updatedStatus.newStatus);
            const filter = {_id : new ObjectId(id)}
            const updatedDoc = {
                $set : {
                    status : updatedStatus.newStatus ,
                }
            }
            // if(updatedStatus.newStatus === "delivered"){
            // }
            const result = await parcelsCollection.updateOne(filter , updatedDoc);
            res.send(result)
        })


        // // ========================================== Reviews related APIs ================================== // // ;



        // review of a delivery by a user Only 
 
        app.post("/reviews" , async (req , res) => {
            const review = req.body ;
            const result = await reviewsCollection.insertOne(review);
            res.send(result) ;
        }) ;

        // Fetching reviews of a deliveryMan's only By the deliveryMan

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