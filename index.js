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

// ip: null
// op: station name
app.get("/stationname", (req, res) => {
  const query = "SELECT DISTINCT StationName from stationInfo;";
  connection.query(query, function (err, result, fields) {
    res.send(result);
  });
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
    "select stationInfo.BusNumber, concat(busInfo.start_point, ' - ',busInfo.stop_point) as ssPoint from stationInfo join busInfo on stationInfo.busnumber = busInfo.busnumber where StationName like '%" +
    searchID +
    "%'";
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
app.get("/passingStop/:start&:stop/:busnumber", (req, res) => {
  const start = req.params.start;
  const stop = req.params.stop;
  const busnumber = req.params.busnumber;

  const query =
    'select * from stationInfo where RouteSerial >= (select min(RouteSerial) from stationInfo where stationName = "' +
    start +
    '" and BusNumber = "' +
    busnumber +
    '") and RouteSerial <= (select max(RouteSerial) from stationInfo where stationName = "' +
    stop +
    '" and BusNumber = "' +
    busnumber +
    '") having BusNumber = "' +
    busnumber +
    '";';
  connection.query(query, function (err, result, fields) {
    res.send(result);
  });
});

// ip: start & stop & busNum
// op: all stop info that bus passing by
app.get("/getPassingStop/:start&:stop/", (req, res) => {
  const start = req.params.start;
  const stop = req.params.stop;
  var listResult = [];

  const BusNumQuery =
    'select * from stationInfo where RouteSerial >= (select min(RouteSerial) from stationInfo where stationName = "' +
    start +
    '" and BusNumber = "' +
    busnumber +
    '") and RouteSerial <= (select max(RouteSerial) from stationInfo where stationName = "' +
    stop +
    '" and BusNumber = "' +
    busnumber +
    '") having BusNumber = "' +
    busnumber +
    '";';
  connection.query(BusNumQuery, function (err, BusNumResult, fields) {
    BusNumResult.forEach(function (entry) {
      var obj = new Object();
      busNum = entry.BusNumber;
      obj.busNumber = busNum;
      const passingQuery =
        'select * from stationInfo where RouteSerial >= (select min(RouteSerial) from stationInfo where stationName = "' +
        start +
        '" and BusNumber = "' +
        busnumber +
        '") and RouteSerial <= (select max(RouteSerial) from stationInfo where stationName = "' +
        stop +
        '" and BusNumber = "' +
        busnumber +
        '") having BusNumber = "' +
        busnumber +
        '";';
      connection.query(passingQuery, function (err, passingResult, fields) {
        eachRoute = passingResult[0].passingQuery;
        obj.eachRoute = eachRoute;
        listResult.push(obj);
        if (tempList == BusNumResult.length - 1) {
          res.send(listResult);
        } else {
          tempList += 1;
        }
      });
    });
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

// ip: start&stop/distance
// op: busNumber, price
app.get("/pricewithdis/:start&:stop/:distance", (req, res) => {
  const start = req.params.start;
  const stop = req.params.stop;
  const distance = req.params.distance;
  // console.log("test");
  var busNum;
  const listResult = [];
  var tempList = 0;

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
      const Catequery =
        'select Category from busInfo where BusNumber = "' + busNum + '";';
      connection.query(Catequery, function (err, resultType, fields) {
        busType = resultType[0].Category;
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
        listResult.push(obj);
        if (tempList == resultNum.length - 1) {
          res.send(listResult);
        } else {
          tempList += 1;
        }
      });
    });
  });
});

// ip: bust type & distance
// op: price
app.get("/price/:busNumber/:distance", (req, res) => {
  const busNumber = req.params.busNumber;
  const distance = req.params.distance;
  var price = 0;
  const query =
    'select Category from busInfo where BusNumber = "' + busNumber + '";';
  connection.query(query, function (err, result, fields) {
    busType = result[0].Category;
    if (busType === "regular") {
      price = 8;
    } else if (result === "AC") {
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

    res.send(price);
  });
});

app.listen(process.env.PORT || 3000);
