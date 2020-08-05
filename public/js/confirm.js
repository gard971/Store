var socket = io()
$(function(){
    var queryString = window.location.search
    var urlParams = new URLSearchParams(queryString)
    socket.emit("confirm", urlParams.get("id"))
})
socket.on("userConfirmed",() => {
    alert("email has been confirmed!")
    window.location.href="index.html"
})