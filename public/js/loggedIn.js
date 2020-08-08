var socket = io();
(function(){
    if(sessionStorage.getItem("username") && sessionStorage.getItem("key")){
        socket.emit("check", sessionStorage.getItem("username"), sessionStorage.getItem("key"))
    }
    else if(localStorage.getItem("username") && sessionStorage.getItem("key")){
        socket.emit("check", localStorage.getItem("username"), sessionStorage.getItem("key"))
    }
    else{
        sessionStorage.clear()
        localStorage.clear()
        window.location.href="index.html"
    }
})()
socket.on("notAllowed", () => {
        sessionStorage.clear()
        localStorage.clear()
        window.location.href="index.html"
})
socket.on("allowed", () => {
    socket.emit("requestProducts")
})
socket.on("products", (NONJSONproducts) => {
    var products = JSON.parse(NONJSONproducts)
    var productNumber = 0;
    products.forEach(product => {
       var div = document.createElement("div")
       div.className = `product`
       div.id=`product${productNumber}`
       productNumber++
       var pic =  document.createElement("img")
       pic.src = product.picFileLoc.substring(7)
       pic.id="productIMG"
       div.appendChild(pic)
       var p = document.createElement("p")
       p.innerHTML = product.name.split("-").join(" ")
       div.appendChild(p)
       div.onclick = function(){
           window.location.href=`/productInfo.html?name=${product.name}`
       }
       document.getElementById("allProducts").appendChild(div)
    })
})