var socket = io();
(function(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString)
    if(urlParams.get("fileSent") == "true"){
        alert("product was submited")
    }
    if(sessionStorage.getItem("username") && sessionStorage.getItem("key")){
        socket.emit("check", sessionStorage.getItem("username"), sessionStorage.getItem("key"), true)
    }
    else if(localStorage.getItem("username") && localStorage.getItem("key")){
        socket.emit("check", localStorage.getItem("username"), localStorage.getItem("key"), true)
    }
    else{
        window.location.href="index.html"
    }
}())
socket.on("notAllowed", () => {
    sessionStorage.clear()
    localStorage.clear()
    window.location.href="index.html"
})