const express= require('express');
const axios=require('axios');
const cors=require('cors');
const connectDB=require('./DB/ticketConnection');
const train_ticket=express();

const swaggerJsDoc=require('swagger-jsdoc');
const swaggerUi=require('swagger-ui-express');

connectDB();

//swagger
const swaggerOptions={
    definition:{
        openapi:'3.0.0',
        info:{
            title:'Boking API',
            description:'Booking API information',
            contact:{
                name:''
            },
            servers:["http://localhost:5555"]
        }
    },
    apis:['bookingService.js']
};

const swaggerDocs=swaggerJsDoc(swaggerOptions);
train_ticket.use('/booking-docs',swaggerUi.serve,swaggerUi.setup(swaggerDocs));


//const Train= require('./DB/trainData');
const ticketData = require('./DB/ticketDB');

const bodyParser=require('body-parser');
//const { response } = require('express');
//search_train.use(express.json({extended : false}));
train_ticket.use(bodyParser.urlencoded({extended: false}));
train_ticket.use(bodyParser.json());
train_ticket.use(cors());
/*train_ticket.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
    next();
});
*/


train_ticket.get('/fare/:classType',(req,res)=>{
    axios.get("https://1349qzbv96.execute-api.us-west-1.amazonaws.com/production/classType/"+req.params.classType).then((response)=> {
         res.send(response.data);
         console.log(response.fare)
        //console.log(response.data.fare);
     }).catch(err=> {
         if(err){
           
             console.log(err);
         }
     })
    });
// Get train by source and destination

    train_ticket.get('/train/:source/:destination',(req,res)=>{
        axios.get("https://1349qzbv96.execute-api.us-west-1.amazonaws.com/production/trainList/"+req.params.source+"/"+req.params.destination).then((response)=>{
        var object={trainNumber:response.data.trainNumber,vacantSeats:response.data.vacantSeats, trainName:response.data.trainName, source:response.data.source, destination:response.data.destination, distance:response.data.distance}    
        res.status(200).send(response.data);
        console.log(response.data.vacantSeats);
        console.log(object.trainName);
        }).catch(err =>{
            if(err){
                console.log(err);
            }
        })
    });

/**
 * @swagger
 * definitions:
 *  Ticket:
 *   type: object
 *   properties:
 *    email:
 *     type: String
 *     description: Email of User
 *     example: "ha@gmail.com"
 *    trainName:
 *     type: String
 *     description: Train Name
 *     example: 'Indrayni Express'
 *    source:
 *     type: String
 *     description: Source
 *     example: "CSMT"
 *    destination:
 *     type: String
 *     description: Destination
 *     example: "Pune"
 *    classType:
 *     type: String
 *     description: Class Type
 *     example: "A2"
 *    journeyDate:
 *     type: String
 *     description: Date of Journey
 *     example: "25/12/2020"
 */

 /**
  * @swagger
  * /bookTicket/:
  *  post:
  *   summary: Book Ticket
  *   description: Reservation 
  *   requestBody:
  *    content:
  *     application/json: 
  *      schema:
  *       $ref: '#/definitions/Ticket'
  *   responses:
  *    200:
  *     description: Ticket booked successfully
  *    400:
  *     description: error
  */

//Book Ticket

