const btn = document.querySelector(".loginBtn")
const input = document.querySelector("input")
const warning = document.querySelector(".warning")
const incogBtn = document.querySelector(".incogBtn")
input.focus()

function mask(event) {
    event.value = event.value.replace(/\D/g, '')
}

function sendRequest(value) {
    const headers = {
        "Content-Type": "application/json"
    }
    return fetch("http://127.0.0.1:8000/", {
        method: "POST",
        body: JSON.stringify(value),
        headers: headers
    }).then((response) => {
        if (response.ok) return response.json()
        return response.json().then(error => {
            const e = new Error("Что-то пошло не так")
            e.data = error
            throw e 
        })
    })
}

function createAuthorization(){
    if(input.value == ""){
        warning.textContent = "Пожалуйста, заполните поле"
    }else if(input.value != ""){
        if((window.screen.width * window.devicePixelRatio) < 1200){
            warning.textContent = "Разрешение экрана не соответствует требованиям"
            return
        }
        const value = input.value
        input.value = ""
        warning.textContent = ""
    sendRequest(value)
    .then(data => {
        if(data == 404){
            warning.textContent = "Пользователь не найден"
        }else{
            localStorage.setItem("schedule", data[0])
            localStorage.setItem("UserData", JSON.stringify([data[1], data[2]]))
            window.location.href = './'
        }
    })
    .catch(err => console.log(err)) 
    }
}
document.addEventListener('keydown', (event) => {
    if (event.key == "Enter") createAuthorization()
})
btn.addEventListener('click', () => createAuthorization())

incogBtn.addEventListener("click",()=>{
    localStorage.setItem("schedule", 0)
    localStorage.setItem("UserData", JSON.stringify(["0", "Наблюдатель"]))
    window.location.href = './'
})
