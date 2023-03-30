const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const app = express();
app.use(express.json());

app.use(cors());

const connection = mysql.createConnection(process.env.DATABASE_URL);

//
app.all("/", (req, res) => {
  res.send("hello!");
});

// all station info
app.get("/bus", (req, res) => {
  connection.query(
    "select * from stationInfo; ",
    function (err, result, fields) {
      res.send(result);
    }
  );
});

// ip: input
// op: station name
app.get("/bus/:input", (req, res) => {
  const input = req.params.input;
  const query =
    'select StationName from stationInfo where StationName like "%' +
    input +
    '%";';
  connection.query(query, function (err, result, fields) {
    res.send(result);
  });
});

// ip: station name
// op: all info
app.get("/bus/stationName/:id", (req, res) => {
  const searchID = req.params.id;
  const query =
    'select BusNumber from stationInfo where StationName like "%' +
    searchID +
    '%";';
  connection.query(query, function (err, result, fields) {
    res.send(result);
  });
});

// ip: start & stop
// op: busNumber
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

// ip: start & stop & busNum
// op: all stop info that bus passing by
app.get("/passingStop/:start&stop/:BusNo", (req, res) => {
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

// ip: busNum
// op: bus type
app.get("/busType/:busNumber", (req, res) => {
  const busNumber = req.params.busNumber;

  const query =
    'select Category from busInfo where BusNumber = "' + busNumber + '";';
  connection.query(query, function (err, result, fields) {
    res.send(result);
  });
});

// ip: bust type & distance
// op: price
app.get("/price/:start&:stop/:distance", (req, res) => {
  const start = req.params.start;
  const stop = req.params.stop;
  const distance = req.params.distance;
  // console.log("test");
  var busNum;
  const listResult = [];

  const busnumQuery =
    'select BusNumber from stationInfo where StationName in ("' +
    start +
    '","' +
    stop +
    '") GROUP BY BusNumber having COUNT(StationName) > 1;';
  connection.query(busnumQuery, function (err, resultNum, fields) {
    resultNum.forEach(function (entry) {
      var obj = new Object();
      busNum = entry.BusNumber;
      obj.busnumber = busNum;
      const query =
        'select Category from busInfo where BusNumber = "' + busNum + '";';
      connection.query(query, function (err, resultType, fields) {
        busType = resultType[0].Category;
        // console.log(busType);
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
        obj.price = price;
        listResult = listResult.push(obj);
        // console.log(obj);
        // console.log(listResult);
      });
    });
    console.log(listResult);
    res.send(listResult);
  });
});

app.listen(process.env.PORT || 3000);
