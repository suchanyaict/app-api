const express = require('express')
const cors = require('cors')
const mysql = require('mysql2')
require('dotenv').config()
const app = express()

app.use(cors())

const connection = mysql.createConnection(process.env.DATABASE_URL)

app.all('/', (req, res) => {
    res.send('hello!')
})

app.get('/bus', (req,res) => {
    connection.query(
        'select * from stationInfo; ',
        function(err, result, fields){
            res.send(result)
        }
    )
})

app.get("/bus/:id", (req, res) => {
    const searchID = req.params.id;
    const query = 'select BusNumber from busgetApp.stationInfo where StationName like "%'+searchID+'%";';
    connection.query(query, function (err, result, fields) {
      res.send(result);
    });
  });
  

app.listen(process.env.PORT || 3000)
