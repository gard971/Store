var secure = true
(function(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString)
    if(!urlParams.get("name")){
        alert("eror", "somthing went wrong when trying to view product")
    }
    else{
        socket.emit("getSpesificProduct", urlParams.get("name"))
    }
})()
socket.on("spesificProduct", (product) => {
    var imgSRC = product.picFileLoc.substring(7)
    document.getElementById("productIMG").src = imgSRC
    document.getElementById("productName").innerHTML = product.name
    document.getElementById("price").innerHTML = product.cost+"$"
    document.getElementById("buyButton").onclick = function(){
        socket.emit("buyNow", product.name)
    }
})