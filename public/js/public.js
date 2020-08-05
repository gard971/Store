socket.on("eror", (text) => {
    alert(text)
    console.error(`server returned the following error: ${text}`)
})
socket.on("notAllowed", () => {
    sessionStorage.clear()
    localStorage.clear()
    window.location.href = "index.html"
})
socket.on("404", () => {
    window.location.href = "404.html"
})
socket.on("redir", site => {
    window.location.href = site
})
if (secure) {
    socket.emit("check", sessionStorage.getItem("username"), sessionStorage.getItem("key"))
}