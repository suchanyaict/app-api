const express = require('express')
const cors = require('cors')
const mysql = require('mysql2')
require('dotenv').config()
const app = express()

app.use(cors())

const connection = mysql.createConnection(process.env.DATABASE_URL)

app.all('/', (req, res) => {
    res.send('Yo!')
})

app.get('/bus', (req,res) => {
    connection.query(
        'select BusNumber from stationInfo where StationName = "เมเจอร์รังสิต"; ',
        function(err, result, fields){
            res.send(result)
        }
    )
})

app.listen(process.env.PORT || 3000)
