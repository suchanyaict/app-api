const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const app = express();
const mySqlPromise = require("mysql2/promise");
app.use(express.json());

app.use(cors());

const connection = mysql.createConnection(process.env.DATABASE_URL);
const connectionPromise = mySqlPromise.createConnection(
  process.env.DATABASE_URL
);

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

// ip: -
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
    "select distinct stationInfo.BusNumber, concat(busInfo.start_point, ' - ',busInfo.stop_point) as ssPoint from stationInfo join busInfo on stationInfo.busnumber = busInfo.busnumber where StationName like '%" +
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
app.get("/passingstop/:start&:stop/:busnumber", (req, res) => {
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
app.get("/oldprice/:busNumber/:distance", (req, res) => {
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
    res.send(`${price}`);
  });
});

app.get("/price/:busType/:distance", (req, res) => {
  const busType = req.params.busType;
  const distance = req.params.distance;
  var price = 0;
  console.log(busType);
  if (busType === "Regular") {
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
    } else if (distance > 4 && distance <= 16) {
      price = 20;
    } else if (distance > 16) {
      price = 25;
    }
  }
  res.send(`${price}`);
});

app.get("/oldbusnumber/:start&:stop", (req, res) => {
  const start = req.params.start;
  const stop = req.params.stop;
  var busNum;
  listResult = [];
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
      const passingQuery =
        'select BusNumber from stationInfo where RouteSerial >= (select min(RouteSerial) from stationInfo where stationName = "' +
        start +
        '" and BusNumber = "' +
        busNum +
        '") and RouteSerial <= (select max(RouteSerial) from stationInfo where stationName = "' +
        stop +
        '" and BusNumber = "' +
        busNum +
        '") having BusNumber = "' +
        busNum +
        '";';
      connection.query(passingQuery, function (err, resultNumber, fields) {
        if (resultNumber != 0) {
          obj.BusNumber = resultNumber[0].BusNumber;
        }
        listResult.push(obj);
        const finalList = listResult.filter((element) => {
          if (Object.keys(element).length !== 0) {
            return true;
          }
          return false;
        });

        if (tempList == resultNum.length - 1) {
          res.send(finalList);
        } else {
          tempList += 1;
        }
      });
    });
  });
});

app.get("/busnumber/:start&:stop", (req, res) => {
  const start = req.params.start;
  const stop = req.params.stop;
  var busNum;
  listResult = [];
  global.numberType = [];
  var tempList = 0;

  const busnumQuery =
    'select BusNumber from stationInfo where StationName in ("' +
    start +
    '","' +
    stop +
    '") GROUP BY BusNumber having COUNT(StationName) > 1 order by BusNumber+0 asc;';
  connection.query(busnumQuery, function (err, resultNum, fields) {
    if (resultNum == 0) {
      res.send(resultNum);
    } else {
      resultNum.forEach(function (entry) {
        busNum = entry.BusNumber;
        const passingQuery =
          'select BusNumber from stationInfo where RouteSerial >= (select min(RouteSerial) from stationInfo where stationName = "' +
          start +
          '" and BusNumber = "' +
          busNum +
          '") and RouteSerial <= (select max(RouteSerial) from stationInfo where stationName = "' +
          stop +
          '" and BusNumber = "' +
          busNum +
          '") having BusNumber = "' +
          busNum +
          '";';
        connection.query(passingQuery, function (err, resultNumber, fields) {
          if (resultNumber != 0) {
            listResult.push(resultNumber[0].BusNumber);
          }
          if (tempList == resultNum.length - 1) {
            if (listResult.length === 0) {
              res.send([]);
            }
            var firstIndex = 0;
            const secondIndex = listResult.length;
            listResult.forEach(function (entry) {
              const busnumQuery =
                "select BusNumber, Category from busInfo where BusNumber = '" +
                entry +
                "';";
              connection.query(busnumQuery, function (err, result, fields) {
                result.forEach(function (entry) {
                  global.numberType.push(entry);
                });
                if (firstIndex == secondIndex - 1) {
                  res.send(numberType);
                } else {
                  firstIndex = firstIndex + 1;
                }
              });
            });
          } else {
            tempList += 1;
          }
        });
      });
    }
  });
});

app.listen(process.env.PORT || 3000);