train_ticket.post('/bookTicket/',(req,res)=>{
    try{const{email,  source, destination ,trainName, classType, noOfTickets, journeyDate}= req.body;

    let ticket={};
    ticket.email=email;
 
    ticket.source=source;
    ticket.destination=destination;
    ticket.trainName=trainName;
    ticket.classType=classType; 
    ticket.journeyDate=journeyDate; 

    axios.get("https://1349qzbv96.execute-api.us-west-1.amazonaws.com/production/train/"+trainName).then((response)=>{
        const tr=response.data[0];
        console.log(tr);
        trainNumber=tr.trainNumber;
            dTime=tr.dTime;
            aTime=tr.aTime;
            ticket.dTime=dTime;
            ticket.aTime=aTime;
            distance=tr.distance;
            ticket.distance=distance;
            ticket.trainNumber=trainNumber;
            console.log("vacant seats"+tr.vacantSeats);
            if(tr.vacantSeats>=req.body.noOfTickets){
                var newVacantSeats=(tr.vacantSeats-req.body.noOfTickets);
                
                var vacantSeats1=
         {
            trainNumber:tr.trainNumber,
            trainName:trainName,
            source:tr.source,
            destination:tr.destination,
            distance:tr.distance,
            aTime:tr.aTime,
            dTime:tr.dTime,
           vacantSeats:(newVacantSeats)
         }
               
                var pnr=trainNumber+classType+(tr.vacantSeats-noOfTickets);
                axios.get("https://1349qzbv96.execute-api.us-west-1.amazonaws.com/production/classType/"+classType).then((response)=>{
                    const f=response.data[0];
                   console.log(f);
                   axios.put(`https://1349qzbv96.execute-api.us-west-1.amazonaws.com/production/trainUpdateSeats/${trainName}`,vacantSeats1).then((response)=>{
                    console.log(response.data);
                    console.log(newVacantSeats)
                })
                        var fare=f.fare;
                        console.log(fare);
                        ticket.noOfTickets=noOfTickets;
                        var totalFare=fare*noOfTickets*distance;
                        ticket.totalFare=totalFare;
                        ticket.pnr=pnr;
                        let ticketModel= new ticketData(ticket);
                         ticketModel.save();
                        res.status(200).json(ticketModel);
            
                    
                })
            }
            else{
                console.log("No vacant Seats")
            }

    })

    
    }catch(err){
        console.log(err);
    } 
    
})

/**
  * @swagger
  * /fare/{classType}:
  *  get:
  *   summary: Get a fare
  *   description: Get fare for particular class
  *   parameters:
  *     - in: path
  *       name: classType
  *       schema:
  *        type: String
  *       example: "A1"
  *   responses:
  *    200:
  *     description: Fare for particular class
  *    404:
  *     description: error
  */


train_ticket.get('/fare/:classType',(req,res)=>{
axios.get("https://1349qzbv96.execute-api.us-west-1.amazonaws.com/production/classType/:"+req.params.classType)
 .then((response)=> {
     res.status(200).send(response.data);
    
 })
 .catch(err=> {
     if(err){
       res.status(404).send(err);
         console.log(err);
     }
 })
});

/**
  * @swagger
  * /viewTickets/{email}:
  *  get:
  *   summary: Get a tickets
  *   description: Get all tickets booked by particular user
  *   parameters:
  *     - in: path
  *       name: email
  *       schema:
  *        type: String
  *       example: "ha@gmail.com"
  *   responses:
  *    200:
  *     description: Tickets of user
  *    400:
  *     description: error
  */


//View Tickets by email

train_ticket.get('/viewTickets/:email',(req,res)=>{
    
    var ticketsList=function(email){
        ticketData.aggregate([
            {$match:{
                email: email
            }
            }
        ],
        function(err, result){
            if(err){
                res.status(400).send(err);
                console.log("error to view tickets "+err);
            }
            else{
                res.status(200).json(result);
            }
        }
        );
    }
    ticketsList(req.params.email);
})


/**
  * @swagger
  * /cancellation/{pnr}:
  *  delete:
  *   summary: Delete ticket by PNR
  *   description: Delete ticket
  *   parameters:
  *     - in: path
  *       name: pnr
  *       schema:
  *        type: String
  *       example: "1005A285"
  *   responses:
  *    200:
  *     description: Ticket is deleted
  *    404:
  *     description: error
  */


//Delete Ticket by PNR

train_ticket.delete('/cancellation/:pnr',async(req,res)=>{
    //userName:req.params.userName;
    ticketData.findOneAndDelete({
        pnr:req.params.pnr
    }).then(result=>{
        res.status(200).send("Deleted");
    })
    .catch(err =>{
       res.status(404).send(err);
    })
})



//train_ticket.listen(5555);
module.exports=train_ticket;