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

    res.send(`${price}`);
  });
});

app.get("/newprice/:busType/:distance", (req, res) => {
  const busType = req.params.busType;
  const distance = req.params.distance;
  var price = 0;
  // const query =
  // 'select Category from busInfo where BusNumber = "' + busNumber + '";';
  // connection.query(query, function (err, result, fields) {
  // busType = result[0].Category;
  console.log(busType);
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
    } else if (distance > 4 && distance <= 16) {
      price = 20;
    } else if (distance > 16) {
      price = 25;
    }
  }

  res.send(`${price}`);
  // });
});

// const busNumberFirstQuery = function () {
//   console.log("First query busNumber");
//   return new Promise(function (resolve, reject) {
//     connection.query( 'select BusNumber from stationInfo where StationName in ("' +
//     start +
//     '","' +
//     stop +
//     '") GROUP BY BusNumber having COUNT(StationName) > 1;')
//   }).then;
// };

const busNumberFirstQuery = function (start, stop, connection) {
  console.log("First query busNumber");
  const listFirstQuery = [];
  var busNumberForFirst;
  return new Promise(function (resolve, reject) {
    const busnumQuery =
      'select BusNumber from stationInfo where StationName in ("' +
      start +
      '","' +
      stop +
      '") GROUP BY BusNumber having COUNT(StationName) > 1;';
    connection.query(busnumQuery, async function (err, resultNum, fields) {
      resultNum.forEach(function (entry) {
        busNumberForFirst = entry.BusNumber;
        listFirstQuery.push(busNumberForFirst);
        global.busNumber.push(busNumberForFirst);
      });
      resolve(listFirstQuery);
    });
  });
};

const busNumberSecondQueryConnection = function (passingQuery) {
  return new Promise(function (resolve, reject) {
    var obj = new Object();
    connection.query(passingQuery, async function (err, resultNumber, fields) {
      if (resultNumber != 0) {
        obj.BusNumber = resultNumber[0].BusNumber;
        global.realBusnumber.push(obj);
        resolve(obj);
      }
    });
  });
};

const busNumberSecondQuery = function (start, stop, busNumberFirstQueryList) {
  return new Promise(function (resolve, reject) {
    const secondFilterBusNumber = [];
    var firstIndex = 0;
    const secondIndex = busNumberFirstQueryList.length;
    console.log("index list");
    console.log(secondIndex);
    busNumberFirstQueryList.forEach(async function (tempBusNumber) {
      const passingQuery =
        'select BusNumber from stationInfo where RouteSerial >= (select min(RouteSerial) from stationInfo where stationName = "' +
        start +
        '" and BusNumber = "' +
        tempBusNumber +
        '") and RouteSerial <= (select max(RouteSerial) from stationInfo where stationName = "' +
        stop +
        '" and BusNumber = "' +
        tempBusNumber +
        '") having BusNumber = "' +
        tempBusNumber +
        '";';
      const busNumberSecondQueryList = await busNumberSecondQueryConnection(
        passingQuery
      );
      secondFilterBusNumber.push(busNumberSecondQueryList);
      if (firstIndex == secondIndex - 1) {
        resolve(secondFilterBusNumber);
      } else {
        firstIndex = firstIndex + 1;
      }
    });
  });
};

const categoryResultList = function (filterBusNumberEmpty) {
  return new Promise(function (resolve, reject) {
    const categoryResultListTemp = [];
    var firstIndex = 0;
    const secondIndex = filterBusNumberEmpty.length;
    filterBusNumberEmpty.forEach(async function (entry) {
      const busnumQuery =
        "select BusNumber, Category from busInfo where BusNumber = '" +
        entry.BusNumber +
        "';";
      const resultQueryCategory = await categoryResultQuery(busnumQuery);
      categoryResultListTemp.push(resultQueryCategory);
      if (firstIndex == secondIndex - 1) {
        resolve(categoryResultListTemp);
      } else {
        firstIndex = firstIndex + 1;
      }
    });
  });
};

const categoryResultQuery = function (categoryResultQuery) {
  return new Promise(function (resolve, reject) {
    connection.query(categoryResultQuery, async function (err, result, fields) {
      result.forEach(function (entry) {
        resolve(entry);
      });
    });
  });
};

