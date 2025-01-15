import express from "express"
import cors from "cors"
import "dotenv/config"

const app = express() ;
const port = process.env.PORT || 5000 ;

app.use(cors()) ;
app.use(express.json()) ;

app.get("/" ,( req , res) => {
    res.send("server running") ;
})

app.listen(port , ()=>{
    console.log(`server is open ${port}`);
})