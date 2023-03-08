const dataLS = JSON.parse(localStorage.getItem("UserData"))
if(localStorage.getItem("schedule") != null || localStorage.getItem("schedule") != undefined){
var scheduleLS = localStorage.getItem("schedule")
}
const privateNum = dataLS[0]  
const socket = new WebSocket("ws://127.0.0.1:8000");
socket.addEventListener("error", error => console.log(error));
socket.addEventListener("close", event => console.log("CLOSE > code:", event.code));
const userName = document.querySelector(".personage");
const getOut = document.querySelector(".get_out")
const nav = document.querySelector(".nav")
const activeSchedule = document.querySelectorAll(".switch")
const scheduleСontainer = document.querySelectorAll(".scheduleСontainer")
const navContainer = document.querySelector(".nav_container")
const cards = {
  1: document.querySelector("#card1"),
  2: document.querySelector("#card2"),
  3: document.querySelector("#card3"),
  4: document.querySelector("#card4")
}
const popup = document.querySelector("#myModal")
const cardID = document.querySelectorAll('.cardID')
const btnBegin = document.querySelectorAll('.cardBegin')
const btnFinish = document.querySelectorAll('.cardFinish')
const time = document.querySelectorAll('.time')
const joinLine = document.querySelectorAll('.send_post')
const queues = document.querySelectorAll('.container')
const dataLR = {
  cardKey: ['', '', '',''],
  queueValues: [[], [], [], []],
  timeStamp: [0, 0, 0, 0],
  intervals: [undefined, undefined, undefined, undefined]
}
userName.textContent = dataLS[1]
getOut.addEventListener('click', () => {
  nav.classList.remove("hideNav")
  nav.classList.add("showNav")
  const close = nav.querySelector(".nav_close")
  const exit = nav.querySelector(".nav_btn")
  close.addEventListener('click', () => {
    nav.classList.remove("showNav")
    nav.classList.add("hideNav")
  }, { once: true })
  exit.onclick = ()=>{
    localStorage.clear()
    window.location.href = './entry'
  }
})
// Смена вкладки с графиком работы
function showSchedule (i){
  switch (i) {
    case 0:
      localStorage.setItem("schedule", "0")
      scheduleСontainer[0].style.display = 'block'
      scheduleСontainer[1].style.display = 'none'
      activeSchedule[0].classList.add('activeSchedule')
      activeSchedule[1].classList.remove('activeSchedule')
      break
    case 1:
      localStorage.setItem("schedule", "1")
      scheduleСontainer[1].style.display = 'block'
      scheduleСontainer[0].style.display = 'none'
      activeSchedule[1].classList.add('activeSchedule')
      activeSchedule[0].classList.remove('activeSchedule')
      break
  }
}
//_____________________________________________________________
if(scheduleLS != undefined || scheduleLS != "") showSchedule(+scheduleLS)
for(let i = 0; i < activeSchedule.length; i++){
  activeSchedule[i].addEventListener('click', () => {
    showSchedule(i)
  })
}
// Модальное окно
function getPopupPromiseResult(title, content = '') {
  const modaltitle = popup.querySelector(".modal_title");
  const modalContent = popup.querySelector(".modal_content");
  const btnTrue = popup.querySelector(".modal_true");
  const btnFalse = popup.querySelector(".modal_false");
  modaltitle.textContent = title
  modalContent.innerHTML = content;
  popup.style.display = "block";
  return new Promise((resolve) => {
    btnTrue.onclick = () => {
      popup.style.display = "none";
      resolve(true)
      document.onclick = null
    };
    btnFalse.onclick = () => {
      popup.style.display = "none";
      resolve(false)
      document.onclick = null
    };
    document.onclick = function (event) {
      if (event.target == popup) {
        popup.style.display = "none";
        document.onclick = null
      }
    }
  })
};
//_____________________________________________________________
// Отправка данных по картам
function createUserIdentification(event) {
  socket.send(
    JSON.stringify({
      category: "card",
      card: +event.currentTarget.dataset.num,
      camper: privateNum,
      time: Date.now(),
      event: "getUp"
    })
  );
}
function createClearCard(event) {
  socket.send(
    JSON.stringify({
      category: "card",
      card: +event.currentTarget.dataset.num,
      camper: "",
      time: 0,
      event: privateNum
    })
  );
}
//_____________________________________________________________
// Отправка данных по очереди
function sendJoinQueue(post) {
  socket.send(
    JSON.stringify({
      category: "queue",
      position: post,
      event: "addToQueue",
      camper: privateNum,
    })
  );
}
function sendRemoveQueue(post) {
  socket.send(
    JSON.stringify({
      category: "queue",
      position: post,
      event: "removeFromQueue",
      camper: privateNum,
    })
  );
}
function sendReplacementQueue(arr) {
  socket.send(
    JSON.stringify({
      category: "queue",
      position: arr[1],
      event: "replacementInLine",
      camper: privateNum,
      shiftman: arr[0]
    })
  );
}
//_____________________________________________________________
// Изменения карт по цвету
function createUserRemoval(card, statys, cardFinish) {
  card.setAttribute("class", "card1");
  statys.textContent = "Свободная карта";
  cardFinish.style.display = "none";
}
function createUserAssignment(card, statys, cardFinish) {
  card.setAttribute("class", "card2");
  statys.textContent = "Карта занята вами";
  cardFinish.style.display = "block";
}
function createBusyUser(card, statys, cardFinish) {
  card.setAttribute("class", "card3");
  statys.textContent = "Карта занята";
  cardFinish.style.display = "none";
}
//_____________________________________________________________
// Добавление и удаление обработчика событий на кнопках Взять и Завершить
function createBreakStart() {
  for (btn of btnBegin) {
    const elem = btn.parentElement.className
    if (elem == 'card1') {
      btn.addEventListener('click', createUserIdentification)
    } else {
      btn.removeEventListener('click', createUserIdentification)
    }
  }
} createBreakStart()
function createBreakFinish() {
  for (btn of btnFinish) {
    const elemClass = btn.parentElement.className
    if (elemClass == 'card2') {
      btn.addEventListener('click', createClearCard)
    } else {
      btn.removeEventListener('click', createClearCard)
    }
  }
} createBreakFinish()
//_____________________________________________________________
// Отправка данных для формирования списка пользователей онлайн
socket.addEventListener("open", () => {
  socket.send(JSON.stringify({
    userId : Number(privateNum)
  }));
});
//_____________________________________________________________
function createParcelling(camper, position, nameApi) {
  const name = document.querySelector(`#card${position}Name`)
  const ID = cardID[position - 1]
  name.textContent = nameApi
  ID.textContent = camper;
}
socket.addEventListener("message", ({ data }) => {
  const { category, card, camper, time, queue, position, name, listOnlineUsers } = JSON.parse(data)
  switch (category) {
    case "card":
      dataLR.cardKey[card - 1] = camper
      dataLR.timeStamp[card - 1] = time
      createParcelling(camper, card, name)
      break;
    case "queue":
      dataLR.queueValues[position - 1] = queue
      createQueue(queue, queues[position - 1], +position);
      createQueueButton();
      break;
    case "ListOnlineUsers":
      createListOnlineUsers(listOnlineUsers)
      break;
  }
});
// Вывод списка пользователей онлайн
function createListOnlineUsers(arr) {
  navContainer.innerHTML = ""
  for (let i = 0; i < arr.length; i++) {
    if(arr[i][0] == privateNum) continue
    const post = document.createElement("div");
    post.setAttribute("class", "user_online");
    post.innerHTML = `
  <div>${arr[i][1]}</div>
  <div>${arr[i][0]}</div>`;
    navContainer.appendChild(post);
  }
}
//_____________________________________________________________
function createSeparationColor(i) {
  const card = cards[i + 1]
  const statys = card.querySelector('.statys')
  const cardFinish = card.querySelector('.cardFinish')
  const id = dataLR.cardKey[i]
  if (id == '') {
    createUserRemoval(card, statys, cardFinish)
  } else if (id == privateNum) {
    createUserAssignment(card, statys, cardFinish);
  } else if (id != privateNum && id != "") {
    createBusyUser(card, statys, cardFinish)
  }
  createBreakStart()
  createBreakFinish()
}
function CreateCardAccessControl() {
  for (let i in dataLR.cardKey) {
    for (let i = 0; i < 4; i++) createSeparationColor(+i);
    if (dataLR.cardKey[i] != privateNum) continue;
    for (let i in cards) {
      if (cards[i].classList == "card1") cards[i].classList = "cardBlocked";
    }
    break;
  }
}
// Работа с такймером
function createTimer(timeStamp, time) {
  let realTime = Date.now() - timeStamp;
  let sec = parseInt((realTime / 1000) % 60);
  sec = sec.toString().padStart(2, "0");
  let min = parseInt((realTime / (1000 * 60)) % 60);
  min = min.toString().padStart(2, "0");
  let hours = parseInt((realTime / (1000 * 60 * 60)) % 24);
  if (hours >= 1) {
    time.textContent = "> 1 часа";
    return;
  }
  time.textContent = `${min}:${sec}`;
}
function getTime(timeStamp, time, interval) {
  if (timeStamp == 0) {
    clearInterval(interval);
    time.textContent = "00:00";
  } else  {
    clearInterval(interval);
    return setInterval(createTimer, 1000, timeStamp, time);
  }
}
//_____________________________________________________________
function removeJoinEvents(bt) {
  bt.style.display = "none";
  bt.onclick = null;
}
function checkPresenceQueue() {
  const arr = dataLR.queueValues
  for (let i in arr) {
    for (let k in arr[i]) {
      if (arr[i][k][0] == privateNum) {
        for(let i = 0; i < 4; i++) removeJoinEvents(joinLine[+i])
        return false;
      }
    }
  }
  return true;
}
// Показ кнопки для того что бы встать в очередь
function createQueueButton() {
  const cardKey = dataLR.cardKey
  if (checkPresenceQueue()) {
    for (let i in cardKey) {
      if (cardKey[i] != privateNum && cardKey[i] != "" && cardKey[i] !== undefined) {
        joinLine[i].style.display = "block";
        joinLine[i].onclick = function () {
          sendJoinQueue(+i + 1);
        };
      } else if (cardKey[i] == "" || cardKey[i] === undefined) {
        removeJoinEvents(joinLine[i]);
      } else if (cardKey[i] == privateNum) {
        for(let i = 0; i < 4; i++) removeJoinEvents(joinLine[+i])
        break;
      }
    }
  }
}
//_____________________________________________________________
// Установка наблюдения за картами
for (let i = cardID.length - 1; i >= 0; i--) {
  new MutationObserver(() => {
    createSeparationColor(i)
    CreateCardAccessControl();
    createQueueButton()
    dataLR.intervals[i] = getTime(dataLR.timeStamp[i], time[i], dataLR.intervals[i]);
  }).observe(cardID[i], { childList: true })
}
//_____________________________________________________________
// Вывод пользователей в очереди 
let replacementArray = []
function createPersonalPost(id, queue) {
  const post = document.createElement("div");
  post.setAttribute("class", "post2");
  post.innerHTML = `
  <div></div>
  <div>Вы</div>
  <div>
      <span>Доб.:</span>
      <span>${id}</span>
  </div>
  <button id="replacementBt">Поменяться</button>
  <button id="removQueue">Отменить</button>`;
  queue.appendChild(post);
}
function createPersonalPostReplacing(id, queue) {
  const post = document.createElement("div");
  post.setAttribute("class", "post2");
  post.innerHTML = `
  <div></div>
  <div>Вы</div>
  <div>
      <span>Доб.:</span>
      <span>${id}</span>
  </div>
  <div class="infoReplacement">Выберите пользователя из списка нижи, с кем бы хотели поменяться</div>
  <button id="removQueue">Отменить замену</button>`;
  queue.appendChild(post);
}
function createMemberPost(arr, queue) {
  const post = document.createElement("div");
  post.setAttribute("class", "post1");
  post.innerHTML = `
  <div></div>
  <div>${arr[1]}</div>
  <div>
      <span>Доб.:</span>
      <span>${arr[0]}</span>
  </div>`;
  queue.appendChild(post);
}
function createReplacementCandidate(arr, queue, postNum) {
  const post = document.createElement("div");
  post.setAttribute("class", "post3");
  post.innerHTML = `
  <div></div>
  <div class="nameQueue">${arr[1]}</div>
  <div>
  <span>Доб.:</span>
  <span class="idQueue">${arr[0]}</span>
  </div>`;
  replacementArray.push([arr[0], postNum])
  queue.appendChild(post);
}
//_____________________________________________________________
function createOriginalQueue() {
  for(let i = 0; i < 4; i++) createQueue(dataLR.queueValues[i], queues[i], i + 1);
}
function createQueue(arr, queue, post) {
  queue.innerHTML = "";
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][0] == privateNum) {
      createPersonalPost(arr[i][0], queue);
      createEventsInQueue(arr, post, queue);
    } else {
      createMemberPost(arr[i], queue);
    }
  }
}
let replacementPosts
function removeEventsReplacement() {
  for (let i = 0; i < replacementPosts.length; i++) {
    replacementPosts[i].removeEventListener("click", creatEventsReplacement);
  }
}
function creatEventsReplacement() {
  for (let i = 0; i < replacementPosts.length; i++) {
    if (replacementPosts[i] === this) {
      const name = this.querySelector('.nameQueue').textContent
      const message = `<span style="color: black;">${name}</span> займет Вашу позицию в очереди.`
      getPopupPromiseResult('Поменяться?', message).then(result => {
        if (result) sendReplacementQueue(replacementArray[i])
      })
    }
  }
  removeEventsReplacement();
  createOriginalQueue()
}
function createReplacementQueue() {
  replacementPosts = document.querySelectorAll(".post3");
  for (let i = 0; i < replacementPosts.length; i++) {
    replacementPosts[i].addEventListener("click", creatEventsReplacement);
  }
}
function createQueueReplacing(arr, queue, post) {
  queue.innerHTML = "";
  let i;
  for (i = 0; i < arr.length; i++) {
    if (arr[i][0] == privateNum) {
      createPersonalPostReplacing(arr[i][0], queue);
      createEventsInQueueReplacing();
      break;
    } else {
      createMemberPost(arr[i], queue);
    }
  }
  for (i++; i < arr.length; i++) {
    createReplacementCandidate(arr[i], queue, post);
  }
  createReplacementQueue()
}
function createEventsInQueue(arr, post, queue) {
  const replacementBt = document.querySelector("#replacementBt");
  const removQueue = document.querySelector("#removQueue");
  if (arr[arr.length - 1][0] == privateNum) {
    replacementBt.style.display = "none";
  } else {
    replacementBt.onclick = function () {
      replacementArray = []
      createQueueReplacing(arr, queue, post);
    };
  }
  removQueue.onclick = () => {
    const message = "Если вы хатите покинуть очередь, нажмите подтвердить"
    getPopupPromiseResult('Покинуть очередь?', message).then(result => {
      if (result) sendRemoveQueue(post);
    })
  };
}
function createEventsInQueueReplacing() {
  removQueue.onclick = function () {
    createOriginalQueue();
  };
}