// ip: start&stop
// op: BusNumber
app.get("/newbusnumber/:start&:stop", async function (req, res) {
  const start = req.params.start;
  const stop = req.params.stop;
  var busNum;
  global.listResult = [];
  global.listTest = [];
  var tempList = 0;
  global.numType = [];
  global.busNumber = [];
  global.realBusnumber = [];
  global.filterBusNumber = [];
  global.listForCategory = [];
  global.numberType = [];

  const busNumberFirstQueryList = await busNumberFirstQuery(
    start,
    stop,
    connection
  );
  console.log("first query data");
  console.log(busNumberFirstQueryList);
  const busNumberSecindQueryList = await busNumberSecondQuery(
    start,
    stop,
    busNumberFirstQueryList
  );
  console.log("List secind filter");
  console.log(busNumberSecindQueryList);

  const filterBusNumberEmpty = busNumberSecindQueryList.filter((element) => {
    if (Object.keys(element).length !== 0) {
      return true;
    }
    return false;
  });
  console.log("Filter busNumber empty");
  console.log(filterBusNumberEmpty);

  const categoryResult = await categoryResultList(filterBusNumberEmpty);
  console.log("Category result");
  console.log(categoryResult);
  res.status(200).json(categoryResult);
  // global.filterBusNumber = secondFilterBusNumber.filter((element) => {
  //   console.log("in filter")
  //   console.log(element)
  //   if (Object.keys(element).length !== 0) {
  //     return true;
  //   }
  //   return false;
  // });

  // const busnumQuery =
  //   'select BusNumber from stationInfo where StationName in ("' +
  //   start +
  //   '","' +
  //   stop +
  //   '") GROUP BY BusNumber having COUNT(StationName) > 1;';
  // connection.query(busnumQuery, function (err, resultNum, fields) {
  //   resultNum.forEach(function (entry) {
  //     busNum = entry.BusNumber;
  //     global.busNumber.push(busNum);
  //   });
  //   global.busNumber.forEach(function (tempBusNumber) {
  //     var obj = new Object();
  //     const passingQuery =
  //       'select BusNumber from stationInfo where RouteSerial >= (select min(RouteSerial) from stationInfo where stationName = "' +
  //       start +
  //       '" and BusNumber = "' +
  //       tempBusNumber +
  //       '") and RouteSerial <= (select max(RouteSerial) from stationInfo where stationName = "' +
  //       stop +
  //       '" and BusNumber = "' +
  //       tempBusNumber +
  //       '") having BusNumber = "' +
  //       tempBusNumber +
  //       '";';
  //     connection.query(passingQuery, function (err, resultNumber, fields) {
  //       if (resultNumber != 0) {
  //         obj.BusNumber = resultNumber[0].BusNumber;
  //       }
  //       global.realBusnumber.push(obj);
  //     });
  //   });

  //   global.filterBusNumber = global.realBusnumber.filter((element) => {
  //     if (Object.keys(element).length !== 0) {
  //       return true;
  //     }
  //     return false;
  //   });

  //   global.filterBusNumber.forEach(function (entry) {
  //     global.listForCategory.push(entry);
  //   });

  //   global.listForCategory.forEach(function (entry) {
  //     const busnumQuery =
  //       "select BusNumber, Category from busInfo where BusNumber = '" +
  //       entry.BusNumber +
  //       "';";
  //     connection.query(busnumQuery, function (err, result, fields) {
  //       result.forEach(function (entry) {
  //         global.numberType.push(entry);
  //       });
  //     });
  //   });
  //   res.send(global.numberType);
  // });
});

app.get("/busnumber/:start&:stop", (req, res) => {
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

app.get("/testbusnumber/:start&:stop", (req, res) => {
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
      // var obj = new Object();
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
        console.log("hi");
        console.log(listResult);
        console.log("out");

        if (tempList == resultNum.length - 1) {
          console.log("yo");
          // console.log(listResult);

          // res.send(finalList);
        } else {
          tempList += 1;
        }
      });
    });
  });
});

app.listen(process.env.PORT || 3000);
