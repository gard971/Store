var secure = true;
var socket = io();
var email
(function(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString)
    if(!urlParams.get("name")){
        alert("eror", "somthing went wrong when trying to view product")
    }
    else{
        socket.emit("requestSpesificProduct", urlParams.get("name"))
    }
})()
socket.on("spesificProduct", (product) => {
    var imgSRC = product.picFileLoc.substring(7)
    document.getElementById("productIMG").src = imgSRC
    document.getElementById("productName").innerHTML = product.name.split("-").join(" ")
    document.getElementById("price").innerHTML = product.cost+"$"
    document.getElementById("buyButton").onclick = function(){
        if(email){
        document.getElementById("buyButton").innerHTML = "processing..."
        socket.emit("buyNow", product.name, email)
        }
        else{
            alert("could not find email. Please refresh the page and try again")
        }
    }
})
socket.on("allowed", () => {
     if(sessionStorage.getItem("username")){
         email = sessionStorage.getItem("username")
     }
     else if(localStorage.getItem("username")){
         email = localStorage.getItem("username")
     }
})