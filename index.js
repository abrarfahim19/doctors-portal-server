const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare
app.use(cors());
app.use(express.json());

// Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ehupb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try {
        await client.connect();

        const serviceCollection = client.db("doctors_portal").collection("service");
        const bookingCollection = client.db("doctors_portal").collection("booking");
        
        /**
         * app.get('/route') /to get all/some/one by filter
         * app.post('/route') /to add one or multiple item
         * app.get('/route/:id') /to get one perticular ID
         * app.patch('/route/:id') /update one perticular ID
         * app.delete('/route/:id') /delete on perticular ID
        */

        // Get All Services
        app.get('/service', async (req, res)=>{
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.post('/booking', async (req,res)=>{
          const booking = req.body;
          const query = {treatmentName:booking.treatmentName, date:booking.date, email:booking.email}
          const exists = await bookingCollection.findOne(query);
          if (exists){
            return res.send({success: false, booking:exists})
          }
          else{
            const result = await bookingCollection.insertOne(booking);
            return res.send({success:true, booking:result})
          }
        });

        app.get('/available', async (req, res) => {
          const date = req.query.date;
    
          // step 1:  get all services
          const services = await serviceCollection.find().toArray();
    
          // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
          const query = { date: date };
          const bookings = await bookingCollection.find(query).toArray();
    
          // step 3: for each service
          services.forEach(service => {
            // step 4: find bookings for that service. output: [{}, {}, {}, {}]
            const serviceBookings = bookings.filter(book => book.treatmentName === service.name);
            // step 5: select slots for the service Bookings: ['', '', '', '']
            const bookedSlots = serviceBookings.map(book => book.slot);
            // step 6: select those slots that are not in bookedSlots
            const available = service.slots.filter(slot => !bookedSlots.includes(slot));
            //step 7: set available to slots to make it easier 
            service.slots = available;
          });
         
    
          res.send(services);
        });

    }
    finally{

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello Doctors Portal')
})

app.listen(port, () => {
  console.log(`Doctors App listening on port ${port}`)
})