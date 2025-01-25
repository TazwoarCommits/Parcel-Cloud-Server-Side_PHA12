import express from "express"
import cors from "cors"
import "dotenv/config"
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import Stripe from "stripe";
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY) ; 
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

        const parcelsCollection = client.db("parcel-cloud").collection("parcels");
        const reviewsCollection = client.db("parcel-cloud").collection("reviews");
        const usersCollection = client.db("parcel-cloud").collection("users");
        const deliveryMansCollection = client.db("parcel-cloud").collection("delivery-man");

    
         // // ================================== Access TOken APIs  =======================================

         app.post("/jwt" , async (req , res) => {
            const user = req.body ; 
            const token = jwt.sign (user , process.env.ACCESS_TOKEN_SECRET , {expiresIn : "2h"})
            res.send({token})
         })


        //  verify token

         const verifyTOken = (req , res , next) => {
            console.log(req.headers.authorization) ; 
            if(!req.headers.authorization){
                return res.status(401).send({message : "Unauthorized Access"});
            }
            const token = req.headers.authorization.split(" ")[1] ;
            console.log(token)
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET , (err,decoded) => {
                if(err){
                    return res.status(401).send({message : "Unauthorized Access" })
                }
                req.decoded = decoded ;
                next() ;
            }) 
          
        } ;




        // // ================================== DeliveryMan related APIs =======================================



        // Fetching all deliveryMen Only by Admin 

        app.get("/delivery-man", verifyTOken, async (req, res) => {
            const result = await deliveryMansCollection.find().toArray();
            res.send(result);
        })

        // register as an user for anyone (universal)

        app.post("/delivery-man", async (req, res) => {
            const newUser = req.body;
            const filter = { email: newUser.email };
            const existingUser = await deliveryMansCollection.findOne(filter);
            if (existingUser) {
                res.send({ message: "user already exist", insertedId: null })
            }
            else {
                const result = await deliveryMansCollection.insertOne(newUser);
                res.send(result);
            }
        });

        // For updating an users role from user to deliveryman by Admin

        app.post("/delivery-man/admin", verifyTOken, async (req, res) => {
            const newUser = req.body;
            const filter = { email: newUser.email };
            const existingUser = await deliveryMansCollection.findOne(filter);
            if (existingUser) {
                res.send({ message: "user already exist", insertedId: null })
            }
            else {
                const result = await deliveryMansCollection.insertOne(newUser);
                // console.log(result);
                res.send(result);
            }
        });


        // fetching user to determine the role by useUSer() hook

        app.get("/delivery-man/:email", verifyTOken, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await deliveryMansCollection.findOne(filter);
            res.send(result);
        })




        // // ======================================= Users related APIs ============================ // // ;



        //  getting all users by only Admin with pagination

        app.get("/users", verifyTOken, async (req, res) => {
            const page = parseInt(req.query.page);
            const limit = parseInt(req.query.limit);
            const skip = page * limit;
            const result = await usersCollection.find().skip(skip).limit(limit).toArray();
            res.send(result);
        });


        // getting all usersCount by only Admin fot pagination

        app.get("/usersCount", verifyTOken, async (req, res) => {
            const count = await usersCollection.estimatedDocumentCount();
            res.send({ count }); //we have to send count data as an object else it will crash
        })


        // Fetching a User's Data to specify the role of that user in this app

        app.get("/users/:email", verifyTOken, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await usersCollection.findOne(filter);
            // console.log(result , filter);
            res.send(result);
        })

        // updating a users profile Only By User

        app.patch("/users/:id", verifyTOken, async (req, res) => {
            const updatedInfo = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            // console.log(updatedInfo , filter , id) ;
            const updatedDoc = {
                $set: {
                    name: updatedInfo.updatedName,
                    photo: updatedInfo.updatedPhoto
                }
            }

            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })

        // Updating a users role to a admin Only By Admin

        app.patch("/users/admin/:id", verifyTOken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: "admin"
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // registration for anyone (universal)

        app.post("/users", async (req, res) => {
            const newUser = req.body;
            const filter = { email: newUser.email };
            const existingUser = await usersCollection.findOne(filter);
            if (existingUser) {
                res.send({ message: "user already exist", insertedId: null })
            }
            else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }
        })

        // deleting an user to update role into deliveryman since it has separate collections 

        app.delete("/users/admin/:id", verifyTOken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            // console.log( "delete user ",result);
            res.send(result);
        })



        // //================================== Parcels related APIs =============================== // // ;



        // Add a new parcel in database by User

        app.post("/parcels", verifyTOken, async (req, res) => {
            const newParcel = { ...req.body, createdAt: new Date() };
            const filter = { email: newParcel.email };
            const result = await parcelsCollection.insertOne(newParcel);
            if (result.insertedId) {
                const user = await usersCollection.findOne(filter);
                const updatedDoc = {
                    $set: {
                        totalBookedParcel: user.totalBookedParcel + 1
                    }
                }
                const updatedUser = await usersCollection.updateOne(filter, updatedDoc)
            }
            res.send(result);
        })

        // Fetching a users parcel only by the user

        app.get("/parcels/user", verifyTOken, async (req, res) => {
            const email = req.query.email;
            const filter = { email: email };
            const result = await parcelsCollection.find(filter).toArray();
            // console.log(result);
            res.send(result);

        })


        // Getting a Parcel for details or to update only by the user

        app.get("/parcels/:id", verifyTOken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await parcelsCollection.findOne(filter);
            res.send(result);
        });


        // update a parcel by user Only

        app.patch("/parcels/:id", verifyTOken ,async (req, res) => {
            const id = req.params.id;
            const item = req.body;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    phone: item.phone,
                    parcel_type: item.parcel_type,
                    weight: item.weight,
                    receivers_name: item.receivers_name,
                    receivers_phone: item.receivers_phone,
                    delivery_address: item.delivery_address,
                    requested_date: item.requested_date,
                    delivery_latitude: item.delivery_latitude,
                    delivery_longitude: item.delivery_longitude,
                    cost: item.cost,
                }
            }
            const result = await parcelsCollection.updateOne(filter, updatedDoc);
            res.send(result);

        });


        // Cancel A parcel by User Only

        app.delete("/parcels/:id", verifyTOken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await parcelsCollection.deleteOne(filter);
            res.send(result);
        });


        // getting all parcels by Admin

        app.get("/parcels", verifyTOken , async (req, res) => {
            const sortStart = req.query?.sortStart;
            const sortEnd = req.query?.sortEnd;
            let sortQuery = {};
            if (sortStart && sortEnd) {
                sortQuery = {
                    ...sortQuery,
                    createdAt: { $gte: new Date(sortStart), $lte: new Date(sortEnd) }
                }
            }

            const result = await parcelsCollection.find(sortQuery).sort({ createdAt: -1 }).toArray();
            res.send(result);
        });

        // Update a parcels status and assigning deliveryman and approximate date 

        app.patch("/parcels/admin/:id", async (req, res) => {
            const id = req.params.id;
            const item = req.body;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: "in-transit",
                    deliveryManId: item.deliveryManId,
                    approximateDeliveryDate: item.approx_del_date,
                }
            }

            const result = await parcelsCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });


        // deliveryman fetching parcels assigned to him by Admin

        app.get("/parcels/myList/:id", verifyTOken, async (req, res) => {
            const id = req.params.id;
            const filter = { deliveryManId: id };
            const result = await parcelsCollection.find(filter).toArray();
            // console.log(result);
            res.send(result);

        });


        // delivery man updating status if it is delivered or cancelled {{{{ TODO : UPDATE DELIVERYMANS DELIVERYCOUNT  }}}}

        app.patch("/parcels/delivery/:id",verifyTOken, async (req, res) => {
            const id = req.params.id;
            const updatedStatus = req.body;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: updatedStatus.newStatus,
                }
            }
            if (updatedStatus.newStatus === "delivered") {
                const query = { _id: new ObjectId(updatedStatus.deliverymanId) }
                const deliveryman = await deliveryMansCollection.findOne(query)
                const updatedDeliveryCount = {
                    $set: {
                        delivered: deliveryman.delivered + 1,
                    }
                }

                const updateResult = await deliveryMansCollection.updateOne(query, updatedDeliveryCount)
            }
            const result = await parcelsCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })


        // // ========================================== Reviews related APIs ================================== // // 



        // review of a delivery by a user Only 

        app.post("/reviews", verifyTOken, async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            if (result.insertedId) {
                const filter = { _id: new ObjectId(review.deliveryManId) };
                const deliveryman = await deliveryMansCollection.findOne(filter);
                const newReviewCount = deliveryman.reviewCount + 1;
                const newRating = (deliveryman.review * deliveryman.reviewCount + review.rating) / newReviewCount;
                const updatedDoc = {
                    $set: {
                        review: parseFloat(newRating).toFixed(2),
                        reviewCount: newReviewCount
                    }
                }
                const updatedResult = await deliveryMansCollection.updateOne(filter, updatedDoc);
                // console.log(updatedResult);
            }
            res.send(result);
        });

        // Fetching reviews of a deliveryMan's only By the deliveryMan

        app.get("/reviews/:id", verifyTOken, async (req, res) => {
            const id = req.params.id;
            const filter = { deliveryManId: id };
            const result = await reviewsCollection.find(filter).sort({ createdAt: -1 }).toArray();
            res.send(result);
        });

        // // ========================================== Stats related APIs ================================== // // 

        // fetching data for admin dashboard only by Admin

        app.get("/admin/statistic", verifyTOken, async (req, res) => {
            const parcels = await parcelsCollection.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%m-%d-%Y", date: "$createdAt" } },
                        totalBooked: { $sum: 1 },
                        totalDelivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
                    },
                },
                { $sort: { _id: 1 } },

            ]).toArray()
            res.send(parcels);
        });

        // fetching total stats of users , parcels , delivered parcels for home page (Universal)

        app.get("/home/stats", async (req, res) => {
            const parcels = await parcelsCollection.estimatedDocumentCount();
            const users = await usersCollection.estimatedDocumentCount();
            const delivered = await parcelsCollection.countDocuments({ status: "delivered" });
            res.send({ parcels, users, delivered });
        });


        // fetching top deliverymen for home page (Universal)

        app.get("/top-deliveryman", async (req, res) => {
            const data = await deliveryMansCollection.find().toArray();
            const sortedData = data.sort((a, b) => {
                if (a.delivered === b.delivered) {                           //if delivery count is Equal go for review
                    return parseFloat(a.review) - parseFloat(b.review);       
                }

                return b.delivered - a.delivered;
            })
            const topDeliveryMen = sortedData.slice(0 , 3) ;

            res.send(topDeliveryMen) ;
        })

        // // ================================== Stripe related APIs ================================== // // 

        // Payment Intent 

        app.post("/create-payment-intent" ,verifyTOken, async (req , res) => {
            const {amount} = req.body ;
            if (!amount || isNaN(amount) || amount <= 0) {   //it will crash if not for this 
                return res.status(400).send({ error: "Invalid or missing price. Must be greater than zero." });
              }
            const amountinCents = parseInt(amount*100) ;
            // console.log(amountinCents);
            // console.log(amountinCents , "amount Inside the intent")
            const paymentIntent = await stripe.paymentIntents.create({
                amount : amountinCents ,
                currency : "usd",
                payment_method_types: ["card"] ,
            })

            res.send({
                clientSecret : paymentIntent.client_secret
            })
        })
       


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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