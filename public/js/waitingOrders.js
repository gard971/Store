var socket = io();
var orderID = 1;
(function () {
    if (localStorage.getItem("key") && localStorage.getItem("username")) {
        socket.emit("check", localStorage.getItem("username"), localStorage.getItem("key"), true)
    } else if (sessionStorage.getItem("key") && sessionStorage.getItem("username")) {
        socket.emit("check", sessionStorage.getItem("username"), sessionStorage.getItem("key"), true)
    } else {
        window.location.href = "index.html"
    }
})()
socket.on("notAllowed", () => {
    window.location.href = "index.html"
})
socket.on("allowed", () => {
    socket.emit("requestWaitingOrders")
})
socket.on("waitingOrders", (nonJSONOrders) => {
    var orders = JSON.parse(nonJSONOrders)
    orders.forEach(order => {
        var orderDiv = document.createElement("div")
        orderDiv.id = `order${order.orderID}`
        orderDiv.className = "order"
        var header = document.createElement("h3")
        header.innerHTML = `order${orderID}`
        orderDiv.appendChild(header)
        orderID++
        var productName = document.createElement("h4")
        productName.innerHTML = order.Item;
        orderDiv.appendChild(productName)
        var BuyerName = document.createElement("p")
        BuyerName.innerHTML = order.shipping.name
        orderDiv.appendChild(BuyerName)
        var adressInfo = document.createElement("p")
        adressInfo.innerHTML = `${order.shipping.adress}, ${order.shipping.city}, ${order.shipping.postal}`
        orderDiv.appendChild(adressInfo)
        var button = document.createElement("button")
        button.innerHTML = "Mark As Shipped"
        button.onclick = function () {
            shipped(order.orderID, orderDiv)
        }
        orderDiv.appendChild(button)
        document.getElementById("AllOrders").appendChild(orderDiv)
    })
})

function shipped(id, item) {
    socket.emit("ItemShipped", id)
    document.getElementById("AllOrders").removeChild(item)
}
socket.on("RemoveItem", id => {
    var children = document.getElementById("AllOrders").children
    for (var i = 0; i < children.length; i++) {
        var Childid = children[i].id.substr(5)
        if (id == Childid) {
            document.getElementById("AllOrders").removeChild(children[i])
        }
    }
})
socket.on("newOrder", order => {
    var orderDiv = document.createElement("div")
    orderDiv.id = `order${order.orderID}`
    orderDiv.className = "order"
    var header = document.createElement("h3")
    header.innerHTML = `order${orderID}`
    orderDiv.appendChild(header)
    orderID++
    var productName = document.createElement("h4")
    productName.innerHTML = order.Item;
    orderDiv.appendChild(productName)
    var BuyerName = document.createElement("p")
    BuyerName.innerHTML = order.shipping.name
    orderDiv.appendChild(BuyerName)
    var adressInfo = document.createElement("p")
    adressInfo.innerHTML = `${order.shipping.adress}, ${order.shipping.city}, ${order.shipping.postal}`
    orderDiv.appendChild(adressInfo)
    var button = document.createElement("button")
    button.innerHTML = "Mark As Shipped"
    button.onclick = function () {
        shipped(order.orderID, orderDiv)
    }
    orderDiv.appendChild(button)
    document.getElementById("AllOrders").appendChild(orderDiv)
})