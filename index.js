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

app.get("/bus/busNumber/start:start&stop:stop", (req, res) => {
  const start = req.params.start;
  const stop = req.params.stop;

  const query =
    'select BusNumber from stationInfo where StationName in ("' +
    start +
    '","' +
    stop +
    '") GROUP BY BusNumber having COUNT(StationName) > 1;';
  connection.query(query, function (err, result, fields) {
    res.send(result);
  });
});

app.get("/bus/passingStop/start:start&stop:stop/:BusNo", (req, res) => {
  const start = req.params.start;
  const stop = req.params.stop;
  const BusNo = req.params.BusNo;

  const query =
    'select * from stationInfo where RouteSerial >= (select min(RouteSerial) from stationInfo where stationName = "' +
    start +
    '" and BusNumber = "' +
    BusNo +
    '") and RouteSerial <= (select max(RouteSerial) from stationInfo where stationName = "' +
    stop +
    '" and BusNumber = "' +
    BusNo +
    '") having BusNumber = "' +
    BusNo +
    '";';
  connection.query(query, function (err, result, fields) {
    res.send(result);
  });
});

app.get("/bus/price/:type&:distance", (req, res) => {
  const busType = req.params.busType;
  const distance = req.params.distance;
  var price = 0;
  if (busType === "regular") {
    price = 8;
  } else if (busType === "AC") {
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
  } else if (busType === "Euro2" || busType === "acPCB") {
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
  } else if (busType === "NGV") {
    if (distance >= 0 && distance <= 4) {
      price = 15;
    } else if (distance > 4 && distance <= 6) {
      price = 20;
    } else if (distance > 16) {
      price = 25;
    }
  }
  res.send(`${price}`);
});

app.listen(process.env.PORT || 3000);
