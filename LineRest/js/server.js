"use strict";
const fs = require("node:fs");
const http = require("node:http");
const WebSocket = require("ws");
const database = require("../userDatabase/database.json");
const card1Json = require("../stateCard/card1.json");
const card2Json = require("../stateCard/card2.json");
const card3Json = require("../stateCard/card3.json");
const card4Json = require("../stateCard/card4.json");
const queue1Json = require("../stateQueue/queue1.json"); 
const queue2Json = require("../stateQueue/queue2.json"); 
const queue3Json = require("../stateQueue/queue3.json"); 
const queue4Json = require("../stateQueue/queue4.json"); 
const notFound = fs.readFileSync('../notFound.html', 'utf8');
function contType(format, req, res) {
  let File = req.url.slice(1);
  if (format == undefined || format == null) {
    res.statusCode = 404;
    res.write(notFound);
    res.end();
    return
  }
  fs.readFile("../" + File, (err, data) => {
    if (err) {
      console.log("Файл не найден, " + err);
      res.statusCode = 404;
      res.write(notFound);
      res.end();
      return;
    }
    res.setHeader("Content-Type", format);
    res.statusCode = 200;
    res.write(data);
    res.end();
  });
}
function createPageOutput (req, res){
  let name
  req.url == '/'? name = '/index': name = req.url
  fs.readFile(`../${name}.html`,"utf8", (err, data) => {
    res.setHeader("Content-Type", "text/html")
    if (!err){
      res.statusCode = 200
      res.write(data)
    }else{
      res.statusCode = 404
      res.write(notFound)
    }
    res.end()
  })
}
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const server = http.createServer((req, res) => {
  switch (req.method) {
    case 'POST':
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      req.on('end', () => {
        let params = JSON.parse(body)
        if(Object.keys(database).some(x => x == params)){
          res.end(JSON.stringify(
            database[params]
          ))
        }else{
          res.end(JSON.stringify(404))
        }
      })
      break
    case 'GET':
      let typeUrl = /\.[^\.]*$/.exec(req.url);
      if (req.url.endsWith(typeUrl)) {
        contType(mimeTypes[typeUrl], req, res);
      } else {
        createPageOutput(req, res)
      }
      break
  }
});
server.listen(8000, () => {
  console.log("Listen port http://localhost:8000/");
});
const ws = new WebSocket.Server({ server });
const dataLR = {
  card: {
    1: card1Json,
    2: card2Json,
    3: card3Json,
    4: card4Json
  },
  queue: {
    1: queue1Json,
    2: queue2Json,
    3: queue3Json,
    4: queue4Json
  },
  // listOnlineUsers : new Set
  listOnlineUsers : []
}

function getUniqueArrayValues (arr){
  return arr.filter((elem, i)=> i == arr.indexOf(elem))
}

function listOnlineSend() {
  const arr = getUniqueArrayValues(dataLR.listOnlineUsers)
  const dispatchList = arr.map(x => [x, database[x][2]])
  const data = {
    category: "ListOnlineUsers",
    listOnlineUsers: dispatchList
  };
  for (const client of ws.clients) {
    client.send(
      JSON.stringify(data),
      { binary: false }
    );
  }
}

function CreateListOnline(method, id) {
  switch (method) {
    case "add":
      dataLR.listOnlineUsers.push(id)
      break
    case "delete":
      const i = dataLR.listOnlineUsers.indexOf(id)
      dataLR.listOnlineUsers.splice(i, 1)
      break
  }
  listOnlineSend()
}



function cardSend(card, position) {
  if(position == undefined && card.camper == "") return
  if (card != undefined) {
    if(database[card.camper] != undefined) card.name = database[card.camper][2]
    for (const client of ws.clients) {
      client.send(JSON.stringify(card), { binary: false });
    }
  }
  if (position != undefined) recCard(card, `card${position}`);
}
function queueSend(queue, post, a = true) {
  if(!a && queue.length == 0) return
  const arr = queue.map(id => [id, database[id][2]])  
  const data = {
    category: "queue",
    position: post,
    queue: arr,
  };
  for (const client of ws.clients) {
    client.send(
      JSON.stringify(data),
      { binary: false }
    );
  }
  if (a) recQueue(queue, `queue${post}`);
}
function createCheckQueuesAndDispatch(id, card, position) {
  for (let i in dataLR.queue) {
    for (let k in dataLR.queue[i]){
      if (dataLR.queue[i][k] == id) {
        dataLR.queue[i].splice(k, 1);
        cardSend(card, position);
        queueSend(dataLR.queue[i], +i);
        return;
      }
    }
  }
  cardSend(card, position);
}
function createAddFromQueue(queue, card, position) {
  if (queue.length > 0) {
    card.camper = queue.shift();
    card.time = Date.now();
    cardSend(card, position);
    queueSend(queue, position);
  } else {
    cardSend(card, position);
  }
}
function createCardSorting(camper, card, queue, position) {
  if (camper == "") {
    createAddFromQueue(queue, card, position);
  } else {
    createCheckQueuesAndDispatch(camper, card, position);
  }
}
function checkAccess(event, camper, card) {
  if (event == 'getUp') {
    if (card.camper != '') return false
    for (let i in dataLR.card) {
      if (dataLR.card[i].camper == camper) return false
    }
    return true
  } else {
    if (card.camper == event) return true
  }
}
function messageSorting(message) {
  const { category, card, camper, event, position, shiftman } = message
  switch (category) {
    case "card":
      if (checkAccess(event, camper, dataLR.card[card])) {
        dataLR.card[card] = message
        createCardSorting(camper, dataLR.card[card], dataLR.queue[card], card);
      }
      break;
    case "queue":
      switch (event) {
        case "addToQueue":
          dataLR.queue[position].push(camper)
          queueSend(dataLR.queue[position], position)
          break;
        case "removeFromQueue":
          removeFromArray(dataLR.queue[position], camper, position)
          break;
        case "replacementInLine":
          replacementFromQueue(dataLR.queue[position], camper, shiftman, position)
          break;
      }
      break;
  }
}
function replacementFromQueue(arr, camper, shiftman, position) {
  const initiator = arr.indexOf(camper)
  const shift = arr.indexOf(shiftman)
  if ((initiator >= 0 && shift >= 0) && (initiator < shift)) {
    arr.splice(initiator, 1, shiftman)
    arr.splice(shift, 1, camper)
    queueSend(arr, position);
  }
}
function removeFromArray(arr, id, position) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == id) arr.splice(i, 1);
  }
  queueSend(arr, position);
}
ws.on("connection", (connection, req) => {
  for(let i = 1; i < 5; i++){
    cardSend(dataLR.card[i]);
    queueSend(dataLR.queue[i], i, false);
  }

  connection.on("message", message => {
    const transfer = JSON.parse(message); 
    const { userId, camper } = transfer
    if(userId == 0 && dataLR.listOnlineUsers.length > 0) listOnlineSend()
    if (Number.isInteger(userId) && database[userId] != undefined) {
      req.socket.userOnline = userId
      CreateListOnline("add", req.socket.userOnline)
    }
    if(database[camper] == undefined && camper != "") return
    messageSorting(transfer);
  });

  connection.on("close", () => {
    if (req.socket.userOnline === undefined) return
    CreateListOnline("delete", req.socket.userOnline)
  });
});
function recCard(card, name) {
  fs.writeFile(`../stateCard/${name}.json`, JSON.stringify(card), (err) => {
    if (err) console.log(err);
  });
}
function recQueue(queue, name) {
  fs.writeFile(`../stateQueue/${name}.json`, JSON.stringify(queue), (err) => {
    if (err) console.log(err);
  });
}
