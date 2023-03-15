const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();
const app = express();
app.use(express.json());

app.use(cors());

const connection = mysql.createConnection(process.env.DATABASE_URL);

app.all("/", (req, res) => {
  res.send("hello!");
});

app.get("/bus", (req, res) => {
  connection.query(
    "select * from stationInfo; ",
    function (err, result, fields) {
      res.send(result);
    }
  );
});

app.get("/bus/stationName/:id", (req, res) => {
  const searchID = req.params.id;
  const query =
    'select distinct * from stationInfo where StationName like "%' +
    searchID +
    '%";';
  connection.query(query, function (err, result, fields) {
    res.send(result);
  });
});

app.post("/bus/busNumber", (req, res) => {
  const { start, stop } = req.body;
  const query =
    'select BusNumber from stationInfo where StationName in ('+start+','+stop+') GROUP BY BusNumber having COUNT(StationName) > 1;';
  connection.query(query, function (err, result, fields) {
    res.send(query);
  });
});


app.post("/bus/price", (req, res) => {
  const { busType, distance } = req.body;
  var price = 0;
  if (busType === "red") {
    price = 8;
  } else if (busType === "acBlue") {
    if (distance >= 0 && distance <= 8) {
      price = 12;
    } else if (distance > 8 && distance <= 12) {
      price = 14;
    } else if (distance > 12 && distance <= 16) {
      price = 16;
    } else if (distance > 16 && distance <= 20) {
      price = 18;
    } else if (distance > 20) {
      price = 20;
    }
  } else if (busType === "euro2" || busType === "acPCB") {
    if (distance >= 0 && distance <= 4) {
      price = 13;
    } else if (distance > 4 && distance <= 8) {
      price = 15;
    } else if (distance > 8 && distance <= 12) {
      price = 17;
    } else if (distance > 12 && distance <= 16) {
      price = 19;
    } else if (distance > 16 && distance <= 20) {
      price = 21;
    } else if (distance > 20 && distance <= 23) {
      price = 23;
    } else if (distance > 23) {
      price = 25;
    }
  } else if (busType === "ngv") {
    if (distance >= 0 && distance <= 4) {
      price = 15;
    } else if (distance > 4 && distance <= 6) {
      price = 20;
    } else if (distance > 16) {
      price = 25;
    }
  }
  res.send(`Price : ${price}`);
});

app.listen(process.env.PORT || 3000);
